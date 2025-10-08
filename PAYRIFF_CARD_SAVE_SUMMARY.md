# Payriff Card Save İnteqrasiyası - Xülasə

## ✅ Nə Edildi?

Payriff-in **cardSave** və **autoPay** API-ları appınıza uğurla inteqrasiya edildi!

### 1. Yeni API Metodları
`services/payriffService.ts` faylına əlavə edildi:

- **`cardSave()`** - Kartı yadda saxlamaq üçün ödəniş yaradır
- **`autoPay()`** - Yadda saxlanmış kartla avtomatik ödəniş edir

### 2. Yeni Səhifələr

- **`app/payment/card-save.tsx`** - Kartı yadda saxlama səhifəsi
  - İstifadəçi kiçik məbləğ (4 AZN) daxil edir
  - Payriff ödəniş səhifəsinə yönləndirilir
  - Uğurlu ödənişdən sonra `cardUuid` qaytarılır

- **`app/saved-cards.tsx`** - Yadda saxlanmış kartları idarə etmə səhifəsi
  - Yadda saxlanmış kartların siyahısı
  - Kartla ödəniş etmək funksiyası
  - Kartı silmək funksiyası

- **`app/payment/success.tsx`** - Yeniləndi
  - `cardUuid` parametrini qəbul edir
  - Kartın uğurla yadda saxlandığını göstərir

## 🚀 İstifadə

### 1. Kartı Yadda Saxlama

```typescript
// Səhifəyə keçid
router.push('/payment/card-save');

// və ya birbaşa API çağırışı
const response = await payriffService.cardSave({
  amount: 4,
  description: 'Kartı yadda saxla',
  currencyType: 'AZN',
  language: 'AZ',
  directPay: true,
});

// İstifadəçini ödəniş səhifəsinə yönləndir
if (response.payload?.paymentUrl) {
  window.location.href = response.payload.paymentUrl;
}
```

### 2. Avtomatik Ödəniş

```typescript
// Yadda saxlanmış kartla ödəniş
const response = await payriffService.autoPay({
  amount: 50.00,
  cardUuid: 'saved-card-uuid-from-database',
  description: 'Avtomatik ödəniş',
  orderId: `AUTO-${Date.now()}`,
  currencyType: 'AZN',
});

if (response.payload?.orderStatus === 'APPROVED') {
  console.log('Ödəniş uğurlu!');
}
```

### 3. Yadda Saxlanmış Kartları İdarə Etmə

```typescript
// Səhifəyə keçid
router.push('/saved-cards');
```

## 📊 Axın Diaqramı

```
1. İstifadəçi → /payment/card-save
   ↓
2. Kiçik məbləğ (4 AZN) daxil edir
   ↓
3. Payriff ödəniş səhifəsinə yönləndirilir
   ↓
4. Kart məlumatlarını daxil edir
   ↓
5. Ödəniş uğurlu olur
   ↓
6. Payriff → approveURL-ə POST sorğusu (cardUuid ilə)
   ↓
7. Backend → cardUuid-ni database-də saxlayır
   ↓
8. İstifadəçi → /payment/success?cardUuid=XXX
   ↓
9. Gələcək ödənişlər → autoPay() ilə kartı yenidən daxil etmədən
```

## 🔧 Backend Tələbləri

### Webhook Handler (Vacib!)

Payriff uğurlu ödənişdən sonra `approveURL`-ə POST sorğusu göndərir. Backend-də bu sorğunu qəbul etmək üçün handler yaratmalısınız:

```typescript
// backend/routes/payriff-webhook.ts
app.post('/payment/success', async (req, res) => {
  const { cardUuid, orderID, pan, brand, cardHolderName } = req.body;
  
  // cardUuid-ni database-də saxlayın
  await db.savedCards.create({
    userId: req.user.id,
    cardUuid: cardUuid,
    pan: pan, // Maskalanmış nömrə (məs. "416973******5555")
    brand: brand, // "VISA", "MASTERCARD"
    cardHolderName: cardHolderName,
    savedAt: new Date(),
  });
  
  // İstifadəçini success səhifəsinə yönləndir
  res.redirect(`/payment/success?cardUuid=${cardUuid}`);
});
```

### Database Schema

```typescript
interface SavedCard {
  id: string;
  userId: string;
  cardUuid: string; // Payriff-dən gələn UUID
  pan: string; // Maskalanmış kart nömrəsi
  brand: string; // "VISA", "MASTERCARD"
  cardHolderName?: string;
  savedAt: Date;
  lastUsedAt?: Date;
}
```

## 🔒 Təhlükəsizlik

1. **cardUuid-ni təhlükəsiz saxlayın**
   - Database-də şifrələnmiş saxlayın
   - İstifadəçi yalnız öz kartlarına çıxış əldə edə bilsin

2. **Webhook-ləri verify edin**
   - Payriff-dən gələn sorğuları təsdiqləyin
   - Signature verification istifadə edin

3. **HTTPS istifadə edin**
   - Bütün callback URL-lər HTTPS olmalıdır

## 📝 Test Ssenarisi

1. `/payment/card-save` səhifəsinə daxil olun
2. Məbləğ: 4 AZN
3. Təsvir: "Test kartı yadda saxla"
4. "Kartı Yadda Saxla" düyməsinə klikləyin
5. Payriff səhifəsində test kartı daxil edin:
   - Kart: 4169738990000004
   - Tarix: İstənilən gələcək tarix
   - CVV: 123
6. Ödənişi tamamlayın
7. Success səhifəsində "Kart Yadda Saxlanıldı" mesajını görün
8. `/saved-cards` səhifəsinə keçin
9. Yadda saxlanmış kartı görün
10. Kartla yeni ödəniş edin (autoPay)

## 🎯 Növbəti Addımlar

1. ✅ cardSave və autoPay API-ları inteqrasiya edildi
2. ✅ UI səhifələri yaradıldı
3. ⬜ Backend webhook handler yaradın
4. ⬜ Database schema yaradın
5. ⬜ Test edin
6. ⬜ Production-a keçin

## 📚 Əlavə Məlumat

Ətraflı məlumat üçün `PAYRIFF_INTEGRATION_GUIDE.md` faylına baxın.

---

**Merchant ID:** ES1094797  
**Secret Key:** 719857DED4904989A4E2AAA2CDAEBB07  
**Base URL:** https://api.payriff.com

**Uğurlar! 🚀**
