import { CategoryItem } from '../../lostcamp/types';
import {
  specialVest,
  specialPouch,
  tacticalBelt,
  tacticalBackpack,
  specialGunBag,
  specialHelmet,
  tacticalHolster,
  plateCarrier,
  tacticalOperator,
} from '../../lostcamp/assets/images';

export interface Review {
  id: number;
  userName: string;
  rating: number; // 1 to 5
  text: string;
  date?: string;
  photos?: string[];
}

export interface CatalogProduct {
  id: number;
  title: string;
  price: number;
  oldPrice?: number;
  discount?: string;
  badge?: string;
  image: string;
  galleryImages?: string[];
  category: string;
  subcategory?: string;
  sku?: string;
  color?: string; // default active color
  availableColors?: string[];
  colorImages?: Record<string, string>; // map of color name -> photo URL/Data URL
  colorGalleries?: Record<string, string[]>;
  colorFocalPoints?: Record<string, { x: number; y: number; zoom?: number }>;
  inStock: boolean;
  isPromo?: boolean;
  description: string;
  detailedParagraphs?: string[];
  reviews?: Review[];
  imageFocalPoint?: { x: number; y: number; zoom?: number };
}

export const initialCategories: CategoryItem[] = [
  {
    categoryId: 'подсумки',
    title: 'подсумки',
    items: [
      'под сброс',
      'под магазины',
      'под рацию',
      'утилитарный',
      'под аптечку',
      'прочее',
    ],
  },
  {
    categoryId: 'разгрузки',
    title: 'разгрузки',
    items: ['СТРИЖ', 'БЕРКУТ', 'АК4', 'АК10'],
  },
  {
    categoryId: 'кобуры',
    title: 'кобуры',
    items: ['универсальная', 'для ПМ'],
  },
  {
    categoryId: 'чехлы',
    title: 'чехлы',
    items: [
      'для наручников',
      'для баллончика',
      'для дубинки',
      'для магазина ПМ',
      'для турникета',
    ],
  },
  {
    categoryId: 'плитники',
    title: 'плитники',
    items: ['РУБЕЖ', 'ДОТ-1'],
  },
];


export const initialProducts: CatalogProduct[] = [
  // 1. ПЛИТНИКИ (Plate Carriers)
  {
    id: 101,
    title: 'Плитник Гранит В-1',
    price: 12800,
    oldPrice: 16000,
    discount: '-20%',
    badge: '-20%',
    image: specialVest,
    galleryImages: [
      specialVest,
      plateCarrier,
      tacticalOperator,
    ],
    category: 'плитники',
    color: 'олива',
    availableColors: ['олива', 'мох', 'мультикам', 'черный', 'цифра'],
    inStock: true,
    description:
      'описание товара, текст рыба Как принято считать, тщательные исследования конкурентов ограничены исключительно образом мышления. Но синтетическое тестирование, а также свежий взгляд на привычные вещи — безусловно открывает новые горизонты для вывода текущих активов.',
    detailedParagraphs: [
      'Как принято считать: интерактивные прототипы объективно рассмотрены',
      'Предварительные выводы неутешительны: глубокий уровень погружения',
      'Предоставляет широкие: возможности для модели развития.',
    ],
    reviews: [
      {
        id: 1,
        userName: 'имя пользователя',
        rating: 4,
        text: 'Текст рыба Однозначно, элементы политического процесса подвергнуты целой серии независимых исследований. Есть над чем задуматься: независимые государства неоднозначны и будут указаны как претенденты на роль ключевых факторов.',
        photos: [
          'https://images.unsplash.com/photo-1508873696983-2df515122519?auto=format&fit=crop&w=400&q=80',
          'https://images.unsplash.com/photo-1542332213-315a42dde89b?auto=format&fit=crop&w=400&q=80',
        ],
      },
      {
        id: 2,
        userName: 'имя пользователя',
        rating: 5,
        text: 'Текст рыба Однозначно, элементы политического процесса подвергнуты целой серии независимых исследований. Есть над чем задуматься: независимые государства неоднозначны и будут указаны как претенденты на роль ключевых факторов.',
      },
    ],
  },
  {
    id: 102,
    title: 'Плитник Ракурс М3',
    price: 14500,
    oldPrice: 16000,
    image: plateCarrier,
    galleryImages: [
      plateCarrier,
      specialVest,
      tacticalOperator,
    ],
    category: 'плитники',
    color: 'мох',
    availableColors: ['олива', 'мох', 'мультикам', 'черный', 'цифра'],
    inStock: true,
    description:
      'Облегченный плитник Ракурс М3 с системой быстрого сброса и модульной платформой MOLLE/PALS.',
    detailedParagraphs: [
      'Анатомический крой распределяет вес плит равномерно.',
      'Совместим с баллистическими пакетами стандарта КАП и SAPI.',
    ],
    reviews: [
      {
        id: 10,
        userName: 'Иван К.',
        rating: 5,
        text: 'Качественные швы, идеальная посадка на бронеплиту. Рекомендую.',
      },
    ],
  },
  {
    id: 103,
    title: 'Плитоносец Скаут PRO',
    price: 12800,
    oldPrice: 16000,
    discount: '-20%',
    image: specialVest,
    galleryImages: [specialVest, plateCarrier, tacticalBelt],
    category: 'плитники',
    color: 'мультикам',
    availableColors: ['олива', 'мох', 'мультикам', 'черный'],
    inStock: true,
    description:
      'Профессиональный штурмовой плитоносец с вентилируемыми климатическими панелями.',
    reviews: [],
  },
  {
    id: 104,
    title: 'Плитник Модуль Т-4',
    price: 15900,
    oldPrice: 18000,
    image: plateCarrier,
    galleryImages: [plateCarrier, specialVest, tacticalOperator],
    category: 'плитники',
    color: 'черный',
    availableColors: ['олива', 'черный', 'цифра'],
    inStock: true,
    description:
      'Тактический жилет повышенной защищенности с камербандами под боковые плиты.',
    reviews: [],
  },

  // 2. ПОДСУМКИ (Pouches)
  {
    id: 201,
    title: 'Подсумок под АК «Спринт»',
    price: 2400,
    oldPrice: 3000,
    discount: '-20%',
    badge: '-20%',
    image: specialPouch,
    galleryImages: [specialPouch, tacticalBelt, specialVest],
    category: 'подсумки',
    color: 'олива',
    availableColors: ['олива', 'мох', 'мультикам', 'черный', 'цифра'],
    inStock: true,
    description:
      'Быстрый подсумок для магазинов серии АК/AR с пластиковыми боковыми вставками и эластичным шнуром фиксации.',
    detailedParagraphs: [
      'Обеспечивает надежное удержание магазина при активных перемещениях.',
      'Крепится на стандартную систему MOLLE.',
    ],
    reviews: [
      {
        id: 20,
        userName: 'Михаил В.',
        rating: 5,
        text: 'Магазин входит плотно и быстро вытаскивается без зацепов.',
      },
    ],
  },
  {
    id: 202,
    title: 'Аптечный подсумок сбросной',
    price: 3600,
    oldPrice: 4200,
    image: specialPouch,
    galleryImages: [specialPouch, tacticalBackpack],
    category: 'подсумки',
    color: 'мох',
    availableColors: ['олива', 'мох', 'мультикам', 'черный'],
    inStock: true,
    description:
      'Отрывная медицинская аптечка первого эшелона с велкро-платформой и внутренними органайзерами.',
    reviews: [],
  },
  {
    id: 203,
    title: 'Подсумок под рацию Универсал',
    price: 1800,
    image: specialPouch,
    galleryImages: [specialPouch, tacticalBelt],
    category: 'подсумки',
    color: 'мультикам',
    availableColors: ['олива', 'мох', 'мультикам', 'черный', 'цифра'],
    inStock: true,
    description: 'Компактный регулируемый подсумок под портативную радиостанцию.',
    reviews: [],
  },
  {
    id: 204,
    title: 'Сбросной подсумок для магазинов',
    price: 2100,
    oldPrice: 2500,
    image: specialPouch,
    galleryImages: [specialPouch, tacticalBelt],
    category: 'подсумки',
    color: 'цифра',
    availableColors: ['олива', 'мох', 'черный', 'цифра'],
    inStock: true,
    description: 'Складываемый подсумок сброса с утягиваемым горлышком.',
    reviews: [],
  },

  // 3. ЧЕХЛЫ (Covers / Cases)
  {
    id: 301,
    title: 'Чехол для оружия 120 см',
    price: 8900,
    oldPrice: 11000,
    discount: '-19%',
    badge: '-19%',
    image: specialGunBag,
    galleryImages: [specialGunBag, tacticalBackpack, specialHelmet],
    category: 'чехлы',
    color: 'черный',
    availableColors: ['олива', 'черный', 'мультикам'],
    inStock: true,
    description:
      'Защитный оружейный чехол с мягким уплотнителем EVA и плечевыми ремнями для рюкзачной переноски.',
    detailedParagraphs: [
      'Вмещает длинноствольное оружие с установленной оптикой.',
      'Внешние карманы под патроны и магазины.',
    ],
    reviews: [
      {
        id: 30,
        userName: 'Сергей Р.',
        rating: 5,
        text: 'Карабин с оптикой входит свободно, молния прочная.',
      },
    ],
  },
  {
    id: 302,
    title: 'Чехол на шлем Ops-Core / БР2',
    price: 2800,
    image: specialHelmet,
    galleryImages: [specialHelmet, tacticalOperator],
    category: 'чехлы',
    color: 'мох',
    availableColors: ['олива', 'мох', 'мультикам', 'цифра'],
    inStock: true,
    description:
      'Кавер на безухий шлем с велкро-панелями для противовесов, патчей и маскировочными петлями.',
    reviews: [],
  },
  {
    id: 303,
    title: 'Чехол для гидратора 2.5L',
    price: 3200,
    oldPrice: 3800,
    image: tacticalBackpack,
    galleryImages: [tacticalBackpack, specialPouch],
    category: 'чехлы',
    color: 'олива',
    availableColors: ['олива', 'мультикам', 'черный'],
    inStock: true,
    description: 'Термоизоляционный чехол для питьевой системы.',
    reviews: [],
  },

  // 4. КОБУРЫ (Holsters)
  {
    id: 401,
    title: 'Тактическая кобура «Альфа»',
    price: 4500,
    oldPrice: 5500,
    discount: '-18%',
    badge: '-18%',
    image: tacticalHolster,
    galleryImages: [tacticalHolster, tacticalBelt],
    category: 'кобуры',
    color: 'олива',
    availableColors: ['олива', 'мох', 'мультикам', 'черный', 'цифра'],
    inStock: true,
    description:
      'Полимерная/кайдексная кобура с фиксатором кнопки страховочного сброса и креплением на пояс/MOLLE.',
    detailedParagraphs: [
      'Формованный корпус гарантирует надежную фиксацию пистолета.',
      'Регулируемый угол наклона крепежной платформы.',
    ],
    reviews: [
      {
        id: 40,
        userName: 'Алексей М.',
        rating: 4,
        text: 'Пистолет сидит отлично, хлястик расстегивается одним движением.',
      },
    ],
  },
  {
    id: 402,
    title: 'Набедренная кобура ПМ/Ярыгин',
    price: 3900,
    image: tacticalHolster,
    galleryImages: [tacticalHolster, tacticalBelt],
    category: 'кобуры',
    color: 'черный',
    availableColors: ['олива', 'черный'],
    inStock: true,
    description: 'Универсальная набедренная платформа с регулируемыми ремнями.',
    reviews: [],
  },
  {
    id: 403,
    title: 'Скрытая кобура IWB',
    price: 2900,
    oldPrice: 3500,
    image: tacticalHolster,
    galleryImages: [tacticalHolster],
    category: 'кобуры',
    color: 'черный',
    availableColors: ['черный', 'олива'],
    inStock: true,
    description: 'Внутрипоясная кобура скрытого ношения из ударопрочного термопластика.',
    reviews: [],
  },

  // 5. РАЗГРУЗКИ (Chest Rigs / Load Bearing Vests)
  {
    id: 501,
    title: 'Разгрузочный пояс РПС «Тайфун»',
    price: 7800,
    oldPrice: 9200,
    discount: '-15%',
    badge: '-15%',
    image: tacticalBelt,
    galleryImages: [tacticalBelt, specialVest, specialPouch],
    category: 'разгрузки',
    color: 'мультикам',
    availableColors: ['олива', 'мох', 'мультикам', 'черный', 'цифра'],
    inStock: true,
    description:
      'Анатомический разгрузочно-поясной комплект (РПС) с разгрузочными лямками и 3D-сеткой.',
    detailedParagraphs: [
      'Снимает нагрузку с позвоночника и переносит её на бедра.',
      'Внутренняя отсечка под баллистический пакет БР1.',
    ],
    reviews: [
      {
        id: 50,
        userName: 'Дмитрий С.',
        rating: 5,
        text: 'Пояс очень удобный, подсумки вешаются легко, спина не устает.',
      },
    ],
  },
  {
    id: 502,
    title: 'Нагрудник Чест-Риг «Чиком-X»',
    price: 6900,
    image: tacticalBelt,
    galleryImages: [tacticalBelt, specialVest],
    category: 'разгрузки',
    color: 'олива',
    availableColors: ['олива', 'мох', 'мультикам'],
    inStock: true,
    description:
      'Компактная нагрудная разгрузочная система на 4 магазина АК и 2 пистолетных.',
    reviews: [],
  },
  {
    id: 503,
    title: 'Разгрузочный жилет Егерь',
    price: 8500,
    oldPrice: 10000,
    image: specialVest,
    galleryImages: [specialVest, tacticalBelt],
    category: 'разгрузки',
    color: 'мох',
    availableColors: ['олива', 'мох', 'цифра'],
    inStock: true,
    description: 'Классический охотничий/тактический жилет с встроенными подсумками.',
    reviews: [],
  },

  // 6. АКЦИИ (Promotions)
  {
    id: 601,
    title: 'Комплект Плитник + 4 Подсумка АК',
    price: 16800,
    oldPrice: 22000,
    discount: '-23%',
    badge: '-23%',
    image: specialVest,
    galleryImages: [specialVest, specialPouch, plateCarrier],
    category: 'подсумки',
    color: 'мультикам',
    availableColors: ['олива', 'мох', 'мультикам'],
    inStock: true,
    isPromo: true,
    description:
      'Акционный набор: модульный плитник + четыре подсумка под АК со скидкой 23%.',
    detailedParagraphs: [
      'Готовое решение для сборки первоначального комплекта снаряжения.',
    ],
    reviews: [
      {
        id: 60,
        userName: 'Артем Б.',
        rating: 5,
        text: 'Выгодный комплект, все швы ровные, нитки не торчат.',
      },
    ],
  },
  {
    id: 602,
    title: 'Набор Экипировки Скаут Gold',
    price: 24500,
    oldPrice: 32000,
    discount: '-23%',
    badge: '-23%',
    image: tacticalBackpack,
    galleryImages: [tacticalBackpack, specialVest, tacticalBelt],
    category: 'разгрузки',
    color: 'олива',
    availableColors: ['олива', 'мох', 'мультикам', 'черный'],
    inStock: true,
    isPromo: true,
    description: 'Рюкзак + Разгрузочный Пояс + Кавер на Шлем с уценкой по акции.',
    reviews: [],
  },
];
