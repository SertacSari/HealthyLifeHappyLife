# Projede Neler Yaptık? (Basit Anlatım + Teknik Özet)

Bu proje, **fitness takip** odaklı bir MVP’dir (Month 1). Kullanıcı; **hesap oluşturur/giriş yapar**, **profil hedeflerini** ayarlar, **yemek** ve **antrenman** kayıtları girer, ardından **günlük özet** ekranında ilerlemesini görür.

## 1) Basit Anlatım (Teknik Bilmeden Okunacak)

### Uygulama ne işe yarıyor?
- **Giriş / Kayıt**: Kullanıcı hesap açıp uygulamaya giriş yapabiliyor.
- **Profil**: Günlük kalori hedefi ve haftalık antrenman hedefi gibi hedefler ayarlanabiliyor.
- **Yemek Kaydı**: Yenen yemek eklenebiliyor (kalori ve makrolar).
- **Antrenman Kaydı**: Yapılan antrenman eklenebiliyor (süre ve yakılan kalori).
- **Dashboard (Günlük Özet)**: Seçilen tarihe göre toplam kalori, makrolar, antrenman dakikası gibi değerler tek ekranda görülebiliyor.

### Proje klasörleri ne?
- **`mobile/`**: Telefon uygulaması (iOS Simulator’da da çalışır).
- **`backend/`**: Sunucu/API (telefon uygulamasının konuştuğu servis).
- **`docs/`**: API sözleşmesi ve proje dokümanları.

## 2) Teknik Özet (Senin İçin: Framework’ler, API’ler, Mimari)

### Genel Mimari
- **Mobile (React Native + Expo)** → HTTP istekleriyle **Backend API**’ye bağlanır.
- **Backend (Node.js)** → REST API sağlar, doğrulama/iş kuralları çalıştırır, MVP için veriyi JSON dosyada tutar.

### Mobile tarafında kullanılanlar
- **Framework/Platform**: `Expo` (scripts: `expo start`, `expo start --ios`)
- **UI**: `React Native`
- **Dil/Tip Sistemi**: `TypeScript` (projede `mobile/src/api.ts` gibi dosyalar)
- **API katmanı**:
  - `fetch` ile REST istekleri
  - API adresi tespiti/override:
    - `EXPO_PUBLIC_API_URL` env değişkeni varsa onu kullanır
    - yoksa Expo script URL’den host çıkarıp `http://<host>:4000` dener
    - Android emülatör fallback: `http://10.0.2.2:4000`
    - iOS Simulator fallback: `http://localhost:4000`

### Backend tarafında kullanılanlar
- **Runtime**: `Node.js` (>=18)
- **HTTP API**: Node’un built-in `http` sunucusu (Express görünmüyor; start komutu `node src/server.js`)
- **Konfigürasyon**: `backend/src/config.js`
  - `PORT` env ile port ayarı (default `4000`)
  - `JWT_SECRET` ile token imzalama sırrı (default development değeri var)
  - `TOKEN_TTL_SECONDS` token süresi
  - MVP veri dosyası: `backend/data/db.json`
- **Güvenlik / Auth**:
  - parola hash: `crypto.scrypt` (dokümanda belirtilmiş)
  - imzalı token doğrulama (dokümanda belirtilmiş; JWT benzeri akış)
- **Veri**:
  - MVP için **JSON dosyaya yazma/okuma** (`backend/data/db.json`)
  - production için DB (örn. PostgreSQL) henüz eklenmemiş
- **Test/Doğrulama**:
  - `npm run test` → `node --test`
  - `npm run smoke` → servis seviyesinde smoke kontrolü

### Kullanılan REST API uçları (özet)
Base URL: varsayılan `http://localhost:4000`
- **Health**: `GET /health`
- **Auth**: `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Profile**: `GET /profile`, `PUT /profile`
- **Meals**: `POST /meals`, `GET /meals?date=YYYY-MM-DD`
- **Workouts**: `POST /workouts`, `GET /workouts?date=YYYY-MM-DD`
- **Dashboard**: `GET /dashboard/summary?date=YYYY-MM-DD`

Detay örnek JSON’lar için `docs/API_CONTRACT.md` dosyasına bakabilirsin.

## 3) Çalıştırma (kısa)
- Backend:
  - `cd backend && npm install && npm start`
- Mobile (iOS Simulator):
  - `cd mobile && npm install && npx expo start` (sonra terminalde `i`)

