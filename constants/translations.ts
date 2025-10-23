import { Language, useLanguageStore } from '@/store/languageStore';

export const translations = {

  // ✅ ADD THESE MISSING KEYS FOR THE LOGIN SCREEN
  emailRequired: {
    az: 'Email tələb olunur',
    ru: 'Требуется электронная почта',
    en: 'Email is required',
  },
  invalidEmail: {
    az: 'Düzgün email daxil edin',
    ru: 'Введите действующий email',
    en: 'Please enter a valid email',
  },
  emailTooLong: {
    az: 'Email çox uzundur (maks 255 simvol)',
    ru: 'Email слишком длинный (макс 255 символов)',
    en: 'Email is too long (max 255 chars)',
  },
  passwordRequired: {
    az: 'Şifrə tələb olunur',
    ru: 'Требуется пароль',
    en: 'Password is required',
  },
  passwordTooShort: {
    az: 'Şifrə ən azı 6 simvol olmalıdır',
    ru: 'Пароль должен быть не менее 6 символов',
    en: 'Password must be at least 6 characters',
  },
  passwordTooLong: {
    az: 'Şifrə çox uzundur (maks 128 simvol)',
    ru: 'Пароль слишком длинный (макс 128 символов)',
    en: 'Password is too long (max 128 chars)',
  },
  loginError: {
    az: 'Giriş zamanı xəta baş verdi. Yenidən cəhd edin.',
    ru: 'Произошла ошибка при входе. Попробуйте снова.',
    en: 'An error occurred during login. Please try again.',
  },
  invalidCredentials: {
    az: 'Email və ya şifrə səhvdir',
    ru: 'Неверный email или пароль',
    en: 'Incorrect email or password',
  },
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
  bankCard: {
    az: 'Bank kartı',
    ru: 'Банковская карта',
    en: 'Bank card',
  },
  cardNumber: {
    az: 'Kart nömrəsi',
    ru: 'Номер карты',
    en: 'Card number',
  },
  expiryDate: {
    az: 'Son istifadə tarixi',
    ru: 'Срок действия',
    en: 'Expiry date',
  },
  cvv: {
    az: 'CVV',
    ru: 'CVV',
    en: 'CVV',
  },
  paymentSuccessful: {
    az: 'Ödəniş uğurlu',
    ru: 'Оплата успешна',
    en: 'Payment successful',
  },
  paymentFailed: {
    az: 'Ödəniş uğursuz',
    ru: 'Оплата не удалась',
    en: 'Payment failed',
  },
  balanceAdded: {
    az: 'Balans əlavə edildi',
    ru: 'Баланс пополнен',
    en: 'Balance added',
  },
  myListings: {
    az: 'Mənim elanlarım',
    ru: 'Мои объявления',
    en: 'My listings',
  },
  createListing: {
    az: 'Elan yarat',
    ru: 'Создать объявление',
    en: 'Create listing',
  },
  editListing: {
    az: 'Elanı redaktə et',
    ru: 'Редактировать объявление',
    en: 'Edit listing',
  },
  deleteListing: {
    az: 'Elanı sil',
    ru: 'Удалить объявление',
    en: 'Delete listing',
  },
  promoteListing: {
    az: 'Elanı irəli çək',
    ru: 'Продвинуть объявление',
    en: 'Promote listing',
  },
  title: {
    az: 'Başlıq',
    ru: 'Заголовок',
    en: 'Title',
  },
  category: {
    az: 'Kateqoriya',
    ru: 'Категория',
    en: 'Category',
  },
  selectCategory: {
    az: 'Kateqoriya seçin',
    ru: 'Выберите категорию',
    en: 'Select category',
  },
  images: {
    az: 'Şəkillər',
    ru: 'Изображения',
    en: 'Images',
  },
  addImages: {
    az: 'Şəkil əlavə et',
    ru: 'Добавить изображения',
    en: 'Add images',
  },
  publish: {
    az: 'Dərc et',
    ru: 'Опубликовать',
    en: 'Publish',
  },
  draft: {
    az: 'Qaralama',
    ru: 'Черновик',
    en: 'Draft',
  },
  active: {
    az: 'Aktiv',
    ru: 'Активный',
    en: 'Active',
  },
  inactive: {
    az: 'Qeyri-aktiv',
    ru: 'Неактивный',
    en: 'Inactive',
  },
  expired: {
    az: 'Vaxtı keçib',
    ru: 'Истек',
    en: 'Expired',
  },
  views: {
    az: 'Baxışlar',
    ru: 'Просмотры',
    en: 'Views',
  },
  messages: {
    az: 'Mesajlar',
    ru: 'Сообщения',
    en: 'Messages',
  },
  calls: {
    az: 'Zənglər',
    ru: 'Звонки',
    en: 'Calls',
  },
  notifications: {
    az: 'Bildirişlər',
    ru: 'Уведомления',
    en: 'Notifications',
  },
  about: {
    az: 'Haqqımızda',
    ru: 'О нас',
    en: 'About',
  },
  help: {
    az: 'Kömək',
    ru: 'Помощь',
    en: 'Help',
  },
  support: {
    az: 'Dəstək',
    ru: 'Поддержка',
    en: 'Support',
  },
  liveSupport: {
    az: 'Canlı dəstək',
    ru: 'Живая поддержка',
    en: 'Live support',
  },
  termsAndConditions: {
    az: 'İstifadə şərtləri',
    ru: 'Условия использования',
    en: 'Terms and conditions',
  },
  privacyPolicy: {
    az: 'Məxfilik siyasəti',
    ru: 'Политика конфиденциальности',
    en: 'Privacy policy',
  },
  language: {
    az: 'Dil',
    ru: 'Язык',
    en: 'Language',
  },
  theme: {
    az: 'Tema',
    ru: 'Тема',
    en: 'Theme',
  },
  light: {
    az: 'İşıqlı',
    ru: 'Светлая',
    en: 'Light',
  },
  dark: {
    az: 'Qaranlıq',
    ru: 'Темная',
    en: 'Dark',
  },
  auto: {
    az: 'Avtomatik',
    ru: 'Автоматически',
    en: 'Auto',
  },
  createStore: {
    az: 'Mağaza yarat',
    ru: 'Создать магазин',
    en: 'Create store',
  },
  storeName: {
    az: 'Mağaza adı',
    ru: 'Название магазина',
    en: 'Store name',
  },
  storeDescription: {
    az: 'Mağaza təsviri',
    ru: 'Описание магазина',
    en: 'Store description',
  },
  myStore: {
    az: 'Mənim mağazam',
    ru: 'Мой магазин',
    en: 'My store',
  },
  storeManagement: {
    az: 'Mağaza idarəetməsi',
    ru: 'Управление магазином',
    en: 'Store management',
  },
  storeSettings: {
    az: 'Mağaza tənzimləmələri',
    ru: 'Настройки магазина',
    en: 'Store settings',
  },
  storeAnalytics: {
    az: 'Mağaza analitikası',
    ru: 'Аналитика магазина',
    en: 'Store analytics',
  },
  storeTheme: {
    az: 'Mağaza teması',
    ru: 'Тема магазина',
    en: 'Store theme',
  },
  storeReviews: {
    az: 'Mağaza rəyləri',
    ru: 'Отзывы магазина',
    en: 'Store reviews',
  },
  addToFavorites: {
    az: 'Seçilmişlərə əlavə et',
    ru: 'Добавить в избранное',
    en: 'Add to favorites',
  },
  removeFromFavorites: {
    az: 'Seçilmişlərdən sil',
    ru: 'Удалить из избранного',
    en: 'Remove from favorites',
  },
  noFavorites: {
    az: 'Seçilmiş elan yoxdur',
    ru: 'Нет избранных объявлений',
    en: 'No favorite listings',
  },
  noListings: {
    az: 'Elan yoxdur',
    ru: 'Нет объявлений',
    en: 'No listings',
  },
  noMessages: {
    az: 'Mesaj yoxdur',
    ru: 'Нет сообщений',
    en: 'No messages',
  },
  noNotifications: {
    az: 'Bildiriş yoxdur',
    ru: 'Нет уведомлений',
    en: 'No notifications',
  },
  sendMessage: {
    az: 'Mesaj göndər',
    ru: 'Отправить сообщение',
    en: 'Send message',
  },
  typeMessage: {
    az: 'Mesaj yazın...',
    ru: 'Введите сообщение...',
    en: 'Type a message...',
  },
  callNow: {
    az: 'İndi zəng et',
    ru: 'Позвонить сейчас',
    en: 'Call now',
  },
  incomingCall: {
    az: 'Gələn zəng',
    ru: 'Входящий звонок',
    en: 'Incoming call',
  },
  accept: {
    az: 'Qəbul et',
    ru: 'Принять',
    en: 'Accept',
  },
  decline: {
    az: 'Rədd et',
    ru: 'Отклонить',
    en: 'Decline',
  },
  endCall: {
    az: 'Zəngi bitir',
    ru: 'Завершить звонок',
    en: 'End call',
  },
  callHistory: {
    az: 'Zəng tarixçəsi',
    ru: 'История звонков',
    en: 'Call history',
  },
  blockedUsers: {
    az: 'Bloklanmış istifadəçilər',
    ru: 'Заблокированные пользователи',
    en: 'Blocked users',
  },
  blockUser: {
    az: 'İstifadəçini blokla',
    ru: 'Заблокировать пользователя',
    en: 'Block user',
  },
  unblockUser: {
    az: 'İstifadəçinin blokunu aç',
    ru: 'Разблокировать пользователя',
    en: 'Unblock user',
  },
  reportUser: {
    az: 'İstifadəçini şikayət et',
    ru: 'Пожаловаться на пользователя',
    en: 'Report user',
  },
  deleteProfile: {
    az: 'Profili sil',
    ru: 'Удалить профиль',
    en: 'Delete profile',
  },
  confirmDelete: {
    az: 'Silməyi təsdiq et',
    ru: 'Подтвердить удаление',
    en: 'Confirm delete',
  },
  areYouSure: {
    az: 'Əminsiniz?',
    ru: 'Вы уверены?',
    en: 'Are you sure?',
  },
  cannotBeUndone: {
    az: 'Bu əməliyyat geri qaytarıla bilməz',
    ru: 'Это действие нельзя отменить',
    en: 'This action cannot be undone',
  },
  memberSince: {
    az: 'Üzv olub:',
    ru: 'Участник с:',
    en: 'Member since:',
  },
  listings: {
    az: 'Elanlar',
    ru: 'Объявления',
    en: 'Listings',
  },
  favorites: {
    az: 'Seçilmişlər',
    ru: 'Избранное',
    en: 'Favorites',
  },
  freeAds: {
    az: 'Pulsuz elan',
    ru: 'Бесплатно',
    en: 'Free ads',
  },
  loginToAccessProfile: {
    az: 'Profilinizə daxil olmaq üçün hesabınıza giriş edin',
    ru: 'Войдите в свой аккаунт, чтобы получить доступ к профилю',
    en: 'Login to access your profile',
  },
  autoRenewal: {
    az: 'Avtomatik yeniləmə',
    ru: 'Автоматическое обновление',
    en: 'Auto renewal',
  },
  enableAutoRenewal: {
    az: 'Avtomatik yeniləməni aktivləşdir',
    ru: 'Включить автоматическое обновление',
    en: 'Enable auto renewal',
  },
  disableAutoRenewal: {
    az: 'Avtomatik yeniləməni deaktivləşdir',
    ru: 'Отключить автоматическое обновление',
    en: 'Disable auto renewal',
  },
  renewalPeriod: {
    az: 'Yeniləmə müddəti',
    ru: 'Период обновления',
    en: 'Renewal period',
  },
  days: {
    az: 'gün',
    ru: 'дней',
    en: 'days',
  },
  cost: {
    az: 'Qiymət',
    ru: 'Стоимость',
    en: 'Cost',
  },
  free: {
    az: 'Pulsuz',
    ru: 'Бесплатно',
    en: 'Free',
  },
  paid: {
    az: 'Ödənişli',
    ru: 'Платный',
    en: 'Paid',
  },
  paymentHistory: {
    az: 'Ödəniş tarixçəsi',
    ru: 'История платежей',
    en: 'Payment history',
  },
  noPaymentHistory: {
    az: 'Ödəniş tarixçəsi yoxdur',
    ru: 'Нет истории платежей',
    en: 'No payment history',
  },
  discount: {
    az: 'Endirim',
    ru: 'Скидка',
    en: 'Discount',
  },
  discounts: {
    az: 'Endirimlər',
    ru: 'Скидки',
    en: 'Discounts',
  },
  createDiscount: {
    az: 'Endirim yarat',
    ru: 'Создать скидку',
    en: 'Create discount',
  },
  discountCode: {
    az: 'Endirim kodu',
    ru: 'Код скидки',
    en: 'Discount code',
  },
  applyDiscount: {
    az: 'Endirim tətbiq et',
    ru: 'Применить скидку',
    en: 'Apply discount',
  },
  moderation: {
    az: 'Moderasiya',
    ru: 'Модерация',
    en: 'Moderation',
  },
  pending: {
    az: 'Gözləyir',
    ru: 'Ожидает',
    en: 'Pending',
  },
  approved: {
    az: 'Təsdiqləndi',
    ru: 'Одобрено',
    en: 'Approved',
  },
  rejected: {
    az: 'Rədd edildi',
    ru: 'Отклонено',
    en: 'Rejected',
  },
  approve: {
    az: 'Təsdiq et',
    ru: 'Одобрить',
    en: 'Approve',
  },
  reject: {
    az: 'Rədd et',
    ru: 'Отклонить',
    en: 'Reject',
  },
  operatorDashboard: {
    az: 'Operator paneli',
    ru: 'Панель оператора',
    en: 'Operator dashboard',
  },
  online: {
    az: 'Onlayn',
    ru: 'Онлайн',
    en: 'Online',
  },
  offline: {
    az: 'Oflayn',
    ru: 'Оффлайн',
    en: 'Offline',
  },
  available: {
    az: 'Əlçatan',
    ru: 'Доступен',
    en: 'Available',
  },
  busy: {
    az: 'Məşğul',
    ru: 'Занят',
    en: 'Busy',
  },
  away: {
    az: 'Uzaqda',
    ru: 'Отошел',
    en: 'Away',
  },
  accountRequired: {
    az: 'Hesab tələb olunur',
    ru: 'Требуется аккаунт',
    en: 'Account required',
  },
  loginToPostAd: {
    az: 'Elan yerləşdirmək üçün əvvəlcə hesabınıza daxil olmalısınız',
    ru: 'Для размещения объявления необходимо войти в аккаунт',
    en: 'You must login to post an ad',
  },
  registerAccount: {
    az: 'Qeydiyyatdan keçin',
    ru: 'Зарегистрироваться',
    en: 'Register',
  },
  postAd: {
    az: 'Elan yerləşdir',
    ru: 'Разместить объявление',
    en: 'Post Ad',
  },
  ussd: {
    az: 'USSD',
    ru: 'USSD',
    en: 'USSD',
  },
  ussdSimulator: {
    az: 'USSD Simulyatoru',
    ru: 'USSD Симулятор',
    en: 'USSD Simulator',
  },
  enterUssdCode: {
    az: 'USSD kodu daxil edin',
    ru: 'Введите USSD код',
    en: 'Enter USSD code',
  },
  dial: {
    az: 'Zəng et',
    ru: 'Позвонить',
    en: 'Dial',
  },
  quickCodes: {
    az: 'Sürətli kodlar',
    ru: 'Быстрые коды',
    en: 'Quick codes',
  },
  activeSession: {
    az: 'Aktiv sessiya',
    ru: 'Активная сессия',
    en: 'Active session',
  },
  endSession: {
    az: 'Sessiyanı bitir',
    ru: 'Завершить сессию',
    en: 'End session',
  },
  sessionEnded: {
    az: 'Sessiya başa çatdı',
    ru: 'Сессия завершена',
    en: 'Session ended',
  },
  enterResponse: {
    az: 'Cavab daxil edin...',
    ru: 'Введите ответ...',
    en: 'Enter response...',
  },
  chatWithSupport: {
    az: 'Dəstək ilə söhbət',
    ru: 'Чат с поддержкой',
    en: 'Chat with support',
  },
  startConversation: {
    az: 'Söhbətə başla',
    ru: 'Начать разговор',
    en: 'Start conversation',
  },
  supportAgent: {
    az: 'Dəstək agenti',
    ru: 'Агент поддержки',
    en: 'Support agent',
  },
  typing: {
    az: 'yazır...',
    ru: 'печатает...',
    en: 'typing...',
  },
  messageSent: {
    az: 'Mesaj göndərildi',
    ru: 'Сообщение отправлено',
    en: 'Message sent',
  },
  messageDelivered: {
    az: 'Mesaj çatdırıldı',
    ru: 'Сообщение доставлено',
    en: 'Message delivered',
  },
  messageSeen: {
    az: 'Mesaj oxundu',
    ru: 'Сообщение прочитано',
    en: 'Message seen',
  },
  closeChat: {
    az: 'Söhbəti bağla',
    ru: 'Закрыть чат',
    en: 'Close chat',
  },
  chatClosed: {
    az: 'Söhbət bağlandı',
    ru: 'Чат закрыт',
    en: 'Chat closed',
  },
  newMessage: {
    az: 'Yeni mesaj',
    ru: 'Новое сообщение',
    en: 'New message',
  },
  unreadMessages: {
    az: 'Oxunmamış mesajlar',
    ru: 'Непрочитанные сообщения',
    en: 'Unread messages',
  },
  startChatWithSupport: {
    az: 'Dəstək komandası ilə söhbətə başlayın',
    ru: 'Начните разговор с командой поддержки',
    en: 'Start a conversation with our support team',
  },
};

export function t(key: keyof typeof translations, language: Language): string {
  return translations[key]?.[language] || translations[key]?.az || key;
}

export function useTranslation() {
  const languageStore = useLanguageStore();
  const language = languageStore?.language || 'az';
  return {
    t: (key: keyof typeof translations) => t(key, language),
    language,
  };
}
