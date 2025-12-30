Panduan Menjalankan Node.js Scraper di VPS UbuntuPanduan ini diasumsikan Anda sudah memiliki akses SSH ke VPS Ubuntu (versi 20.04 atau 22.04 ke atas).1. Login ke VPSBuka terminal (CMD/PowerShell) di komputer Anda dan login ke VPS:ssh root@ip-address-vps-anda 2. Update Server & Install Node.jsRepository bawaan Ubuntu terkadang memiliki versi Node.js yang sangat jadul. Kita akan menginstall versi LTS (Long Term Support) terbaru (versi 18 atau 20) menggunakan NodeSource.Jalankan perintah ini baris demi baris:# 1. Update daftar paket ubuntu
sudo apt update && sudo apt upgrade -y

# 2. Install curl (alat download) jika belum ada

sudo apt install -y curl

# 3. Tambahkan repository Node.js v18 (LTS)

curl -fsSL [https://deb.nodesource.com/setup_18.x](https://deb.nodesource.com/setup_18.x) | sudo -E bash -

# 4. Install Node.js

sudo apt install -y nodejs

# 5. Cek apakah sudah terinstall dengan benar

node -v
npm -v
Pastikan output node -v minimal v18.x.x3. Menyiapkan Project ScraperSekarang kita buat folder khusus agar file tidak berantakan.# 1. Buat folder baru
mkdir bot-scraper

# 2. Masuk ke folder tersebut

cd bot-scraper

# 3. Inisialisasi project node.js (Tekan enter terus sampai selesai)

npm init -y

# 4. Install library yang dibutuhkan (sama seperti di lokal)

npm install axios cheerio form-data 4. Membuat & Mengedit File ScriptKita akan membuat file script di dalam VPS dan menempelkan (paste) kode yang sudah Anda miliki. Kita gunakan text editor nano yang mudah digunakan.nano scraper_bulk.js
Langkah di dalam Nano Editor:Copy kode scraper_bulk.js yang ada di percakapan kita sebelumnya.Di jendela terminal VPS, klik kanan (atau Ctrl+V / Shift+Insert tergantung terminal) untuk Paste.PENTING: Cari baris const COOKIE_STRING = .... Ganti string tersebut dengan Cookie terbaru dari browser Anda. Gunakan tombol panah keyboard untuk navigasi.Simpan file dengan menekan: Ctrl + O, lalu Enter.Keluar dari editor dengan menekan: Ctrl + X.5. Menjalankan Scraper (Mode Background)Karena proses scraping 15.000 data memakan waktu (sekitar 1-5 menit atau lebih), jika Anda menutup terminal SSH, prosesnya akan mati.Kita akan menggunakan screen agar proses tetap berjalan meskipun Anda logout.# 1. Install screen (jika belum ada)
sudo apt install screen -y

# 2. Buat sesi screen baru bernama 'scraper'

screen -S scraper

# 3. Jalankan script node.js

node scraper_bulk.js
Sekarang script sedang berjalan.Untuk meninggalkan script berjalan di background (Detach): Tekan Ctrl + A, lalu tekan D. (Terminal akan kembali bersih, tapi script tetap jalan).Anda sekarang aman untuk menutup terminal SSH.Untuk melihat kembali prosesnya (Reattach): Login lagi ke VPS, lalu ketik:screen -r scraper 6. Mengambil Hasil Data (JSON)Setelah script selesai (muncul pesan "SELESAI"), file database_aset_lengkap.json akan terbentuk di VPS. Anda perlu mengunduhnya ke komputer lokal.Cara Mengunduh (Dari Terminal Komputer Lokal Anda, BUKAN di VPS):Gunakan perintah scp (Secure Copy). Buka terminal baru di komputer Anda:# Format: scp root@ip-vps:/path/ke/file/lokasi_tujuan
scp root@ip-vps-anda:/root/bot-scraper/database_aset_lengkap.json ./database_aset_lengkap.json
Catatan: Sesuaikan /root/bot-scraper/ dengan path tempat Anda membuat folder tadi. Ketik pwd di VPS untuk mengetahui path lengkapnya.Ringkasan Perintah CepatJika Anda sudah paham, ini urutan cepatnya:ssh root@x.x.x.xsudo apt install nodejs -y (pastikan versi baru)mkdir scraper && cd scrapernpm init -y && npm i axios cheerio form-datanano scraper_bulk.js (Paste kode & Edit Cookie)screen -S jalanscrapernode scraper_bulk.jsCtrl+A lalu D (Logout dan tunggu sambil ngopi ☕)
