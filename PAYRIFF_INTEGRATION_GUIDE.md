# Payriff Ödəniş Sistemi İnteqrasiyası

Payriff ödəniş sistemi uğurla appınıza inteqrasiya edildi! 🎉

## 📋 Nə Edildi?

### 1. Payriff Service Yaradıldı
- `services/payriffService.ts` - Payriff API ilə əlaqə üçün servis
- Ödəniş yaratma, status yoxlama və geri qaytarma funksiyaları

### 2. Ödəniş Səhifələri
- `app/payment/payriff.tsx` - Əsas ödəniş səhifəsi
- `app/payment/success.tsx` - Uğurlu ödəniş səhifəsi
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

1. **İstifadəçi ödəniş səhifəsinə daxil olur**
   - `/payment/payriff?amount=50&description=Test&orderId=ORDER-123`

2. **Payriff ödəniş URL-i yaradılır**
   - İstifadəçi Payriff-in təhlükəsiz səhifəsinə yönləndirilir

3. **İstifadəçi ödənişi tamamlayır**
   - Uğurlu: `/payment/success`
   - Xəta: `/payment/error`
   - Ləğv: `/payment/cancel`

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

## 💡 Tövsiyələr

1. **Backend Webhook Handler Yaradın**
   - Payriff callback-lərini backend-də qəbul edin
   - Ödəniş statusunu database-də yeniləyin

2. **Logging Əlavə Edin**
   - Bütün ödəniş əməliyyatlarını log edin
   - Xətaları izləyin və analiz edin

3. **Test Edin**
   - Test mühitində ətraflı test edin
   - Müxtəlif ssenariləri yoxlayın (uğurlu, xəta, ləğv)

4. **İstifadəçi Təcrübəsi**
   - Loading state-lər əlavə edin
   - Aydın xəta mesajları göstərin
   - Ödəniş tarixçəsi yaradın

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
