import React, { useState, useEffect, useRef } from 'react';
import { Database, Download, Upload, RotateCcw, Trash2, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

interface BackupItem {
  name: string;
  size: number;
  createdAt: string;
}

interface AdminBackupProps {
  showToast?: (msg: string) => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleString('ru-RU');
};

export const AdminBackup: React.FC<AdminBackupProps> = ({ showToast }) => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toast = (msg: string) => {
    if (showToast) showToast(msg);
  };

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/backup', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setBackups(data.backups || []);
      } else {
        toast(data.error || 'Не удалось загрузить список копий');
      }
    } catch (e) {
      console.error('Failed to load backups:', e);
      toast('Не удалось загрузить список копий');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const createBackup = async () => {
    setBusy('create');
    try {
      const res = await fetch('/api/backup', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast('Резервная копия создана');
        await loadBackups();
      } else {
        toast(data.error || 'Не удалось создать копию');
      }
    } catch (e) {
      toast('Не удалось создать копию');
    } finally {
      setBusy(null);
    }
  };

  const afterRestore = (safetyBackup?: string) => {
    toast(
      safetyBackup
        ? `База восстановлена. Прежнее состояние сохранено как ${safetyBackup}. Страница перезагрузится…`
        : 'База восстановлена. Страница перезагрузится…'
    );
    setTimeout(() => window.location.reload(), 1800);
  };

  const restoreFromBackup = async (name: string) => {
    if (
      !window.confirm(
        `Восстановить базу из копии ${name}?\n\nТекущие товары, заказы и пользователи будут заменены данными из копии. ` +
          `Перед этим автоматически создастся копия текущего состояния.`
      )
    ) {
      return;
    }
    setBusy(`restore:${name}`);
    try {
      const res = await fetch(`/api/backup/restore/${encodeURIComponent(name)}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        afterRestore(data.safetyBackup);
      } else {
        toast(data.error || 'Не удалось восстановить базу');
      }
    } catch (e) {
      toast('Не удалось восстановить базу');
    } finally {
      setBusy(null);
    }
  };

  const restoreFromFile = async (file: File) => {
    if (
      !window.confirm(
        `Восстановить базу из файла ${file.name}?\n\nТекущие товары, заказы и пользователи будут заменены данными из файла. ` +
          `Перед этим автоматически создастся копия текущего состояния.`
      )
    ) {
      return;
    }
    setBusy('upload');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/backup/restore-upload', {
        method: 'POST',
        credentials: 'include',
        body: form, // no Content-Type: the browser sets the multipart boundary
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        afterRestore(data.safetyBackup);
      } else {
        toast(data.error || 'Не удалось восстановить базу из файла');
      }
    } catch (e) {
      toast('Не удалось восстановить базу из файла');
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const deleteBackup = async (name: string) => {
    if (!window.confirm(`Удалить резервную копию ${name}?`)) return;
    setBusy(`delete:${name}`);
    try {
      const res = await fetch(`/api/backup/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast('Копия удалена');
        await loadBackups();
      } else {
        toast(data.error || 'Не удалось удалить копию');
      }
    } catch (e) {
      toast('Не удалось удалить копию');
    } finally {
      setBusy(null);
    }
  };

  const btnBase =
    'px-3 py-2 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-[#2e4733] flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white">Резервные копии базы данных</h2>
            <p className="text-xs text-neutral-300 font-mono mt-1 max-w-2xl leading-relaxed">
              Товары, заказы, пользователи, новости и настройки сайта. Сервер сам делает копию при запуске и раз в сутки,
              здесь можно создать копию вручную, скачать её или загрузить обратно.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={createBackup}
            disabled={busy !== null}
            className={`${btnBase} bg-[#2e4733] hover:bg-[#233827] text-white border border-emerald-600/50 py-2.5 px-4`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{busy === 'create' ? 'Создаю…' : 'Создать копию'}</span>
          </button>
          <a
            href="/api/backup/download-current"
            className={`${btnBase} bg-neutral-900 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 py-2.5 px-4`}
          >
            <Download className="w-4 h-4" />
            <span>Скачать текущую БД</span>
          </a>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            className={`${btnBase} bg-neutral-900 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 py-2.5 px-4`}
          >
            <Upload className="w-4 h-4" />
            <span>{busy === 'upload' ? 'Загружаю…' : 'Загрузить из файла'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sqlite,.db,.sqlite3,application/octet-stream"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) restoreFromFile(file);
            }}
          />
        </div>
      </div>

      <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl p-4 flex items-start gap-3 text-xs font-mono text-amber-200/90 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p>
          Восстановление заменяет всю текущую базу. Перед этим автоматически создаётся копия текущего состояния, так что
          откатиться можно. Загруженные фото и видео (папка uploads) в копию БД не входят, их нужно сохранять отдельно.
        </p>
      </div>

      <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400">
            Сохранённые копии ({backups.length})
          </span>
          <button
            type="button"
            onClick={loadBackups}
            disabled={isLoading}
            className="text-neutral-400 hover:text-white cursor-pointer disabled:opacity-50"
            title="Обновить список"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-neutral-200">
            <thead className="text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
              <tr>
                <th className="p-4">Файл</th>
                <th className="p-4">Создана</th>
                <th className="p-4">Размер</th>
                <th className="p-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {backups.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-500">
                    {isLoading ? 'Загрузка…' : 'Копий пока нет'}
                  </td>
                </tr>
              )}
              {backups.map((b) => (
                <tr key={b.name} className="hover:bg-neutral-900/40">
                  <td className="p-4 text-white break-all">{b.name}</td>
                  <td className="p-4 whitespace-nowrap">{formatDate(b.createdAt)}</td>
                  <td className="p-4 whitespace-nowrap">{formatSize(b.size)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => restoreFromBackup(b.name)}
                        disabled={busy !== null}
                        className={`${btnBase} bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{busy === `restore:${b.name}` ? 'Восстанавливаю…' : 'Восстановить'}</span>
                      </button>
                      <a
                        href={`/api/backup/download/${encodeURIComponent(b.name)}`}
                        className={`${btnBase} bg-neutral-900 hover:bg-neutral-700 text-neutral-200 border border-neutral-600`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачать</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteBackup(b.name)}
                        disabled={busy !== null}
                        className={`${btnBase} bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/50`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
