# SDN 305 Maluku Tengah — Versi Online

Versi ini memakai server Node.js + SQLite agar data admin dapat disimpan dan website dapat dipublikasikan.

## PENTING untuk Windows

Jangan membuka `public/index.html` dengan double-click. Website harus dijalankan melalui server.

### 1. Pasang Node.js
Gunakan Node.js versi 20 atau lebih baru. Node.js 24 LTS juga didukung.

### 2. Jalankan website lokal
1. Ekstrak ZIP ini ke folder biasa, misalnya Desktop atau Downloads.
2. Double-click `start-website.bat`.
3. Tunggu proses pemasangan komponen selesai.
4. Browser akan membuka `http://localhost:3000`.

Jika sebelumnya pernah gagal `npm install`, versi ini otomatis mencoba mendeteksi instalasi SQLite yang rusak dan memasang ulang `node_modules`.

### 3. Login admin
Gunakan akun awal:
- Username: `admin`
- Password: `SDN305Admin!2026`

**Segera ganti password melalui menu Admin setelah berhasil login.**

## Jika muncul error instalasi
Pastikan komputer terhubung ke internet. Jangan menginstal Python atau Visual Studio secara manual hanya karena muncul pesan `node-gyp`; paket `better-sqlite3` pada versi ini sudah diperbarui untuk Node.js modern dan menyediakan binary prebuilt untuk platform utama.

Jika `start-website.bat` tetap gagal, kirim foto seluruh jendela CMD agar pesan error bisa diperiksa. Versi perbaikan ini juga memperbaiki konflik ID data awal SQLite yang dapat menyebabkan pesan `UNIQUE constraint failed: items.id`.

## Struktur
- `server.js` — server/API
- `public/index.html` — website
- `package.json` — dependensi
- `start-website.bat` — launcher Windows
- `render.yaml` — konfigurasi deploy Render

## Publikasi ke internet
Versi ini sudah disiapkan untuk deployment ke Render. Setelah website berhasil berjalan di `localhost:3000`, tahap berikutnya adalah mengunggah proyek ke GitHub dan menghubungkannya ke Render.

Render memakai persistent disk pada `/var/data` agar database dan upload foto tetap tersimpan.
