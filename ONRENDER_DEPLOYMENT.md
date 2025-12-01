# OnRender Deployment Guide

## Özet

Bu backend sadece **backend klasöründeki dosyalar** ile deploy edilir. Frontend ayrı deploy edilmelidir.

## Gereksinimler

- ✅ Backend klasöründeki tüm dosyalar GitHub'da olmalı
- ✅ OnRender'da PostgreSQL database oluşturulmalı
- ✅ Environment variables ayarlanmalı

## Adım Adım Deployment

### 1. GitHub Repository Hazırlığı

Backend dosyaları GitHub'da olmalı:
- ✅ `package.json`
- ✅ `tsconfig.json`
- ✅ `prisma/` klasörü (schema, migrations)
- ✅ `src/` klasörü (tüm source dosyalar)
- ✅ `scripts/` klasörü (wait-for-db.js)
- ✅ `render.yaml` (OnRender yapılandırması)

### 2. OnRender'da Database Oluşturma

1. OnRender Dashboard → "New +" → "PostgreSQL"
2. Database adı: `qr-restaurant-db` (render.yaml'da belirtilen)
3. Plan: Free
4. Region: Web service ile aynı region
5. Oluştur

**Not:** `render.yaml` kullanıyorsanız, database otomatik oluşturulur.

### 3. OnRender'da Web Service Oluşturma

#### Seçenek A: render.yaml ile (Önerilen)

1. OnRender Dashboard → "New +" → "Blueprint"
2. GitHub repository'yi bağla
3. `render.yaml` dosyası otomatik algılanır
4. Deploy et

#### Seçenek B: Manuel Oluşturma

1. OnRender Dashboard → "New +" → "Web Service"
2. GitHub repository'yi bağla
3. Ayarlar:
   - **Name:** `qr-restaurant-backend`
   - **Region:** Database ile aynı
   - **Branch:** `main`
   - **Root Directory:** (boş bırak)
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`

### 4. Environment Variables

OnRender dashboard'da web service'in Environment sekmesine gidin ve şunları ekleyin:

#### Otomatik (render.yaml ile):
- `DATABASE_URL` - Database'den otomatik gelir
- `NODE_ENV` - `production` olarak set edilir

#### Manuel Eklenmesi Gerekenler:

```env
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters
JWT_REFRESH_SECRET=your_very_secure_refresh_secret_key_minimum_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
APP_DOMAIN=your-backend-domain.onrender.com
```

**Önemli:** 
- `DATABASE_URL` database oluşturulduğunda otomatik eklenir
- `PORT` OnRender tarafından otomatik set edilir (10000)

### 5. Database Bağlantısı

`render.yaml` kullanıyorsanız, `DATABASE_URL` otomatik olarak database'den alınır.

Manuel oluşturduysanız:
1. Database'in "Connections" sekmesine gidin
2. "Internal Database URL" veya "External Database URL" kopyalayın
3. Web service'in Environment Variables'ına `DATABASE_URL` olarak ekleyin

### 6. Deploy ve Kontrol

1. "Manual Deploy" → "Deploy latest commit"
2. Logları kontrol edin:
   - ✅ Build başarılı
   - ✅ Database bağlantısı başarılı
   - ✅ Migration'lar çalıştı
   - ✅ Server başladı

## Sorun Giderme

### Database Bağlantı Hatası

**Hata:** `Can't reach database server at host:5432`

**Çözüm:**
1. Database'in aynı region'da olduğundan emin olun
2. `DATABASE_URL` environment variable'ının doğru olduğunu kontrol edin
3. Database'in "Available" durumunda olduğunu kontrol edin

### Migration Hatası

**Hata:** Migration çalışmıyor

**Çözüm:**
- `wait-for-db.js` script'i database hazır olana kadar bekler
- Migration'lar start komutunda çalışır (build'de değil)

### Build Hatası

**Hata:** TypeScript compile hatası

**Çözüm:**
- Tüm type definition paketleri `dependencies`'de olmalı
- `@types/*` paketleri yüklü olmalı

## Dosya Yapısı

Backend için gerekli dosyalar:

```
backend/
├── package.json          # Dependencies ve scripts
├── tsconfig.json         # TypeScript config
├── render.yaml           # OnRender yapılandırması
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration dosyaları
├── src/                  # Source kodlar
│   ├── server.ts
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── ...
└── scripts/
    └── wait-for-db.js    # Database bekleme script'i
```

**Not:** Frontend dosyaları backend'e dahil değildir. Frontend ayrı deploy edilmelidir.

## Başarı Kontrolü

Deploy başarılı olduğunda:
- ✅ Web service "Live" durumunda
- ✅ Loglar'da "Server running on port 10000" görünüyor
- ✅ API endpoint'leri çalışıyor (örn: `https://your-app.onrender.com/api/health`)

## Sonraki Adımlar

1. Frontend'i ayrı bir web service olarak deploy edin
2. Frontend'in `CORS_ORIGIN` environment variable'ını backend URL'i olarak ayarlayın
3. Backend'in `CORS_ORIGIN` environment variable'ını frontend URL'i olarak ayarlayın

