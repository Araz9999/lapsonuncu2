# Payriff Ödəniş Sistemi İnteqrasiyası

Payriff ödəniş sistemi uğurla appınıza inteqrasiya edildi! 🎉

## 📋 Nə Edildi?

### 1. Payriff Service Yaradıldı
- `services/payriffService.ts` - Payriff API ilə əlaqə üçün servis
- Ödəniş yaratma, status yoxlama və geri qaytarma funksiyaları

### 2. Ödəniş Səhifələri
- `app/payment/payriff.tsx` - Əsas ödəniş səhifəsi
- `app/payment/card-save.tsx` - Kartı yadda saxlama səhifəsi
- `app/saved-cards.tsx` - Yadda saxlanmış kartlar səhifəsi
- `app/payment/success.tsx` - Uğurlu ödəniş səhifəsi (cardUuid dəstəyi)
- `app/payment/error.tsx` - Xəta səhifəsi
- `app/payment/cancel.tsx` - Ləğv edilmiş ödəniş səhifəsi

### 3. Konfiqurasiya
- `constants/config.ts` - Payriff konfiqurasiyası əlavə edildi
- `constants/paymentMethods.ts` - Payriff ödəniş metodu əlavə edildi
- `.env` - Environment variables əlavə edildi

## 🚀 İstifadə

### 1. Payriff Hesabı Yaradın
1. [https://dashboard.payriff.com](https://dashboard.payriff.com) ünvanına daxil olun
2. Yeni hesab yaradın və ya mövcud hesaba daxil olun
3. Dashboard-dan Merchant ID və Secret Key alın

### 2. Environment Variables Konfiqurasiyası
`.env` faylında aşağıdakı dəyərləri əlavə edin:

```env
PAYRIFF_MERCHANT_ID=sizin-merchant-id
PAYRIFF_SECRET_KEY=sizin-secret-key
FRONTEND_URL=https://sizin-app-url.com
```

### 3. Kod Nümunəsi

#### Ödəniş Səhifəsinə Yönləndirmə
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

// Ödəniş səhifəsinə keçid
router.push({
  pathname: '/payment/payriff',
  params: {
    amount: '50.00',
    description: 'Elan yerləşdirmə',
    orderId: 'ORDER-12345',
  },
});
```

#### Birbaşa Payriff Service İstifadəsi
```typescript
import { payriffService } from '@/services/payriffService';

// Ödəniş yaratma
const response = await payriffService.createPayment({
  amount: 50.00,
  currency: 'AZN',
  description: 'Elan yerləşdirmə',
  orderId: 'ORDER-12345',
  language: 'az',
});

if (response.success && response.paymentUrl) {
  // İstifadəçini ödəniş səhifəsinə yönləndir
  window.location.href = response.paymentUrl;
}

// Ödəniş statusunu yoxlama
const status = await payriffService.checkPaymentStatus('ORDER-12345');
console.log('Status:', status.status); // 'success', 'pending', 'failed', 'cancelled'

// Geri qaytarma
const refunded = await payriffService.refundPayment('TRANSACTION-ID', 25.00);
```

## 📱 Ödəniş Axını

### Standart Ödəniş
1. **İstifadəçi ödəniş səhifəsinə daxil olur**
   - `/payment/payriff?amount=50&description=Test&orderId=ORDER-123`

2. **Payriff ödəniş URL-i yaradılır**
   - İstifadəçi Payriff-in təhlükəsiz səhifəsinə yönləndirilir

3. **İstifadəçi ödənişi tamamlayır**
   - Uğurlu: `/payment/success`
   - Xəta: `/payment/error`
   - Ləğv: `/payment/cancel`

### Kartı Yadda Saxlama Axını
1. **İstifadəçi kartı yadda saxlama səhifəsinə daxil olur**
   - `/payment/card-save`

2. **Kiçik məbləğ (məs. 4 AZN) bloklanır**
   - İstifadəçi Payriff-in təhlükəsiz səhifəsinə yönləndirilir
   - Kart məlumatları daxil edilir

3. **Ödəniş uğurlu olarsa**
   - `approveURL`-ə POST sorğusu göndərilir
   - `cardUuid` parametri qaytarılır
   - `cardUuid` database-də saxlanılır
   - `/payment/success?cardUuid=XXX` səhifəsinə yönləndirilir

4. **Gələcək ödənişlər**
   - `/saved-cards` səhifəsindən yadda saxlanmış kartlar görünür
   - `autoPay` metodu ilə kartı yenidən daxil etmədən ödəniş edilir

## 🔧 API Metodları

### `createPayment(request: PayriffPaymentRequest)`
Yeni ödəniş yaradır və ödəniş URL-i qaytarır.

**Parametrlər:**
- `amount` (number) - Məbləğ
- `currency` (string) - Valyuta (default: 'AZN')
- `description` (string) - Ödəniş təsviri
- `orderId` (string) - Unikal sifariş ID
- `language` ('az' | 'en' | 'ru') - Dil (default: 'az')
- `successUrl` (string, optional) - Uğurlu ödəniş URL-i
- `errorUrl` (string, optional) - Xəta URL-i
- `cancelUrl` (string, optional) - Ləğv URL-i

**Qaytarır:**
```typescript
{
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  orderId?: string;
  error?: string;
}
```

### `checkPaymentStatus(orderId: string)`
Ödəniş statusunu yoxlayır.

**Qaytarır:**
```typescript
{
  orderId: string;
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  paymentDate?: string;
}
```

### `refundPayment(transactionId: string, amount?: number)`
Ödənişi geri qaytarır (tam və ya qismən).

**Qaytarır:** `boolean`

### `cardSave(request: PayriffCardSaveRequest)`
Kartı yadda saxlamaq üçün ödəniş yaradır.

**Parametrlər:**
- `amount` (number) - Bloklanacaq məbləğ
- `description` (string) - Ödəniş təsviri
- `currencyType` ('AZN' | 'USD' | 'EUR') - Valyuta (default: 'AZN')
- `language` ('AZ' | 'EN' | 'RU') - Dil (default: 'AZ')
- `directPay` (boolean) - Birbaşa ödəniş (default: true)
- `approveURL` (string, optional) - Uğurlu ödəniş URL-i
- `cancelURL` (string, optional) - Ləğv URL-i
- `declineURL` (string, optional) - Rədd URL-i

**Qaytarır:**
```typescript
{
  code: string;
  message: string;
  payload: {
    orderId: string;
    paymentUrl: string;
    sessionId: string;
  };
}
```

**Qeyd:** Uğurlu ödənişdən sonra `approveURL`-ə POST sorğusu göndərilir və `cardUuid` parametri qaytarılır. Bu `cardUuid`-ni database-də saxlayın və gələcək avtomatik ödənişlər üçün istifadə edin.

### `autoPay(request: PayriffAutoPayRequest)`
Yadda saxlanmış kartla avtomatik ödəniş edir.

**Parametrlər:**
- `amount` (number) - Məbləğ
- `cardUuid` (string) - Yadda saxlanmış kartın UUID-i
- `description` (string) - Ödəniş təsviri
- `orderId` (string) - Unikal sifariş ID
- `currencyType` ('AZN' | 'USD' | 'EUR') - Valyuta (default: 'AZN')

**Qaytarır:**
```typescript
{
  code: string;
  message: string;
  payload: {
    orderID: string;
    orderStatus: string; // 'APPROVED', 'DECLINED', etc.
    purchaseAmount: string;
    currency: string;
    pan: string; // Maskalanmış kart nömrəsi
    brand: string; // 'VISA', 'MASTERCARD', etc.
    cardUID: string;
    // ... digər məlumatlar
  };
}
```

### `isConfigured()`
Payriff servisinin konfiqurasiya olunub-olunmadığını yoxlayır.

**Qaytarır:** `boolean`

## 🎨 UI Komponentləri

### Ödəniş Metodu Seçimi
```typescript
import { paymentMethods } from '@/constants/paymentMethods';

const payriffMethod = paymentMethods.find(m => m.id === 'payriff');
// {
//   id: 'payriff',
//   name: 'Payriff',
//   description: 'Bank kartı və digər ödəniş üsulları',
//   category: 'digital',
//   icon: '💳'
// }
```

## 🔒 Təhlükəsizlik

1. **Secret Key-i heç vaxt frontend-də istifadə etməyin**
   - Secret Key yalnız backend-də istifadə edilməlidir
   - Frontend-də yalnız Merchant ID istifadə olunur

2. **Signature Verification**
   - Bütün API sorğuları signature ilə təsdiqlənir
   - Payriff callback-lərini backend-də verify edin

3. **HTTPS İstifadəsi**
   - Production-da yalnız HTTPS istifadə edin
   - Payriff yalnız HTTPS callback URL-lərini qəbul edir

## 📊 Test Məlumatları

Payriff test mühitində test kartları:
- **Kart nömrəsi:** 4169738990000004
- **Son istifadə tarixi:** İstənilən gələcək tarix
- **CVV:** 123

## 🐛 Troubleshooting

### Ödəniş yaradıla bilmir
- `.env` faylında `PAYRIFF_MERCHANT_ID` və `PAYRIFF_SECRET_KEY` düzgün təyin olunub?
- `FRONTEND_URL` düzgün təyin olunub?
- Payriff dashboard-da callback URL-lər əlavə olunub?

### Callback işləmir
- Callback URL-lər HTTPS olmalıdır
- Payriff dashboard-da callback URL-lər düzgün təyin olunmalıdır
- Backend-də callback handler yaradılmalıdır

### Status yoxlanılmır
- `orderId` düzgün göndərilir?
- Payriff API-ya çıxış var?

## 📚 Əlavə Resurslar

- [Payriff Rəsmi Dokumentasiya](https://docs.payriff.com)
- [Payriff Dashboard](https://dashboard.payriff.com)
- [Payriff API Reference](https://api.payriff.com/docs)

## 💳 Kartı Yadda Saxlama və Avtomatik Ödəniş

### Kartı Yadda Saxlama
```typescript
import { payriffService } from '@/services/payriffService';

// Kartı yadda saxlamaq üçün ödəniş yaradın
const response = await payriffService.cardSave({
  amount: 4, // Kiçik məbləğ bloklanacaq
  description: 'Kartı yadda saxla',
  currencyType: 'AZN',
  language: 'AZ',
  directPay: true,
});

// İstifadəçini ödəniş səhifəsinə yönləndirin
if (response.payload?.paymentUrl) {
  window.location.href = response.payload.paymentUrl;
}

// Uğurlu ödənişdən sonra approveURL-ə POST sorğusu gələcək
// cardUuid parametrini database-də saxlayın
```

### Avtomatik Ödəniş (Yadda Saxlanmış Kartla)
```typescript
import { payriffService } from '@/services/payriffService';

// Database-dən cardUuid alın
const savedCardUuid = 'user-saved-card-uuid';

// Avtomatik ödəniş edin
const response = await payriffService.autoPay({
  amount: 50.00,
  cardUuid: savedCardUuid,
  description: 'Avtomatik ödəniş',
  orderId: `AUTO-${Date.now()}`,
  currencyType: 'AZN',
});

if (response.payload?.orderStatus === 'APPROVED') {
  console.log('Ödəniş uğurlu!');
  console.log('Kart:', response.payload.pan);
  console.log('Məbləğ:', response.payload.purchaseAmount);
}
```

### Database Strukturu (Nümunə)
```typescript
interface SavedCard {
  id: string;
  userId: string;
  cardUuid: string; // Payriff-dən gələn UUID
  pan: string; // Maskalanmış kart nömrəsi (məs. "416973******5555")
  brand: string; // "VISA", "MASTERCARD", etc.
  cardHolderName?: string;
  savedAt: Date;
  lastUsedAt?: Date;
}
```

## 💡 Tövsiyələr

1. **Backend Webhook Handler Yaradın**
   - Payriff callback-lərini backend-də qəbul edin
   - Ödəniş statusunu database-də yeniləyin
   - `cardUuid` parametrini saxlayın

2. **Logging Əlavə Edin**
   - Bütün ödəniş əməliyyatlarını log edin
   - Xətaları izləyin və analiz edin
   - Avtomatik ödənişləri izləyin

3. **Test Edin**
   - Test mühitində ətraflı test edin
   - Müxtəlif ssenariləri yoxlayın (uğurlu, xəta, ləğv)
   - Kartı yadda saxlama və avtomatik ödəniş axınını test edin

4. **İstifadəçi Təcrübəsi**
   - Loading state-lər əlavə edin
   - Aydın xəta mesajları göstərin
   - Ödəniş tarixçəsi yaradın
   - Yadda saxlanmış kartları idarə etmək üçün UI yaradın

5. **Təhlükəsizlik**
   - `cardUuid`-ni təhlükəsiz şəkildə saxlayın
   - İstifadəçi yalnız öz kartlarına çıxış əldə edə bilsin
   - Kartı silmək funksiyası əlavə edin
   - Şübhəli əməliyyatları izləyin

## 🎯 Növbəti Addımlar

1. ✅ Payriff hesabı yaradın
2. ✅ Merchant ID və Secret Key alın
3. ✅ `.env` faylını konfiqurasiya edin
4. ✅ Test ödənişləri həyata keçirin
5. ⬜ Backend webhook handler yaradın
6. ⬜ Production-a keçin

---

**Uğurlar! 🚀**

Suallarınız olarsa, Payriff dəstək komandası ilə əlaqə saxlayın:
- Email: support@payriff.com
- Telefon: +994 12 XXX XX XX
