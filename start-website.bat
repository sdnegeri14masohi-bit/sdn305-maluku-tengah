@echo off
setlocal
cd /d "%~dp0"
echo ================================================
echo SDN 305 Maluku Tengah - Server Website
echo ================================================
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js belum terpasang.
  echo Silakan pasang Node.js versi 20 atau lebih baru, lalu jalankan file ini lagi.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo Node.js %%v terdeteksi.

echo.
if exist node_modules (
  node -e "require('better-sqlite3'); console.log('Komponen SQLite OK.')" >nul 2>nul
  if errorlevel 1 (
    echo Instalasi komponen sebelumnya tidak lengkap.
    echo Membersihkan node_modules dan memasang ulang...
    rmdir /s /q node_modules
    if exist package-lock.json del /q package-lock.json
  )
)
if not exist node_modules (
  echo Memasang komponen website. Tunggu beberapa saat...
  call npm install
  if errorlevel 1 (
    echo.
    echo GAGAL memasang komponen website.
    echo Pastikan koneksi internet aktif, lalu jalankan file ini lagi.
    pause
    exit /b 1
  )
)
node -e "require('better-sqlite3'); console.log('Semua komponen siap.')"
if errorlevel 1 (
  echo Komponen SQLite belum siap. Jalankan file ini lagi setelah memastikan npm install selesai.
  pause
  exit /b 1
)
start "SDN305 Browser" cmd /c "timeout /t 2 >nul & start http://localhost:3000"
call npm start
pause
