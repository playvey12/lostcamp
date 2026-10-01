import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { initialProducts, initialCategories } from '../data/products';

import bcrypt from 'bcryptjs';
import { DATA_DIR as SHARED_DATA_DIR } from '../utils/paths';

const PBKDF2_ITERATIONS = 210000;

// Safely parse the JSON stored in users.deliveryInfo; never throw on bad/legacy data.
function parseDeliveryInfo(raw: any): Record<string, any> | null {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch (_e) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;
  if (storedHash === password) return true;
  
  // Check if it's a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    return bcrypt.compareSync(password, storedHash);
  }

  // Fallback check for legacy PBKDF2 hashes
  if (storedHash.includes(':')) {
    const parts = storedHash.split(':');
    let salt: string;
    let iterations: number;
    let originalHash: string;

    if (parts.length === 3) {
      salt = parts[0];
      iterations = parseInt(parts[1], 10) || PBKDF2_ITERATIONS;
      originalHash = parts[2];
    } else if (parts.length === 2) {
      salt = parts[0];
      iterations = 1000;
      originalHash = parts[1];
    } else {
      return false;
    }

    const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    const origBuf = Buffer.from(originalHash, 'hex');
    const calcBuf = Buffer.from(hash, 'hex');
    if (origBuf.length !== calcBuf.length) return false;
    return crypto.timingSafeEqual(origBuf, calcBuf);
  }

  return false;
}


const DATA_DIR = SHARED_DATA_DIR;
const DB_FILE = path.join(DATA_DIR, 'lostcamp.sqlite');

class AsyncLock {
  private promise: Promise<void> = Promise.resolve();

  async acquire<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.promise.then(
      () => fn(),
      () => fn()
    );
    this.promise = result.then(
      () => {},
      () => {}
    );
    return result;
  }
}

const ordersLock = new AsyncLock();

let dbInstance: Database | null = null;
let isInitializing = false;
let initPromise: Promise<Database> | null = null;

let saveTimeout: NodeJS.Timeout | null = null;
let isSaving = false;
let needsSaveAgain = false;

async function performSave(db: Database): Promise<void> {
  if (isSaving) {
    needsSaveAgain = true;
    return;
  }
  isSaving = true;

  const tempFile = path.join(
    DATA_DIR,
    `lostcamp.sqlite.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  );

  try {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    const binaryArray = db.export();
    const buffer = Buffer.from(binaryArray);
    await fs.promises.writeFile(tempFile, buffer);
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save SQLite database file:', err);
    if (fs.existsSync(tempFile)) {
      try {
        await fs.promises.unlink(tempFile);
      } catch (cleanupErr) {
        console.error('Failed to remove temporary DB file:', cleanupErr);
      }
    }
  } finally {
    isSaving = false;
    if (needsSaveAgain) {
      needsSaveAgain = false;
      performSave(db).catch((e) => console.error('Error in queued saveDb:', e));
    }
  }
}

export function saveDb(db: Database) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    performSave(db).catch((e) => console.error('Error in debounced saveDb:', e));
  }, 400);
}

export function flushPersist(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (dbInstance) {
    const tempFile = path.join(
      DATA_DIR,
      `lostcamp.sqlite.tmp-flush-${Date.now()}`
    );
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const binaryArray = dbInstance.export();
      const buffer = Buffer.from(binaryArray);
      fs.writeFileSync(tempFile, buffer);
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to flush SQLite database file synchronously:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// Backup / restore helpers
// ---------------------------------------------------------------------------

// Current in-memory database as a binary SQLite file (always up to date,
// unlike the file on disk which is written with a small debounce).
export async function exportDatabaseBuffer(): Promise<Buffer> {
  const database = await getSqliteDb();
  return Buffer.from(database.export());
}

const SQLITE_HEADER = 'SQLite format 3\u0000';
const REQUIRED_TABLES = ['products', 'orders', 'users', 'categories', 'site_config'];

// Checks that a buffer is a real, healthy SQLite database of this shop.
// Throws an Error with a human readable (Russian) message otherwise.
export async function validateDatabaseBuffer(buffer: Buffer): Promise<void> {
  if (!buffer || buffer.length < 100 || buffer.subarray(0, 16).toString('latin1') !== SQLITE_HEADER) {
    throw new Error('Файл не является базой данных SQLite');
  }
  const SQL = await initSqlJs();
  let candidate: Database | null = null;
  try {
    candidate = new SQL.Database(buffer);
    const check = candidate.exec('PRAGMA integrity_check');
    const verdict = check?.[0]?.values?.[0]?.[0];
    if (verdict !== 'ok') {
      throw new Error('Файл базы данных повреждён (integrity_check не пройден)');
    }
    const res = candidate.exec("SELECT name FROM sqlite_master WHERE type = 'table'");
    const tables = new Set<string>((res?.[0]?.values || []).map((r) => String(r[0])));
    const missing = REQUIRED_TABLES.filter((t) => !tables.has(t));
    if (missing.length > 0) {
      throw new Error(`Это не база LOST CAMP: нет таблиц ${missing.join(', ')}`);
    }
  } catch (err) {
    if (err instanceof Error && /[А-Яа-я]/.test(err.message)) throw err;
    throw new Error('Не удалось прочитать файл как базу данных SQLite');
  } finally {
    if (candidate) candidate.close();
  }
}

// Replaces the live database with the given SQLite file contents.
// The file is validated first; the running server picks the new data up
// immediately (the schema/migrations run again on the next query, so older
// backups are upgraded automatically).
export async function replaceDatabase(buffer: Buffer): Promise<void> {
  await validateDatabaseBuffer(buffer);

  // Stop any pending/queued write of the OLD in-memory database from
  // overwriting the restored file.
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  needsSaveAgain = false;
  for (let i = 0; i < 100 && isSaving; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
  needsSaveAgain = false;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tempFile = path.join(DATA_DIR, `lostcamp.sqlite.tmp-restore-${Date.now()}`);
  await fs.promises.writeFile(tempFile, buffer);
  await fs.promises.rename(tempFile, DB_FILE);

  const old = dbInstance;
  dbInstance = null;
  initPromise = null;
  if (old) {
    try {
      old.close();
    } catch (_e) {
      // ignore
    }
  }
  // Load the restored file right away so a broken restore fails loudly here.
  await getSqliteDb();
}

process.on('SIGINT', () => {
  flushPersist();
  process.exit(0);
});

process.on('SIGTERM', () => {
  flushPersist();
  process.exit(0);
});

async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const SQL = await initSqlJs();

    if (fs.existsSync(DB_FILE)) {
      const filebuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(filebuffer);
    } else {
      dbInstance = new SQL.Database();
    }

    // Initialize Schema
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS categories (
        categoryId TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        items TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        price REAL NOT NULL,
        oldPrice REAL,
        discount TEXT,
        badge TEXT,
        category TEXT,
        image TEXT,
        galleryImages TEXT,
        colorImages TEXT,
        inStock INTEGER,
        description TEXT,
        color TEXT,
        availableColors TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        date TEXT,
        status TEXT,
        total REAL,
        address TEXT,
        fullName TEXT,
        phone TEXT,
        email TEXT,
        deliveryMethod TEXT,
        deliveryCost REAL,
        paymentMethod TEXT,
        comment TEXT,
        items TEXT
      );

      CREATE TABLE IF NOT EXISTS site_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        firstName TEXT,
        lastName TEXT,
        birthDate TEXT,
        address TEXT,
        authProvider TEXT DEFAULT 'google',
        googleId TEXT,
        picture TEXT,
        passwordHash TEXT,
        isVerified INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL
      );
    `);

    try {
      dbInstance.run("ALTER TABLE users ADD COLUMN passwordHash TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE users ADD COLUMN isVerified INTEGER DEFAULT 1");
    } catch (_e) {
      // Column might already exist
    }

    try {
      // Stores the user's last-used checkout delivery details (carrier, city,
      // street/house/apartment or PVZ point, phone, floor/entrance, etc.) as a
      // JSON string, so the checkout form can prefill it next time ("из ЛК").
      dbInstance.run("ALTER TABLE users ADD COLUMN deliveryInfo TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE verification_codes ADD COLUMN purpose TEXT NOT NULL DEFAULT 'register'");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE products ADD COLUMN imageFocalPoint TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE products ADD COLUMN subcategory TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE products ADD COLUMN sku TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE products ADD COLUMN colorGalleries TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE products ADD COLUMN colorFocalPoints TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      dbInstance.run("ALTER TABLE products ADD COLUMN isPromo INTEGER DEFAULT 0");
    } catch (_e) {
      // Column might already exist
    }

    try {
      // Migrate legacy data: products that used the fake category "акции" become
      // regular products (category defaults to "без категории") with isPromo = 1.
      dbInstance.run("UPDATE products SET isPromo = 1, category = 'без категории' WHERE category = 'акции'");
    } catch (_e) {
      // Ignore if migration already applied / column not present yet
    }

    try {
      // YooKassa payment id for this order, so the webhook can find the
      // order a notification refers to.
      dbInstance.run("ALTER TABLE orders ADD COLUMN paymentId TEXT");
    } catch (_e) {
      // Column might already exist
    }

    try {
      // 1 once YooKassa confirms the payment succeeded, 0 otherwise.
      dbInstance.run("ALTER TABLE orders ADD COLUMN paid INTEGER DEFAULT 0");
    } catch (_e) {
      // Column might already exist
    }

    dbInstance.run(`

      CREATE TABLE IF NOT EXISTS verification_codes (
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        purpose TEXT NOT NULL DEFAULT 'register',
        createdAt TEXT NOT NULL,
        PRIMARY KEY (email, purpose)
      );

      CREATE TABLE IF NOT EXISTS subscribers (
        email TEXT PRIMARY KEY,
        subscribedAt TEXT NOT NULL,
        source TEXT DEFAULT 'faq',
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS cart_reminders (
        id TEXT PRIMARY KEY,
        userEmail TEXT UNIQUE NOT NULL,
        cartSnapshot TEXT NOT NULL,
        lastReminderStage INTEGER DEFAULT 0,
        lastSentAt TEXT,
        createdAt TEXT NOT NULL,
        status TEXT DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        userName TEXT,
        rating INTEGER,
        text TEXT,
        photos TEXT,
        date TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        subtitle TEXT,
        date TEXT NOT NULL,
        tags TEXT,
        content TEXT,
        mediaLayout TEXT NOT NULL DEFAULT '1_photo',
        image1 TEXT,
        image2 TEXT,
        image3 TEXT,
        videoUrl TEXT,
        coverImage TEXT,
        coverFocalPoint TEXT,
        createdAt TEXT NOT NULL
      );
    `);

    try {
      dbInstance.run("ALTER TABLE news ADD COLUMN image3 TEXT;");
    } catch (_e) {
      // Column already exists
    }

    try {
      dbInstance.run("ALTER TABLE news ADD COLUMN coverImage TEXT;");
    } catch (_e) {
      // Column already exists
    }

    try {
      dbInstance.run("ALTER TABLE news ADD COLUMN coverFocalPoint TEXT;");
    } catch (_e) {
      // Column already exists
    }

    // Seed initial news if empty
    const newsStmt = dbInstance.prepare("SELECT COUNT(*) as count FROM news");
    if (newsStmt.step()) {
      const row = newsStmt.getAsObject();
      if (row.count === 0) {
        const initialNews = [
          {
            title: 'выставка «Национальная безопасность Беларусь 2026»',
            subtitle: 'Выставка «Национальная безопасность 2026»',
            date: '00.00.2026',
            tags: 'новости | выставка | безопасность',
            content: `В Беларуси проходит выставка «Национальная безопасность Беларусь 2026». Это не просто выставка, это место, где встречаются профессионалы, ищущие лучшие решения для защиты, поэтому продукция Lost Camp представлена на международной выставке индустрии безопасности.\n\nТовары бренда Lost Camp – это не просто демонстрация продукции, а отражение стремления к высочайшим стандартам качества и надежности, которые необходимы в условиях повышенных требований к безопасности. Мы знаем, что в мире, где ставки высоки, доверие – это главное. Наша цель – дать вам уверенность в каждом элементе экипировки. Видеть ваш интерес и признание на такой площадке – лучшее подтверждение того, что мы на правильном пути.\n---SPLIT---\nВыбирая экипировку Lost Camp, вы выбираете:\n· Надежность: Проверенная в реальных условиях.\n· Инновации: Передовые технологии для вашей безопасности.\n· Экспертизу: Знания и опыт, воплощенные в каждом изделии.\n\nВаша безопасность – наш приоритет.`,
            mediaLayout: '3_photo',
            image1: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
            image2: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
            image3: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80',
            videoUrl: '',
          },
          {
            title: 'Как правильно ухаживать за плитником?',
            subtitle: 'инструкция/советы | видео/фото',
            date: '00.00.2026',
            tags: 'инструкция/советы | видео/фото',
            content: `Ваш плитник — это ваша надежная защита, поэтому важно заботиться о нем правильно. Хороший уход сохраняет его эффективность и продлевает срок службы. Вот основные моменты, которые нужно знать:\n\nЧего стоит избегать:\n·  Машинная стирка: Использование стиральной машины повредит материалы, особенно баллистические волокна. Их структура нежная, и механическое трение снизит защитные свойства.\n·  Высокие температуры: Сушка или хранение при жаре (свыше 50°С) сильно повреждают волокна, делая защиту менее надежной со временем.\n·  Влага и деформация: Храните плитник в сухом месте, избегайте сдавливания или хранения в сложенных положениях. Влага вызывает гниение и снижение прочности материалов.\n·  Игнорирование проверки: Регулярно осматривайте защитное снаряжение на наличие трещин, разрывов или износа.\n·  Химикаты и агрессивные средства: Не используйте ацетон, растворители, сильные моющие средства. Они разрушают волокна и снижают свойства материала.\n\nЛучшие способы ухода:\n·  Мягкая ручная стирка: Используйте теплую воду с мягким, небьющимся мылом (например, кастильским или деликатным средством). Тщательно очистите, избегая жестких губок или щеток, чтобы не повредить структуру.\n·  Высушивание на воздухе: После мытья расправьте и высушите в тени или в прохладном помещении. Не допускайте прямого солнечного света — ультрафиолет разрушает волокна.\n·  Правильное хранение: Храните плитник в горизонтальном положении, в сухом месте, в специальной сумке или мешке для защиты от пыли и загрязнений. Не складывайте и не крутите их — это снижает эффективность.\n\nДополнительные советы:\n·  Следите за состоянием: Проверяйте регулярно на наличие повреждений и износа.\n·  Избегайте экстремальных условий: Не оставляйте защиту под дождем, в сильной жаре или на морозе — эти условия сокращают срок службы материалов.\n\n[SUMMARY]\nСледуя этим простым рекомендациям, вы обеспечите вашей защите долгую службу и сохраните её эффективность.`,
            mediaLayout: '1_photo_1_video',
            image1: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=1200&q=80',
            image2: '',
            image3: '',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          },
          {
            title: 'Обновленная серия плитников Ракурс М3: усиленные материалы и быстрый сброс',
            subtitle: 'Обновление серии Плитников Ракурс М3',
            date: '18.06.2026',
            tags: 'обзор | снаряжение | новости',
            content: 'Ваш плитник — это ваша надежная защита, поэтому важно заботиться о нем правильно. Обновленная серия Ракурс М3 получила усиленные плечевые лямки с системой быстрого сброса на фурнитуре 2M ROC. Внутренняя поверхность снабжена 3D-сеткой для дополнительного воздухообмена.',
            mediaLayout: '1_photo',
            image1: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?auto=format&fit=crop&w=800&q=80',
            image2: '',
            image3: '',
            videoUrl: '',
          },
          {
            title: 'Результаты лабораторных испытаний Cordura 1000D на истирание и разрыв',
            subtitle: 'Тестирование тканевых составов Cordura 1000D',
            date: '10.06.2026',
            tags: 'производство | тесты | материалы',
            content: 'Лабораторные тесты показали превосходство оригинального материала Cordura 1000D над аналогами. При тесте Мартиндейла ткань выдержала свыше 100,000 циклов истирания без нарушения структуры нитей.',
            mediaLayout: '2_photo',
            image1: 'https://images.unsplash.com/photo-1542332213-315a42dde89b?auto=format&fit=crop&w=800&q=80',
            image2: 'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=800&q=80',
            image3: '',
            videoUrl: '',
          },
          {
            title: 'Полевые испытания экипировки LOST CAMP на суточном полигонном марше',
            subtitle: 'Полевой выезд инструкторской группы',
            date: '02.06.2026',
            tags: 'инструкция | советы | полевой отчет',
            content: 'Инструкторская группа LOST CAMP провела суточный марш-бросок с полной экипировкой. Были протестированы разгрузочно-поясные системы, гидраторные модули и подсумки под магазин АК.',
            mediaLayout: '1_photo_1_video',
            image1: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
            image2: '',
            image3: '',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          }
        ];

        for (const item of initialNews) {
          dbInstance.run(
            `INSERT INTO news (title, subtitle, date, tags, content, mediaLayout, image1, image2, image3, videoUrl, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              item.title,
              item.subtitle,
              item.date,
              item.tags,
              item.content,
              item.mediaLayout,
              item.image1,
              item.image2,
              item.image3 || '',
              item.videoUrl,
              new Date().toISOString()
            ]
          );
        }
      }
    }
    newsStmt.free();

    // Seed initial categories if empty
    const catStmt = dbInstance.prepare("SELECT COUNT(*) as count FROM categories");
    if (catStmt.step()) {
      const row = catStmt.getAsObject();
      if (row.count === 0) {
        for (const cat of initialCategories) {
          dbInstance.run(
            "INSERT INTO categories (categoryId, title, items) VALUES (?, ?, ?)",
            [cat.categoryId, cat.title, JSON.stringify(cat.items || [])]
          );
        }
      }
    }
    catStmt.free();

    // Seed initial products if empty
    const prodStmt = dbInstance.prepare("SELECT COUNT(*) as count FROM products");
    if (prodStmt.step()) {
      const row = prodStmt.getAsObject();
      if (row.count === 0) {
        for (const p of initialProducts) {
          dbInstance.run(
            `INSERT INTO products (id, title, price, oldPrice, discount, badge, category, image, galleryImages, colorImages, inStock, isPromo, description, color, availableColors)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id,
              p.title,
              p.price,
              p.oldPrice || null,
              p.discount || null,
              p.badge || null,
              p.category,
              p.image,
              JSON.stringify(p.galleryImages || [p.image]),
              JSON.stringify(p.colorImages || {}),
              p.inStock ? 1 : 0,
              (p as any).isPromo ? 1 : 0,
              p.description || '',
              p.color || 'олива',
              JSON.stringify(p.availableColors || ['олива', 'мох', 'мультикам'])
            ]
          );
        }
      }
    }
    prodStmt.free();

    // Seed site config if empty
    const siteStmt = dbInstance.prepare("SELECT COUNT(*) as count FROM site_config");
    if (siteStmt.step()) {
      const row = siteStmt.getAsObject();
      if (row.count === 0) {
        dbInstance.run(
          "INSERT INTO site_config (key, value) VALUES ('heroVideoUrl', '')"
        );
        dbInstance.run(
          "INSERT INTO site_config (key, value) VALUES ('videoHistory', '[]')"
        );
      }
    }
    siteStmt.free();

    // Remove legacy admin user from users table if present (admin exists only via ADMIN_PASSWORD)
    try {
      const cleanupStmt = dbInstance.prepare("SELECT COUNT(*) as count FROM users WHERE id = 'admin' OR LOWER(email) = 'admin@lostcamp.ru'");
      if (cleanupStmt.step()) {
        const row = cleanupStmt.getAsObject();
        if (Number(row.count) > 0) {
          dbInstance.run("DELETE FROM users WHERE id = 'admin' OR LOWER(email) = 'admin@lostcamp.ru'");
          console.log(`[Migration] Removed ${row.count} legacy admin user record(s) from database.`);
        }
      }
      cleanupStmt.free();
    } catch (cleanupErr) {
      console.error('[Migration] Failed to clean up legacy admin user:', cleanupErr);
    }

    saveDb(dbInstance);
    return dbInstance;
  })();

  return initPromise;
}

export const db = {
  hashPassword,
  verifyPassword,
  // Categories
  async getCategories(): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT categoryId, title, items FROM categories");
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        categoryId: row.categoryId,
        title: row.title,
        items: JSON.parse((row.items as string) || '[]')
      });
    }
    stmt.free();
    return results;
  },

  async saveCategories(categories: any[]): Promise<void> {
    const database = await getSqliteDb();
    try {
      database.run("BEGIN TRANSACTION;");
      database.run("DELETE FROM categories");
      for (const cat of categories) {
        database.run(
          "INSERT INTO categories (categoryId, title, items) VALUES (?, ?, ?)",
          [cat.categoryId, cat.title, JSON.stringify(cat.items || [])]
        );
      }
      database.run("COMMIT;");
    } catch (err) {
      try { database.run("ROLLBACK;"); } catch (_) {}
      throw err;
    }
    saveDb(database);
  },

  async deleteCategory(id: string): Promise<void> {
    const database = await getSqliteDb();
    const rawId = id.trim();
    const normalizedId = rawId.toLowerCase();

    // 1. Find the target category and its categoryId and title using JavaScript lowercasing
    const stmt = database.prepare("SELECT categoryId, title FROM categories");
    const matchedCategoryIds: string[] = [];
    const matchedTitles: string[] = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      const catId = String(row.categoryId || '');
      const title = String(row.title || '');

      if (
        catId === rawId ||
        title === rawId ||
        catId.trim().toLowerCase() === normalizedId ||
        title.trim().toLowerCase() === normalizedId
      ) {
        matchedCategoryIds.push(catId);
        matchedTitles.push(title);
      }
    }
    stmt.free();

    if (matchedCategoryIds.length === 0) {
      matchedCategoryIds.push(rawId);
    }

    // 2. Perform deletion and update linked products inside a transaction
    try {
      database.run("BEGIN TRANSACTION;");

      // Update linked products to "без категории"
      for (const catTitle of matchedTitles) {
        database.run(
          "UPDATE products SET category = 'без категории' WHERE category = ?",
          [catTitle]
        );
      }
      for (const catId of matchedCategoryIds) {
        database.run(
          "UPDATE products SET category = 'без категории' WHERE category = ?",
          [catId]
        );
      }

      // Delete category by exact categoryId or title found in JS
      for (const catId of matchedCategoryIds) {
        database.run(
          "DELETE FROM categories WHERE categoryId = ?",
          [catId]
        );
      }
      for (const catTitle of matchedTitles) {
        database.run(
          "DELETE FROM categories WHERE title = ?",
          [catTitle]
        );
      }

      // Fallback direct delete
      database.run(
        "DELETE FROM categories WHERE categoryId = ? OR title = ?",
        [rawId, rawId]
      );

      database.run("COMMIT;");
    } catch (err) {
      try { database.run("ROLLBACK;"); } catch (_) {}
      throw err;
    }

    saveDb(database);
  },

  // Products
  async getProducts(): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM products ORDER BY id DESC");
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        title: row.title,
        price: row.price,
        oldPrice: row.oldPrice ? Number(row.oldPrice) : undefined,
        discount: row.discount || undefined,
        badge: row.badge || undefined,
        category: row.category,
        subcategory: row.subcategory || undefined,
        sku: row.sku || undefined,
        image: row.image,
        galleryImages: JSON.parse((row.galleryImages as string) || '[]'),
        colorImages: JSON.parse((row.colorImages as string) || '{}'),
        colorGalleries: row.colorGalleries ? JSON.parse(row.colorGalleries as string) : undefined,
        colorFocalPoints: row.colorFocalPoints ? JSON.parse(row.colorFocalPoints as string) : undefined,
        inStock: row.inStock !== 0 && String(row.inStock) !== '0',
        isPromo: row.isPromo === 1 || row.isPromo === '1',
        description: row.description || '',
        color: row.color || 'олива',
        availableColors: JSON.parse((row.availableColors as string) || '["олива","мох"]'),
        imageFocalPoint: row.imageFocalPoint ? JSON.parse(row.imageFocalPoint as string) : undefined
      });
    }
    stmt.free();
    return results;
  },

  async saveProducts(products: any[]): Promise<void> {
    const database = await getSqliteDb();
    try {
      database.run("BEGIN TRANSACTION;");
      database.run("DELETE FROM products");
      for (const p of products) {
        database.run(
          `INSERT INTO products (id, title, price, oldPrice, discount, badge, category, subcategory, sku, image, galleryImages, colorImages, colorGalleries, colorFocalPoints, inStock, isPromo, description, color, availableColors, imageFocalPoint)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.title,
            p.price,
            p.oldPrice || null,
            p.discount || null,
            p.badge || null,
            p.category,
            p.subcategory || null,
            p.sku || null,
            p.image,
            JSON.stringify(p.galleryImages || [p.image]),
            JSON.stringify(p.colorImages || {}),
            p.colorGalleries ? JSON.stringify(p.colorGalleries) : null,
            p.colorFocalPoints ? JSON.stringify(p.colorFocalPoints) : null,
            p.inStock ? 1 : 0,
            p.isPromo ? 1 : 0,
            p.description || '',
            p.color || 'олива',
            JSON.stringify(p.availableColors || ['олива', 'мох', 'мультикам']),
            p.imageFocalPoint ? JSON.stringify(p.imageFocalPoint) : null
          ]
        );
      }
      database.run("COMMIT;");
    } catch (err) {
      try { database.run("ROLLBACK;"); } catch (_) {}
      throw err;
    }
    saveDb(database);
  },

  async deleteProduct(id: number): Promise<void> {
    const database = await getSqliteDb();
    database.run("DELETE FROM products WHERE id = ?", [id]);
    saveDb(database);
  },

  async updateProduct(id: number, p: any): Promise<any> {
    const database = await getSqliteDb();

    const stmt = database.prepare("SELECT * FROM products WHERE id = ?");
    stmt.bind([id]);
    let existing: any = null;
    if (stmt.step()) {
      existing = stmt.getAsObject();
    }
    stmt.free();

    if (!existing) {
      throw new Error('Товар не найден');
    }

    const title = p.title !== undefined ? p.title : existing.title;
    const price = p.price !== undefined ? p.price : existing.price;
    const oldPrice = p.oldPrice !== undefined ? (p.oldPrice || null) : existing.oldPrice;
    const discount = p.discount !== undefined ? (p.discount || null) : existing.discount;
    const badge = p.badge !== undefined ? (p.badge || null) : existing.badge;
    const category = p.category !== undefined ? p.category : existing.category;
    const subcategory = p.subcategory !== undefined ? (p.subcategory || null) : existing.subcategory;
    const sku = p.sku !== undefined ? (p.sku || null) : existing.sku;
    const image = p.image !== undefined ? p.image : existing.image;
    const galleryImages = p.galleryImages !== undefined ? JSON.stringify(p.galleryImages) : existing.galleryImages;
    const colorImages = p.colorImages !== undefined ? JSON.stringify(p.colorImages) : existing.colorImages;
    const colorGalleries = p.colorGalleries !== undefined ? (p.colorGalleries ? JSON.stringify(p.colorGalleries) : null) : existing.colorGalleries;
    const colorFocalPoints = p.colorFocalPoints !== undefined ? (p.colorFocalPoints ? JSON.stringify(p.colorFocalPoints) : null) : existing.colorFocalPoints;
    const inStock = p.inStock !== undefined ? (p.inStock ? 1 : 0) : existing.inStock;
    const isPromo = p.isPromo !== undefined ? (p.isPromo ? 1 : 0) : (existing.isPromo ? 1 : 0);
    const description = p.description !== undefined ? p.description : existing.description;
    const color = p.color !== undefined ? p.color : existing.color;
    const availableColors = p.availableColors !== undefined ? JSON.stringify(p.availableColors) : existing.availableColors;
    const imageFocalPoint = p.imageFocalPoint !== undefined ? (p.imageFocalPoint ? JSON.stringify(p.imageFocalPoint) : null) : existing.imageFocalPoint;

    database.run(
      `UPDATE products 
       SET title = ?, price = ?, oldPrice = ?, discount = ?, badge = ?, category = ?, subcategory = ?, sku = ?, image = ?, galleryImages = ?, colorImages = ?, colorGalleries = ?, colorFocalPoints = ?, inStock = ?, isPromo = ?, description = ?, color = ?, availableColors = ?, imageFocalPoint = ?
       WHERE id = ?`,
      [
        title,
        price,
        oldPrice,
        discount,
        badge,
        category,
        subcategory,
        sku,
        image,
        galleryImages,
        colorImages,
        colorGalleries,
        colorFocalPoints,
        inStock,
        isPromo,
        description,
        color,
        availableColors,
        imageFocalPoint,
        id
      ]
    );
    saveDb(database);

    return {
      id,
      title,
      price,
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      discount: discount || undefined,
      badge: badge || undefined,
      category,
      subcategory: subcategory || undefined,
      sku: sku || undefined,
      image,
      galleryImages: typeof galleryImages === 'string' ? JSON.parse(galleryImages || '[]') : galleryImages,
      colorImages: typeof colorImages === 'string' ? JSON.parse(colorImages || '{}') : colorImages,
      colorGalleries: typeof colorGalleries === 'string' ? JSON.parse(colorGalleries || '{}') : colorGalleries,
      colorFocalPoints: typeof colorFocalPoints === 'string' ? JSON.parse(colorFocalPoints || '{}') : colorFocalPoints,
      inStock: inStock !== 0 && String(inStock) !== '0',
      isPromo: isPromo === 1 || String(isPromo) === '1',
      description: description || '',
      color: color || 'олива',
      availableColors: typeof availableColors === 'string' ? JSON.parse(availableColors || '["олива","мох"]') : availableColors,
      imageFocalPoint: typeof imageFocalPoint === 'string' ? JSON.parse(imageFocalPoint || 'null') : imageFocalPoint,
    };
  },

  async addProduct(p: any): Promise<any> {
    const database = await getSqliteDb();
    const id = p.id || Date.now();
    database.run(
      `INSERT INTO products (id, title, price, oldPrice, discount, badge, category, subcategory, sku, image, galleryImages, colorImages, colorGalleries, colorFocalPoints, inStock, isPromo, description, color, availableColors, imageFocalPoint)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        p.title,
        p.price,
        p.oldPrice || null,
        p.discount || null,
        p.badge || null,
        p.category,
        p.subcategory || null,
        p.sku || null,
        p.image,
        JSON.stringify(p.galleryImages || [p.image]),
        JSON.stringify(p.colorImages || {}),
        p.colorGalleries ? JSON.stringify(p.colorGalleries) : null,
        p.colorFocalPoints ? JSON.stringify(p.colorFocalPoints) : null,
        p.inStock ? 1 : 0,
        p.isPromo ? 1 : 0,
        p.description || '',
        p.color || 'олива',
        JSON.stringify(p.availableColors || ['олива', 'мох', 'мультикам']),
        p.imageFocalPoint ? JSON.stringify(p.imageFocalPoint) : null
      ]
    );
    saveDb(database);

    const stmt = database.prepare("SELECT * FROM products WHERE id = ?");
    stmt.bind([id]);
    let created: any = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      created = {
        id: row.id,
        title: row.title,
        price: row.price,
        oldPrice: row.oldPrice ? Number(row.oldPrice) : undefined,
        discount: row.discount || undefined,
        badge: row.badge || undefined,
        category: row.category,
        subcategory: row.subcategory || undefined,
        sku: row.sku || undefined,
        image: row.image,
        galleryImages: JSON.parse((row.galleryImages as string) || '[]'),
        colorImages: JSON.parse((row.colorImages as string) || '{}'),
        colorGalleries: row.colorGalleries ? JSON.parse(row.colorGalleries as string) : undefined,
        colorFocalPoints: row.colorFocalPoints ? JSON.parse(row.colorFocalPoints as string) : undefined,
        inStock: row.inStock !== 0 && String(row.inStock) !== '0',
        isPromo: row.isPromo === 1 || row.isPromo === '1',
        description: row.description || '',
        color: row.color || 'олива',
        availableColors: JSON.parse((row.availableColors as string) || '["олива","мох"]'),
        imageFocalPoint: row.imageFocalPoint ? JSON.parse(row.imageFocalPoint as string) : undefined
      };
    }
    stmt.free();
    return created;
  },

  // Orders
  async withOrdersLock<T>(fn: () => Promise<T>): Promise<T> {
    return ordersLock.acquire(fn);
  },

  async getOrders(): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM orders");
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        date: row.date,
        status: row.status,
        total: Number(row.total),
        address: row.address || '',
        fullName: row.fullName || '',
        phone: row.phone || '',
        email: row.email || '',
        deliveryMethod: row.deliveryMethod || '',
        deliveryCost: Number(row.deliveryCost) || 0,
        paymentMethod: row.paymentMethod || '',
        comment: row.comment || '',
        items: JSON.parse((row.items as string) || '[]'),
        paymentId: row.paymentId || undefined,
        paid: row.paid === 1 || row.paid === '1'
      });
    }
    stmt.free();
    return results;
  },

  async saveOrders(orders: any[]): Promise<void> {
    const database = await getSqliteDb();
    try {
      database.run("BEGIN TRANSACTION;");
      database.run("DELETE FROM orders");
      for (const o of orders) {
        database.run(
          `INSERT INTO orders (id, date, status, total, address, fullName, phone, email, deliveryMethod, deliveryCost, paymentMethod, comment, items, paymentId, paid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            o.id,
            o.date || '',
            o.status || 'В обработке',
            o.total || 0,
            o.address || '',
            o.fullName || '',
            o.phone || '',
            o.email || '',
            o.deliveryMethod || '',
            o.deliveryCost || 0,
            o.paymentMethod || '',
            o.comment || '',
            JSON.stringify(o.items || []),
            o.paymentId || null,
            o.paid ? 1 : 0
          ]
        );
      }
      database.run("COMMIT;");
    } catch (err) {
      try { database.run("ROLLBACK;"); } catch (_) {}
      throw err;
    }
    saveDb(database);
  },

  // Finds a single order by its YooKassa payment id (used by the payment
  // webhook, which only knows the payment id, not the order id).
  async getOrderByPaymentId(paymentId: string): Promise<any | null> {
    const orders = await this.getOrders();
    return orders.find((o: any) => o.paymentId === paymentId) || null;
  },

  // Site Config
  async getSite(): Promise<{
    heroVideoUrl: string;
    videoHistory: any[];
    frameProductId?: number | null;
    frameSectionContent?: any;
    heroBannerConfig?: any;
    heroBannerTemplates?: any[];
    popularProductIds?: number[];
    promoProductIds?: number[];
  }> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT key, value FROM site_config");
    let heroVideoUrl = '';
    let videoHistory: any[] = [];
    let frameProductId: number | null = null;
    let frameSectionContent: any = null;
    let heroBannerConfig: any = null;
    let heroBannerTemplates: any[] = [];
    let popularProductIds: number[] = [];
    let promoProductIds: number[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.key === 'heroVideoUrl') {
        heroVideoUrl = row.value as string;
      } else if (row.key === 'videoHistory') {
        try {
          videoHistory = JSON.parse(row.value as string);
        } catch {
          videoHistory = [];
        }
      } else if (row.key === 'frameProductId') {
        const parsed = parseInt(row.value as string, 10);
        frameProductId = isNaN(parsed) ? null : parsed;
      } else if (row.key === 'frameSectionContent') {
        try {
          frameSectionContent = JSON.parse(row.value as string);
        } catch {
          frameSectionContent = null;
        }
      } else if (row.key === 'heroBannerConfig') {
        try {
          heroBannerConfig = JSON.parse(row.value as string);
        } catch {
          heroBannerConfig = null;
        }
      } else if (row.key === 'heroBannerTemplates') {
        try {
          heroBannerTemplates = JSON.parse(row.value as string);
        } catch {
          heroBannerTemplates = [];
        }
      } else if (row.key === 'popularProductIds') {
        try {
          popularProductIds = JSON.parse(row.value as string);
        } catch {
          popularProductIds = [];
        }
      } else if (row.key === 'promoProductIds') {
        try {
          promoProductIds = JSON.parse(row.value as string);
        } catch {
          promoProductIds = [];
        }
      }
    }
    stmt.free();
    return {
      heroVideoUrl,
      videoHistory,
      frameProductId,
      frameSectionContent,
      heroBannerConfig,
      heroBannerTemplates,
      popularProductIds,
      promoProductIds,
    };
  },

  async saveSite(data: {
    heroVideoUrl?: string;
    videoHistory?: any[];
    frameProductId?: number | null;
    frameSectionContent?: any;
    heroBannerConfig?: any;
    heroBannerTemplates?: any[];
    popularProductIds?: number[];
    promoProductIds?: number[];
  }): Promise<void> {
    const database = await getSqliteDb();
    if (data.heroVideoUrl !== undefined) {
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('heroVideoUrl', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [data.heroVideoUrl, data.heroVideoUrl]
      );
    }
    if (data.videoHistory !== undefined) {
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('videoHistory', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [JSON.stringify(data.videoHistory), JSON.stringify(data.videoHistory)]
      );
    }
    if (data.frameProductId !== undefined) {
      const valStr = data.frameProductId === null || data.frameProductId === undefined ? '' : String(data.frameProductId);
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('frameProductId', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [valStr, valStr]
      );
    }
    if (data.popularProductIds !== undefined) {
      const valStr = JSON.stringify(data.popularProductIds || []);
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('popularProductIds', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [valStr, valStr]
      );
    }
    if (data.promoProductIds !== undefined) {
      const valStr = JSON.stringify(data.promoProductIds || []);
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('promoProductIds', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [valStr, valStr]
      );
    }
    if (data.frameSectionContent !== undefined) {
      const valStr = data.frameSectionContent ? JSON.stringify(data.frameSectionContent) : '';
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('frameSectionContent', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [valStr, valStr]
      );
    }
    if (data.heroBannerConfig !== undefined) {
      const valStr = data.heroBannerConfig ? JSON.stringify(data.heroBannerConfig) : '';
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('heroBannerConfig', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [valStr, valStr]
      );
    }
    if (data.heroBannerTemplates !== undefined) {
      const valStr = data.heroBannerTemplates ? JSON.stringify(data.heroBannerTemplates) : '';
      database.run(
        "INSERT INTO site_config (key, value) VALUES ('heroBannerTemplates', ?) ON CONFLICT(key) DO UPDATE SET value = ?",
        [valStr, valStr]
      );
    }
    saveDb(database);
  },

  // Users (Google Auth / Registered Users)
  async getUsers(): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM users ORDER BY createdAt DESC");
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        email: row.email,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        birthDate: row.birthDate || '',
        address: row.address || '',
        deliveryInfo: parseDeliveryInfo(row.deliveryInfo),
        authProvider: row.authProvider || 'google',
        googleId: row.googleId || '',
        picture: row.picture || '',
        createdAt: row.createdAt
      });
    }
    stmt.free();
    return results;
  },

  async getUserByEmail(email: string): Promise<any> {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM users WHERE LOWER(email) = ?");
    stmt.bind([cleanEmail]);
    let user = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      user = {
        id: row.id,
        email: row.email,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        birthDate: row.birthDate || '',
        address: row.address || '',
        deliveryInfo: parseDeliveryInfo(row.deliveryInfo),
        authProvider: row.authProvider || 'google',
        googleId: row.googleId || '',
        picture: row.picture || '',
        passwordHash: row.passwordHash || '',
        isVerified: row.isVerified === undefined ? 1 : Number(row.isVerified),
        createdAt: row.createdAt
      };
    }
    stmt.free();
    return user;
  },

  async upsertUser(user: {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    address?: string;
    authProvider?: string;
    googleId?: string;
    picture?: string;
    passwordHash?: string;
    isVerified?: number;
  }): Promise<any> {
    const database = await getSqliteDb();
    const id = user.id || `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();
    const isVerifiedVal = user.isVerified !== undefined ? user.isVerified : 1;

    database.run(
      `INSERT INTO users (id, email, firstName, lastName, birthDate, address, authProvider, googleId, picture, passwordHash, isVerified, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         firstName = COALESCE(NULLIF(EXCLUDED.firstName, ''), users.firstName),
         lastName = COALESCE(NULLIF(EXCLUDED.lastName, ''), users.lastName),
         birthDate = COALESCE(NULLIF(EXCLUDED.birthDate, ''), users.birthDate),
         address = COALESCE(NULLIF(EXCLUDED.address, ''), users.address),
         googleId = COALESCE(NULLIF(EXCLUDED.googleId, ''), users.googleId),
         picture = COALESCE(NULLIF(EXCLUDED.picture, ''), users.picture),
         passwordHash = COALESCE(EXCLUDED.passwordHash, users.passwordHash),
         isVerified = EXCLUDED.isVerified`,
      [
        id,
        user.email,
        user.firstName || '',
        user.lastName || '',
        user.birthDate || '',
        user.address || '',
        user.authProvider || 'google',
        user.googleId || '',
        user.picture || '',
        user.passwordHash || null,
        isVerifiedVal,
        createdAt
      ]
    );

    saveDb(database);

    // Fetch and return updated user
    const stmt = database.prepare("SELECT * FROM users WHERE email = ?");
    stmt.bind([user.email]);
    let result = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      result = {
        id: row.id,
        email: row.email,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        birthDate: row.birthDate || '',
        address: row.address || '',
        authProvider: row.authProvider || 'google',
        googleId: row.googleId || '',
        picture: row.picture || '',
        hasPassword: Boolean(row.passwordHash),
        isVerified: Number(row.isVerified),
        createdAt: row.createdAt
      };
    }
    stmt.free();
    return result;
  },

  async setUserVerified(email: string): Promise<void> {
    const database = await getSqliteDb();
    database.run(
      `UPDATE users SET isVerified = 1 WHERE LOWER(email) = ?`,
      [email.toLowerCase().trim()]
    );
    saveDb(database);
  },

  async deleteUserByEmail(email: string): Promise<void> {
    const database = await getSqliteDb();
    database.run(
      `DELETE FROM users WHERE LOWER(email) = ?`,
      [email.toLowerCase().trim()]
    );
    saveDb(database);
  },


  async updateUserProfile(
    email: string,
    updates: {
      firstName?: string;
      lastName?: string;
      birthDate?: string;
      age?: number | string;
      address?: string;
      deliveryInfo?: Record<string, any> | null;
    }
  ): Promise<any> {
    const database = await getSqliteDb();
    const existing = await this.getUserByEmail(email);
    if (!existing) return null;

    const firstName = updates.firstName !== undefined ? updates.firstName : existing.firstName;
    const lastName = updates.lastName !== undefined ? updates.lastName : existing.lastName;
    const birthDate = updates.birthDate !== undefined ? String(updates.birthDate) : (updates.age !== undefined ? String(updates.age) : existing.birthDate);
    const address = updates.address !== undefined ? updates.address : existing.address;
    const deliveryInfo =
      updates.deliveryInfo !== undefined
        ? (updates.deliveryInfo ? JSON.stringify(updates.deliveryInfo) : '')
        : (existing.deliveryInfo ? JSON.stringify(existing.deliveryInfo) : '');

    database.run(
      `UPDATE users SET firstName = ?, lastName = ?, birthDate = ?, address = ?, deliveryInfo = ? WHERE email = ?`,
      [firstName, lastName, birthDate, address, deliveryInfo, email.toLowerCase().trim()]
    );

    saveDb(database);
    return await this.getUserByEmail(email);
  },

  async updateUserPassword(email: string, passwordHash: string): Promise<boolean> {
    const database = await getSqliteDb();
    database.run(
      `UPDATE users SET passwordHash = ? WHERE email = ?`,
      [passwordHash, email.toLowerCase().trim()]
    );
    saveDb(database);
    return true;
  },

  async updateUserEmail(oldEmail: string, newEmail: string): Promise<any> {
    const database = await getSqliteDb();
    const cleanOld = oldEmail.toLowerCase().trim();
    const cleanNew = newEmail.toLowerCase().trim();

    database.run(
      `UPDATE users SET email = ? WHERE LOWER(email) = ?`,
      [cleanNew, cleanOld]
    );

    try {
      database.run(
        `UPDATE orders SET email = ? WHERE LOWER(email) = ?`,
        [cleanNew, cleanOld]
      );
    } catch (_e) {}

    try {
      database.run(
        `UPDATE cart_reminders SET userEmail = ? WHERE LOWER(userEmail) = ?`,
        [cleanNew, cleanOld]
      );
    } catch (_e) {}

    try {
      database.run(
        `UPDATE subscribers SET email = ? WHERE LOWER(email) = ?`,
        [cleanNew, cleanOld]
      );
    } catch (_e) {}

    saveDb(database);
    return await this.getUserByEmail(cleanNew);
  },

  // Verification Codes (with purpose: 'register' | 'reset')
  async saveVerificationCode(email: string, code: string, purpose: string = 'register'): Promise<void> {
    const database = await getSqliteDb();
    const createdAt = new Date().toISOString();
    const cleanEmail = email.toLowerCase().trim();
    try {
      database.run("DELETE FROM verification_codes WHERE email = ? AND purpose = ?", [cleanEmail, purpose]);
    } catch (_e) {
      database.run("DELETE FROM verification_codes WHERE email = ?", [cleanEmail]);
    }
    database.run(
      `INSERT INTO verification_codes (email, code, purpose, createdAt)
       VALUES (?, ?, ?, ?)`,
      [cleanEmail, code, purpose, createdAt]
    );
    saveDb(database);
  },

  async getVerificationCode(email: string, purpose: string = 'register'): Promise<{ code: string; expired?: boolean } | null> {
    const database = await getSqliteDb();
    const cleanEmail = email.toLowerCase().trim();
    let stmt: any;
    try {
      stmt = database.prepare("SELECT code, createdAt FROM verification_codes WHERE email = ? AND purpose = ?");
      stmt.bind([cleanEmail, purpose]);
    } catch (_e) {
      stmt = database.prepare("SELECT code, createdAt FROM verification_codes WHERE email = ?");
      stmt.bind([cleanEmail]);
    }

    let result: { code: string; expired?: boolean } | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const code = row.code as string;
      const createdAt = row.createdAt as string;
      const createdTime = new Date(createdAt).getTime();
      const TEN_MINUTES_MS = 10 * 60 * 1000;

      if (isNaN(createdTime) || (Date.now() - createdTime > TEN_MINUTES_MS)) {
        // Code expired - delete it
        try {
          database.run("DELETE FROM verification_codes WHERE email = ? AND purpose = ?", [cleanEmail, purpose]);
        } catch (_e) {
          database.run("DELETE FROM verification_codes WHERE email = ?", [cleanEmail]);
        }
        saveDb(database);
        result = { code, expired: true };
      } else {
        result = { code, expired: false };
      }
    }
    stmt.free();
    return result;
  },

  async deleteVerificationCode(email: string, purpose?: string): Promise<void> {
    const database = await getSqliteDb();
    const cleanEmail = email.toLowerCase().trim();
    if (purpose) {
      try {
        database.run("DELETE FROM verification_codes WHERE email = ? AND purpose = ?", [cleanEmail, purpose]);
      } catch (_e) {
        database.run("DELETE FROM verification_codes WHERE email = ?", [cleanEmail]);
      }
    } else {
      database.run("DELETE FROM verification_codes WHERE email = ?", [cleanEmail]);
    }
    saveDb(database);
  },

  // Newsletter Subscribers CRUD
  async saveSubscriber(email: string, source: string = 'faq'): Promise<void> {
    const database = await getSqliteDb();
    const cleanEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();
    database.run("DELETE FROM subscribers WHERE LOWER(email) = ?", [cleanEmail]);
    database.run(
      `INSERT INTO subscribers (email, subscribedAt, source, status)
       VALUES (?, ?, ?, 'active')`,
      [cleanEmail, now, source]
    );
    saveDb(database);
  },

  async unsubscribeEmail(email: string): Promise<void> {
    const database = await getSqliteDb();
    const cleanEmail = email.toLowerCase().trim();
    database.run("UPDATE subscribers SET status = 'unsubscribed' WHERE LOWER(email) = ?", [cleanEmail]);
    database.run("UPDATE cart_reminders SET status = 'unsubscribed' WHERE LOWER(userEmail) = ?", [cleanEmail]);
    saveDb(database);
  },

  async isEmailSubscribed(email: string): Promise<boolean> {
    const database = await getSqliteDb();
    const cleanEmail = email.toLowerCase().trim();
    const stmt = database.prepare("SELECT status FROM subscribers WHERE LOWER(email) = ?");
    stmt.bind([cleanEmail]);
    let isSubscribed = true;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.status === 'unsubscribed') {
        isSubscribed = false;
      }
    }
    stmt.free();
    return isSubscribed;
  },

  // Abandoned Cart Reminders CRUD
  async saveCartReminder(userEmail: string, cartSnapshot: any[]): Promise<void> {
    const database = await getSqliteDb();
    const cleanEmail = userEmail.toLowerCase().trim();
    if (!cartSnapshot || cartSnapshot.length === 0) {
      database.run("UPDATE cart_reminders SET status = 'completed' WHERE LOWER(userEmail) = ?", [cleanEmail]);
      saveDb(database);
      return;
    }

    const id = `cart-${cleanEmail}`;
    const now = new Date().toISOString();
    const snapshotStr = JSON.stringify(cartSnapshot);

    const stmt = database.prepare("SELECT status, createdAt FROM cart_reminders WHERE LOWER(userEmail) = ?");
    stmt.bind([cleanEmail]);
    let existingStatus: string | null = null;
    let existingCreatedAt: string | null = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      existingStatus = row.status as string;
      existingCreatedAt = row.createdAt as string;
    }
    stmt.free();

    if (existingStatus) {
      const newStatus = existingStatus === 'completed' ? 'active' : existingStatus;
      const newCreatedAt = existingStatus === 'completed' ? now : existingCreatedAt;
      database.run(
        `UPDATE cart_reminders SET cartSnapshot = ?, status = ?, createdAt = ? WHERE LOWER(userEmail) = ?`,
        [snapshotStr, newStatus, newCreatedAt, cleanEmail]
      );
    } else {
      database.run(
        `INSERT INTO cart_reminders (id, userEmail, cartSnapshot, lastReminderStage, lastSentAt, createdAt, status)
         VALUES (?, ?, ?, 0, NULL, ?, 'active')`,
        [id, cleanEmail, snapshotStr, now]
      );
    }
    saveDb(database);
  },

  async markCartReminderCompleted(userEmail: string): Promise<void> {
    const database = await getSqliteDb();
    const cleanEmail = userEmail.toLowerCase().trim();
    database.run("UPDATE cart_reminders SET status = 'completed' WHERE LOWER(userEmail) = ?", [cleanEmail]);
    saveDb(database);
  },

  async getPendingCartReminders(): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM cart_reminders WHERE status = 'active'");
    const list: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      list.push({
        id: row.id,
        userEmail: row.userEmail,
        cartSnapshot: JSON.parse((row.cartSnapshot as string) || '[]'),
        lastReminderStage: Number(row.lastReminderStage || 0),
        lastSentAt: row.lastSentAt || null,
        createdAt: row.createdAt,
        status: row.status,
      });
    }
    stmt.free();
    return list;
  },

  async updateCartReminderStage(userEmail: string, stage: number): Promise<void> {
    const database = await getSqliteDb();
    const cleanEmail = userEmail.toLowerCase().trim();
    const now = new Date().toISOString();
    database.run(
      "UPDATE cart_reminders SET lastReminderStage = ?, lastSentAt = ? WHERE LOWER(userEmail) = ?",
      [stage, now, cleanEmail]
    );
    saveDb(database);
  },

  // Reviews CRUD
  async getReviewsByProduct(productId: number): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM reviews WHERE productId = ? ORDER BY id DESC");
    stmt.bind([productId]);
    const reviews: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      let parsedPhotos: string[] = [];
      if (row.photos) {
        try {
          parsedPhotos = JSON.parse(row.photos as string);
        } catch (_e) {
          if (typeof row.photos === 'string') {
            parsedPhotos = (row.photos as string).split(',').filter(Boolean);
          }
        }
      }
      reviews.push({
        id: row.id,
        productId: row.productId,
        userName: row.userName || 'Аноним',
        rating: row.rating || 5,
        text: row.text || '',
        photos: parsedPhotos,
        date: row.date || new Date().toLocaleDateString('ru-RU'),
        createdAt: row.createdAt,
      });
    }
    stmt.free();
    return reviews;
  },

  async addReview(data: {
    productId: number;
    userName?: string;
    rating?: number;
    text?: string;
    photos?: string[] | string;
    date?: string;
  }): Promise<any> {
    const database = await getSqliteDb();
    const createdAt = new Date().toISOString();
    const dateStr = data.date || new Date().toLocaleDateString('ru-RU');
    let photosJson = '[]';
    if (Array.isArray(data.photos)) {
      photosJson = JSON.stringify(data.photos);
    } else if (typeof data.photos === 'string') {
      photosJson = data.photos.startsWith('[') ? data.photos : JSON.stringify([data.photos]);
    }

    database.run(
      `INSERT INTO reviews (productId, userName, rating, text, photos, date, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.productId,
        data.userName || 'Аноним',
        data.rating || 5,
        data.text || '',
        photosJson,
        dateStr,
        createdAt,
      ]
    );
    saveDb(database);

    // Get last inserted review
    const stmt = database.prepare("SELECT * FROM reviews WHERE productId = ? ORDER BY id DESC LIMIT 1");
    stmt.bind([data.productId]);
    let result = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      let parsedPhotos: string[] = [];
      if (row.photos) {
        try {
          parsedPhotos = JSON.parse(row.photos as string);
        } catch (_e) {
          parsedPhotos = [];
        }
      }
      result = {
        id: row.id,
        productId: row.productId,
        userName: row.userName || 'Аноним',
        rating: row.rating || 5,
        text: row.text || '',
        photos: parsedPhotos,
        date: row.date || dateStr,
        createdAt: row.createdAt,
      };
    }
    stmt.free();
    return result;
  },

  async deleteReview(id: number): Promise<boolean> {
    const database = await getSqliteDb();
    database.run("DELETE FROM reviews WHERE id = ?", [id]);
    saveDb(database);
    return true;
  },

  // News Articles CRUD
  async getNews(): Promise<any[]> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM news ORDER BY id DESC");
    const news: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      news.push({
        ...row,
        coverFocalPoint: row.coverFocalPoint ? JSON.parse(row.coverFocalPoint as string) : undefined,
      });
    }
    stmt.free();
    return news;
  },

  async getNewsById(id: number): Promise<any | null> {
    const database = await getSqliteDb();
    const stmt = database.prepare("SELECT * FROM news WHERE id = ?");
    stmt.bind([id]);
    let article: any = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      article = {
        ...row,
        coverFocalPoint: row.coverFocalPoint ? JSON.parse(row.coverFocalPoint as string) : undefined,
      };
    }
    stmt.free();
    return article;
  },

  async createNewsArticle(data: {
    title: string;
    subtitle?: string;
    date: string;
    tags?: string;
    content: string;
    mediaLayout: string;
    image1?: string;
    image2?: string;
    image3?: string;
    videoUrl?: string;
    coverImage?: string;
    coverFocalPoint?: { x: number; y: number; zoom?: number };
  }): Promise<any> {
    const database = await getSqliteDb();
    const createdAt = new Date().toISOString();
    database.run(
      `INSERT INTO news (title, subtitle, date, tags, content, mediaLayout, image1, image2, image3, videoUrl, coverImage, coverFocalPoint, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.subtitle || '',
        data.date,
        data.tags || '',
        data.content,
        data.mediaLayout || '1_photo',
        data.image1 || '',
        data.image2 || '',
        data.image3 || '',
        data.videoUrl || '',
        data.coverImage || '',
        data.coverFocalPoint ? JSON.stringify(data.coverFocalPoint) : null,
        createdAt
      ]
    );
    saveDb(database);
    const stmt = database.prepare("SELECT * FROM news ORDER BY id DESC LIMIT 1");
    let created: any = null;
    if (stmt.step()) {
      const row = stmt.getAsObject();
      created = {
        ...row,
        coverFocalPoint: row.coverFocalPoint ? JSON.parse(row.coverFocalPoint as string) : undefined,
      };
    }
    stmt.free();
    return created;
  },

  async updateNewsArticle(id: number, data: {
    title?: string;
    subtitle?: string;
    date?: string;
    tags?: string;
    content?: string;
    mediaLayout?: string;
    image1?: string;
    image2?: string;
    image3?: string;
    videoUrl?: string;
    coverImage?: string;
    coverFocalPoint?: { x: number; y: number; zoom?: number } | null;
  }): Promise<any | null> {
    const database = await getSqliteDb();
    const existing = await this.getNewsById(id);
    if (!existing) return null;

    const updatedData = {
      title: data.title !== undefined ? data.title : existing.title,
      subtitle: data.subtitle !== undefined ? data.subtitle : existing.subtitle,
      date: data.date !== undefined ? data.date : existing.date,
      tags: data.tags !== undefined ? data.tags : existing.tags,
      content: data.content !== undefined ? data.content : existing.content,
      mediaLayout: data.mediaLayout !== undefined ? data.mediaLayout : existing.mediaLayout,
      image1: data.image1 !== undefined ? data.image1 : existing.image1,
      image2: data.image2 !== undefined ? data.image2 : existing.image2,
      image3: data.image3 !== undefined ? data.image3 : existing.image3,
      videoUrl: data.videoUrl !== undefined ? data.videoUrl : existing.videoUrl,
      coverImage: data.coverImage !== undefined ? data.coverImage : existing.coverImage,
      coverFocalPoint:
        data.coverFocalPoint !== undefined
          ? (data.coverFocalPoint ? JSON.stringify(data.coverFocalPoint) : null)
          : existing.coverFocalPoint
          ? JSON.stringify(existing.coverFocalPoint)
          : null,
    };

    database.run(
      `UPDATE news SET title = ?, subtitle = ?, date = ?, tags = ?, content = ?, mediaLayout = ?, image1 = ?, image2 = ?, image3 = ?, videoUrl = ?, coverImage = ?, coverFocalPoint = ? WHERE id = ?`,
      [
        updatedData.title,
        updatedData.subtitle,
        updatedData.date,
        updatedData.tags,
        updatedData.content,
        updatedData.mediaLayout,
        updatedData.image1,
        updatedData.image2,
        updatedData.image3,
        updatedData.videoUrl,
        updatedData.coverImage,
        updatedData.coverFocalPoint,
        id
      ]
    );
    saveDb(database);
    return {
      id,
      ...updatedData,
      coverFocalPoint: updatedData.coverFocalPoint ? JSON.parse(updatedData.coverFocalPoint) : undefined,
    };
  },

  async deleteNewsArticle(id: number): Promise<boolean> {
    const database = await getSqliteDb();
    const existing = await this.getNewsById(id);
    if (!existing) return false;

    database.run("DELETE FROM news WHERE id = ?", [id]);
    saveDb(database);
    return true;
  }
};
