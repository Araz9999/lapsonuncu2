import { Language } from '@/store/languageStore';

export const translations = {
  home: {
    az: 'Ana səhifə',
    ru: 'Главная',
    en: 'Home',
  },
  categories: {
    az: 'Kateqoriyalar',
    ru: 'Категории',
    en: 'Categories',
  },
  featuredListings: {
    az: 'VIP Elanlar',
    ru: 'VIP Объявления',
    en: 'VIP Listings',
  },
  stores: {
    az: 'Mağazalar',
    ru: 'Магазины',
    en: 'Stores',
  },
  seeAll: {
    az: 'Hamısına bax',
    ru: 'Смотреть все',
    en: 'See All',
  },
  store: {
    az: 'Mağaza',
    ru: 'Магазин',
    en: 'Store',
  },
  search: {
    az: 'Axtar...',
    ru: 'Поиск...',
    en: 'Search...',
  },
  recentListings: {
    az: 'Son Elanlar',
    ru: 'Последние объявления',
    en: 'Recent Listings',
  },
  price: {
    az: 'Qiymət',
    ru: 'Цена',
    en: 'Price',
  },
  location: {
    az: 'Yer',
    ru: 'Местоположение',
    en: 'Location',
  },
  description: {
    az: 'Təsvir',
    ru: 'Описание',
    en: 'Description',
  },
  contact: {
    az: 'Əlaqə',
    ru: 'Контакт',
    en: 'Contact',
  },
  call: {
    az: 'Zəng et',
    ru: 'Позвонить',
    en: 'Call',
  },
  message: {
    az: 'Mesaj',
    ru: 'Сообщение',
    en: 'Message',
  },
  share: {
    az: 'Paylaş',
    ru: 'Поделиться',
    en: 'Share',
  },
  favorite: {
    az: 'Sevimlilər',
    ru: 'Избранное',
    en: 'Favorites',
  },
  profile: {
    az: 'Profil',
    ru: 'Профиль',
    en: 'Profile',
  },
  settings: {
    az: 'Tənzimləmələr',
    ru: 'Настройки',
    en: 'Settings',
  },
  logout: {
    az: 'Çıxış',
    ru: 'Выход',
    en: 'Logout',
  },
  login: {
    az: 'Daxil ol',
    ru: 'Войти',
    en: 'Login',
  },
  register: {
    az: 'Qeydiyyat',
    ru: 'Регистрация',
    en: 'Register',
  },
  create: {
    az: 'Yarat',
    ru: 'Создать',
    en: 'Create',
  },
  edit: {
    az: 'Redaktə et',
    ru: 'Редактировать',
    en: 'Edit',
  },
  delete: {
    az: 'Sil',
    ru: 'Удалить',
    en: 'Delete',
  },
  save: {
    az: 'Yadda saxla',
    ru: 'Сохранить',
    en: 'Save',
  },
  cancel: {
    az: 'Ləğv et',
    ru: 'Отмена',
    en: 'Cancel',
  },
  yes: {
    az: 'Bəli',
    ru: 'Да',
    en: 'Yes',
  },
  no: {
    az: 'Xeyr',
    ru: 'Нет',
    en: 'No',
  },
  loading: {
    az: 'Yüklənir...',
    ru: 'Загрузка...',
    en: 'Loading...',
  },
  error: {
    az: 'Xəta',
    ru: 'Ошибка',
    en: 'Error',
  },
  success: {
    az: 'Uğurlu',
    ru: 'Успешно',
    en: 'Success',
  },
  naxcivanListings: {
    az: 'Naxçıvan elanları',
    ru: 'Объявления Нахчывана',
    en: 'Nakhchivan Listings',
  },
};

export function t(key: keyof typeof translations, language: Language): string {
  return translations[key]?.[language] || translations[key]?.az || key;
}
