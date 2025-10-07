# Email Təsdiq Sistemi - Quraşdırma Təlimatı

## 📧 SendGrid API Açarı Əldə Etmək

Email təsdiq funksiyasını aktivləşdirmək üçün SendGrid API açarına ehtiyacınız var.

### Addım 1: SendGrid Hesabı Yaradın

1. [SendGrid](https://sendgrid.com/) saytına daxil olun
2. "Start for Free" düyməsinə klikləyin
3. Qeydiyyat formasını doldurun:
   - Email ünvanınız
   - Şifrə
   - Şirkət məlumatları

### Addım 2: Email Ünvanını Təsdiqləyin

1. SendGrid sizə təsdiq emaili göndərəcək
2. Emaildəki linki klikləyərək hesabınızı təsdiqləyin

### Addım 3: Sender Identity Yaradın

1. SendGrid dashboard-a daxil olun
2. Sol menyudan **Settings** → **Sender Authentication** seçin
3. **Single Sender Verification** seçin
4. Formanı doldurun:
   - **From Name**: NaxtaPaz
   - **From Email Address**: naxtapaz@gmail.com
   - **Reply To**: naxtapaz@gmail.com
   - **Company Address**: Naxçıvan, Azərbaycan
5. **Create** düyməsinə klikləyin
6. Təsdiq emailini yoxlayın və təsdiqləyin

### Addım 4: API Açarı Yaradın

1. Sol menyudan **Settings** → **API Keys** seçin
2. **Create API Key** düyməsinə klikləyin
3. API açarına ad verin (məsələn: "NaxtaPaz Production")
4. **Full Access** seçin (və ya **Restricted Access** seçib yalnız Mail Send icazəsi verin)
5. **Create & View** düyməsinə klikləyin
6. **API açarını kopyalayın** (yalnız bir dəfə göstərilir!)

### Addım 5: API Açarını Layihəyə Əlavə Edin

1. Layihənizin kök qovluğunda `.env` faylını açın
2. `SENDGRID_API_KEY` dəyərini əlavə edin:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=naxtapaz@gmail.com
EMAIL_FROM_NAME=NaxtaPaz
```

3. Faylı yadda saxlayın

### Addım 6: Serveri Yenidən Başladın

```bash
# Serveri dayandırın (Ctrl+C)
# Yenidən başladın
bun run dev
```

## ✅ Test Etmək

1. Yeni istifadəçi qeydiyyatı yaradın
2. Qeydiyyat zamanı istifadə etdiyiniz email ünvanını yoxlayın
3. Təsdiq emaili almalısınız
4. Emaildəki "Email-i Təsdiqlə" düyməsinə klikləyin
5. Uğurlu təsdiq mesajı görməlisiniz

## 🎯 Xüsusiyyətlər

### 1. Qeydiyyat Email Təsdiqi
- İstifadəçi qeydiyyatdan keçdikdə avtomatik təsdiq emaili göndərilir
- Link 24 saat etibarlıdır
- Azərbaycan dilində email şablonu

### 2. Xoş Gəldin Emaili
- Email təsdiqlənəndən sonra avtomatik göndərilir
- Platformanın xüsusiyyətlərini təqdim edir

### 3. Şifrə Sıfırlama
- İstifadəçi şifrəsini unutduqda email göndərilir
- Link 1 saat etibarlıdır
- Təhlükəsizlik xəbərdarlığı ilə

### 4. Email Yenidən Göndərmə
- İstifadəçi təsdiq emailini yenidən istəyə bilər
- Profil səhifəsindən əlçatandır

## 🔧 API Endpointləri

### tRPC Prosedurları

```typescript
// Qeydiyyat
trpc.auth.register.useMutation()

// Giriş
trpc.auth.login.useMutation()

// Email Təsdiqi
trpc.auth.verifyEmail.useMutation()

// Təsdiq Emailini Yenidən Göndər
trpc.auth.resendVerification.useMutation()

// Şifrəni Unutdum
trpc.auth.forgotPassword.useMutation()

// Şifrəni Sıfırla
trpc.auth.resetPassword.useMutation()
```

## 📱 Ekran Yolları

- `/auth/register` - Qeydiyyat
- `/auth/login` - Giriş
- `/auth/verify-email?token=xxx` - Email təsdiqi
- `/auth/forgot-password` - Şifrəni unutdum
- `/auth/reset-password?token=xxx` - Şifrə sıfırlama

## 🎨 Email Şablonları

Bütün email şablonları Azərbaycan dilindədir və aşağıdakı məlumatları ehtiva edir:

- **Logo**: NaxtaPaz
- **Email**: naxtapaz@gmail.com
- **Telefon**: +994504801313
- **Ünvan**: Naxçıvan, Azərbaycan

## 🔒 Təhlükəsizlik

- Bütün tokenlər kriptoqrafik təsadüfi generatorla yaradılır
- Təsdiq tokenləri 24 saat sonra avtomatik olaraq etibarsız olur
- Şifrə sıfırlama tokenləri 1 saat sonra etibarsız olur
- Şifrələr SHA-256 ilə hash-lənir
- JWT tokenləri istifadəçi autentifikasiyası üçün istifadə olunur

## 💰 SendGrid Qiymətləndirmə

- **Pulsuz Plan**: 100 email/gün (3,000 email/ay)
- **Essentials Plan**: $19.95/ay - 50,000 email/ay
- **Pro Plan**: $89.95/ay - 100,000 email/ay

Pulsuz plan test və kiçik layihələr üçün kifayətdir.

## 🆘 Problemlərin Həlli

### Email göndərilmir

1. SendGrid API açarının düzgün olduğunu yoxlayın
2. Sender Identity-nin təsdiqlənmiş olduğunu yoxlayın
3. Server loglarını yoxlayın
4. SendGrid dashboard-da Activity Feed-i yoxlayın

### Email spam qovluğuna düşür

1. SendGrid-də Domain Authentication konfiqurasiya edin
2. SPF və DKIM record-larını DNS-ə əlavə edin
3. Email məzmununu yoxlayın (spam sözlər)

### API açarı işləmir

1. API açarının Full Access və ya Mail Send icazəsi olduğunu yoxlayın
2. API açarının aktiv olduğunu yoxlayın
3. Yeni API açarı yaradın

## 📞 Dəstək

Suallarınız varsa:
- Email: naxtapaz@gmail.com
- Telefon: +994504801313
- Ünvan: Naxçıvan, Azərbaycan
