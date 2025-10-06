import { Language, useLanguageStore } from '@/store/languageStore';

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
  loginToAccount: {
    az: 'Hesabınıza daxil olun',
    ru: 'Войдите в свой аккаунт',
    en: 'Login to your account',
  },
  email: {
    az: 'E-poçt',
    ru: 'Эл. почта',
    en: 'Email',
  },
  emailAddress: {
    az: 'E-poçt ünvanınız',
    ru: 'Ваш адрес эл. почты',
    en: 'Your email address',
  },
  password: {
    az: 'Şifrə',
    ru: 'Пароль',
    en: 'Password',
  },
  yourPassword: {
    az: 'Şifrəniz',
    ru: 'Ваш пароль',
    en: 'Your password',
  },
  forgotPassword: {
    az: 'Şifrəni unutmusunuz?',
    ru: 'Забыли пароль?',
    en: 'Forgot password?',
  },
  or: {
    az: 'və ya',
    ru: 'или',
    en: 'or',
  },
  agreeToTerms: {
    az: 'Daxil olmaqla siz bizim istifadə şərtlərimiz ilə razılaşırsınız',
    ru: 'Входя в систему, вы соглашаетесь с нашими условиями использования',
    en: 'By logging in, you agree to our terms of use',
  },
  termsOfUse: {
    az: 'istifadə şərtlərimiz',
    ru: 'условиями использования',
    en: 'terms of use',
  },
  noAccount: {
    az: 'Hesabınız yoxdur?',
    ru: 'Нет аккаунта?',
    en: 'No account?',
  },
  registerNow: {
    az: 'Qeydiyyatdan keçin',
    ru: 'Зарегистрироваться',
    en: 'Register now',
  },
  fullName: {
    az: 'Ad Soyad',
    ru: 'Имя Фамилия',
    en: 'Full Name',
  },
  yourFullName: {
    az: 'Adınız və soyadınız',
    ru: 'Ваше имя и фамилия',
    en: 'Your full name',
  },
  phone: {
    az: 'Telefon',
    ru: 'Телефон',
    en: 'Phone',
  },
  confirmPassword: {
    az: 'Şifrəni təsdiqləyin',
    ru: 'Подтвердите пароль',
    en: 'Confirm password',
  },
  repeatPassword: {
    az: 'Şifrəni təkrar daxil edin',
    ru: 'Введите пароль повторно',
    en: 'Repeat password',
  },
  agreeToTermsAndPrivacy: {
    az: 'Mən istifadə şərtləri və məxfilik siyasəti ilə razıyam',
    ru: 'Я согласен с условиями использования и политикой конфиденциальности',
    en: 'I agree to the terms of use and privacy policy',
  },
  haveAccount: {
    az: 'Artıq hesabınız var?',
    ru: 'Уже есть аккаунт?',
    en: 'Already have an account?',
  },
  loginNow: {
    az: 'Daxil olun',
    ru: 'Войти',
    en: 'Login now',
  },
  wallet: {
    az: 'Pul kisəsi',
    ru: 'Кошелек',
    en: 'Wallet',
  },
  totalBalance: {
    az: 'Ümumi balans',
    ru: 'Общий баланс',
    en: 'Total balance',
  },
  mainBalance: {
    az: 'Əsas balans',
    ru: 'Основной баланс',
    en: 'Main balance',
  },
  bonusBalance: {
    az: 'Bonus balans',
    ru: 'Бонусный баланс',
    en: 'Bonus balance',
  },
  topUp: {
    az: 'Balans artır',
    ru: 'Пополнить',
    en: 'Top up',
  },
  amount: {
    az: 'Məbləğ (AZN)',
    ru: 'Сумма (AZN)',
    en: 'Amount (AZN)',
  },
  paymentMethod: {
    az: 'Ödəniş üsulu',
    ru: 'Способ оплаты',
    en: 'Payment method',
  },
  pay: {
    az: 'Ödə',
    ru: 'Оплатить',
    en: 'Pay',
  },
  enterValidAmount: {
    az: 'Düzgün məbləğ daxil edin',
    ru: 'Введите корректную сумму',
    en: 'Enter valid amount',
  },
  selectPaymentMethod: {
    az: 'Ödəniş üsulunu seçin',
    ru: 'Выберите способ оплаты',
    en: 'Select payment method',
  },
  profilePhoto: {
    az: 'Profil şəkli',
    ru: 'Фото профиля',
    en: 'Profile photo',
  },
  tapToAddPhoto: {
    az: 'Şəkil əlavə etmək üçün toxunun',
    ru: 'Нажмите, чтобы добавить фото',
    en: 'Tap to add photo',
  },
  selectProfilePhoto: {
    az: 'Profil şəkli seçin',
    ru: 'Выберите фото профиля',
    en: 'Select profile photo',
  },
  howToAddPhoto: {
    az: 'Şəkil necə əlavə etmək istəyirsiniz?',
    ru: 'Как вы хотите добавить фото?',
    en: 'How do you want to add photo?',
  },
  gallery: {
    az: 'Qalereya',
    ru: 'Галерея',
    en: 'Gallery',
  },
  camera: {
    az: 'Kamera',
    ru: 'Камера',
    en: 'Camera',
  },
  permissionRequired: {
    az: 'İcazə tələb olunur',
    ru: 'Требуется разрешение',
    en: 'Permission required',
  },
  galleryPermissionRequired: {
    az: 'Şəkil seçmək üçün qalereya icazəsi lazımdır',
    ru: 'Для выбора изображения требуется доступ к галерее',
    en: 'Gallery permission is required to select image',
  },
  cameraPermissionRequired: {
    az: 'Şəkil çəkmək üçün kamera icazəsi lazımdır',
    ru: 'Для съемки требуется доступ к камере',
    en: 'Camera permission is required to take photo',
  },
  enterVerificationCode: {
    az: 'Təsdiq kodunu daxil edin',
    ru: 'Введите код подтверждения',
    en: 'Enter verification code',
  },
  verificationCodeSent: {
    az: 'Həm e-poçtunuza, həm də mobil nömrənizə göndərilən təsdiq kodunu daxil edin',
    ru: 'Введите код подтверждения, отправленный на вашу почту и мобильный номер',
    en: 'Enter the verification code sent to your email and mobile number',
  },
  emailCode: {
    az: 'E-poçt kodu',
    ru: 'Код с почты',
    en: 'Email code',
  },
  mobileCode: {
    az: 'Mobil kodu',
    ru: 'Код с телефона',
    en: 'Mobile code',
  },
  verify: {
    az: 'Təsdiq et',
    ru: 'Подтвердить',
    en: 'Verify',
  },
  goBack: {
    az: 'Geri qayıt',
    ru: 'Вернуться назад',
    en: 'Go back',
  },
  otpSent: {
    az: 'OTP Göndərildi',
    ru: 'OTP отправлен',
    en: 'OTP Sent',
  },
  otpSentMessage: {
    az: 'Təsdiq kodu həm e-poçtunuza, həm də mobil nömrənizə göndərildi',
    ru: 'Код подтверждения отправлен на вашу почту и мобильный номер',
    en: 'Verification code sent to your email and mobile number',
  },
  invalidVerificationCodes: {
    az: 'Təsdiq kodları yanlışdır',
    ru: 'Коды подтверждения неверны',
    en: 'Verification codes are invalid',
  },
};

export function t(key: keyof typeof translations, language: Language): string {
  return translations[key]?.[language] || translations[key]?.az || key;
}

export function useTranslation() {
  const { language } = useLanguageStore();
  return {
    t: (key: keyof typeof translations) => t(key, language),
    language,
  };
}
