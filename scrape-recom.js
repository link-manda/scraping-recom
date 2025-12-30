/**
 * SCRAPER DATATABLES SERVER-SIDE - FULL VERSION
 * * Prasyarat:
 * 1. Install Node.js
 * 2. Buat folder baru, buka terminal di folder tersebut.
 * 3. Jalankan: npm init -y
 * 4. Jalankan: npm install axios cheerio xlsx
 * * Cara menjalankan script:
 * node scrape-recom.js
 */

const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const XLSX = require("xlsx");
const readline = require("readline");

// URL Endpoint API (Ganti dengan URL target asli Anda)
const TARGET_URL = "https://jumeirah-bali.recom-at.com/BarcodeReport/list";

// PENTING: Update cookie ini setiap kali expired!
const COOKIE =
  "ci_session=o95idf47v47sajb2g8q3qok90uf54k9e; menuOpen=undefined; menuSet=1; menuActive=M22";

// Konfigurasi
const BATCH_SIZE = 1000;
const DELAY_MS = 1000;

// Utility Functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function drawProgressBar(current, total, width = 40) {
  const percentage = (current / total) * 100;
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;

  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${bar}] ${percentage.toFixed(1)}%`;
}

function printBanner() {
  console.clear();
  console.log(
    "╔════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║          🚀 RECOM ASSET SCRAPER v2.0                          ║"
  );
  console.log(
    "║          DataTables Server-Side Scraper Tool                  ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════════╝"
  );
  console.log();
}

// Fungsi untuk fetch data per batch
async function fetchBatch(start, length) {
  const postData =
    `draw=1` +
    `&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false` +
    `&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false` +
    `&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false` +
    `&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false` +
    `&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false` +
    `&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false` +
    `&start=${start}&length=${length}&search%5Bvalue%5D=&search%5Bregex%5D=false&filter=%5B%5D`;

  const response = await axios.post(TARGET_URL, postData, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: COOKIE,
      DNT: "1",
      Origin: "https://jumeirah-bali.recom-at.com",
      Referer: "https://jumeirah-bali.recom-at.com/Asset/List",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "sec-ch-ua":
        '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
  });

  return response.data;
}

// Fungsi parsing data
function parseData(rawData, startIndex) {
  return rawData.map((row, index) => {
    const $0 = cheerio.load(row[0] || "");
    const $1 = cheerio.load(row[1] || "");

    const assetCode = $0("a").text().trim();
    const tags = [];
    $0("span.badge").each((i, el) => {
      const text = $0(el).text().trim();
      if (text) tags.push(text);
    });

    const assetName = $1("p").text().trim();
    const location = row[2];
    const qty = row[3];

    return {
      no: startIndex + index + 1,
      kode_aset: assetCode,
      nama_barang: assetName,
      lokasi: location,
      qty: parseInt(qty) || 0,
      tags: tags.join(", "),
    };
  });
}

async function scrapeData() {
  const allData = [];
  const stats = {
    totalRecords: 0,
    totalBatches: 0,
    successfulBatches: 0,
    failedBatches: 0,
    startTime: Date.now(),
    recordsWithTags: 0,
    uniqueLocations: new Set(),
  };

  try {
    printBanner();

    console.log("⚙️  Konfigurasi:");
    console.log(`   • Target URL: ${TARGET_URL}`);
    console.log(`   • Batch Size: ${formatNumber(BATCH_SIZE)} records/request`);
    console.log(`   • Delay: ${DELAY_MS}ms between requests`);
    console.log();

    // 1. Validasi koneksi & ambil total data
    console.log("🔍 Menghubungi server...");
    const firstResponse = await fetchBatch(0, 1);
    stats.totalRecords = firstResponse.recordsTotal;
    stats.totalBatches = Math.ceil(stats.totalRecords / BATCH_SIZE);

    console.log("   ✅ Koneksi berhasil!\n");

    console.log("📊 Informasi Data:");
    console.log(`   • Total Records: ${formatNumber(stats.totalRecords)}`);
    console.log(`   • Total Batches: ${stats.totalBatches}`);
    console.log(
      `   • Estimasi Waktu: ~${formatDuration(
        stats.totalBatches * (DELAY_MS + 500)
      )}`
    );
    console.log();

    // 2. Konfirmasi
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise((resolve) => {
      rl.question("▶️  Lanjutkan scraping? (y/n): ", (answer) => {
        rl.close();
        if (answer.toLowerCase() !== "y") {
          console.log("\n⛔ Scraping dibatalkan oleh user.");
          process.exit(0);
        }
        resolve();
      });
    });

    console.log("\n" + "─".repeat(70));
    console.log("🚀 Memulai Scraping...\n");

    // 3. Loop scraping dengan progress bar
    for (let i = 0; i < stats.totalBatches; i++) {
      const start = i * BATCH_SIZE;
      const batchStartTime = Date.now();

      try {
        const batchResponse = await fetchBatch(start, BATCH_SIZE);

        if (batchResponse.data && batchResponse.data.length > 0) {
          const parsedData = parseData(batchResponse.data, start);
          allData.push(...parsedData);

          // Update statistics
          stats.successfulBatches++;
          parsedData.forEach((item) => {
            if (item.tags) stats.recordsWithTags++;
            if (item.lokasi) stats.uniqueLocations.add(item.lokasi);
          });

          const batchTime = Date.now() - batchStartTime;
          const avgTime = (Date.now() - stats.startTime) / (i + 1);
          const eta = avgTime * (stats.totalBatches - i - 1);
          const speed = (parsedData.length / batchTime) * 1000;

          // Clear previous line and print progress
          process.stdout.write("\r\x1b[K");
          console.log(
            drawProgressBar(i + 1, stats.totalBatches) +
              ` | Batch ${i + 1}/${stats.totalBatches}`
          );
          console.log(
            `   📦 ${formatNumber(allData.length)}/${formatNumber(
              stats.totalRecords
            )} records | ⚡ ${speed.toFixed(
              0
            )} rec/s | ⏱️  ETA: ${formatDuration(eta)}`
          );
        } else {
          stats.failedBatches++;
          console.log(`   ⚠️  Batch ${i + 1}: Tidak ada data`);
        }
      } catch (error) {
        stats.failedBatches++;
        console.log(`   ❌ Batch ${i + 1}: Error - ${error.message}`);
      }

      // Delay untuk batch berikutnya
      if (i < stats.totalBatches - 1) {
        await delay(DELAY_MS);
      }
    }

    // 4. Summary
    const totalTime = Date.now() - stats.startTime;
    console.log("\n" + "─".repeat(70));
    console.log("✨ Scraping Selesai!\n");

    console.log("📈 Statistik:");
    console.log(`   • Total Data Collected: ${formatNumber(allData.length)}`);
    console.log(
      `   • Successful Batches: ${stats.successfulBatches}/${stats.totalBatches}`
    );
    if (stats.failedBatches > 0) {
      console.log(`   • Failed Batches: ${stats.failedBatches}`);
    }
    console.log(
      `   • Records with Tags: ${formatNumber(stats.recordsWithTags)}`
    );
    console.log(`   • Unique Locations: ${stats.uniqueLocations.size}`);
    console.log(`   • Total Time: ${formatDuration(totalTime)}`);
    console.log(
      `   • Avg Speed: ${((allData.length / totalTime) * 1000).toFixed(
        0
      )} rec/s`
    );
    console.log();

    // 5. Export Files
    console.log("─".repeat(70));
    console.log("💾 Menyimpan Data...\n");

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    const jsonFilename = `hasil_scrape_${timestamp}.json`;
    const excelFilename = `hasil_scrape_${timestamp}.xlsx`;

    // Save JSON
    process.stdout.write("   📄 Membuat file JSON... ");
    fs.writeFileSync(jsonFilename, JSON.stringify(allData, null, 2));
    const jsonSize = (fs.statSync(jsonFilename).size / 1024 / 1024).toFixed(2);
    console.log(`✅ (${jsonSize} MB)`);

    // Save Excel
    process.stdout.write("   📊 Membuat file Excel... ");
    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asset Data");

    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 50 },
      { wch: 30 },
      { wch: 8 },
      { wch: 30 },
    ];

    XLSX.writeFile(workbook, excelFilename);
    const excelSize = (fs.statSync(excelFilename).size / 1024 / 1024).toFixed(
      2
    );
    console.log(`✅ (${excelSize} MB)`);

    console.log();
    console.log("📁 File tersimpan:");
    console.log(`   • JSON:  ${jsonFilename}`);
    console.log(`   • Excel: ${excelFilename}`);

    // 6. Preview
    console.log();
    console.log("─".repeat(70));
    console.log("📋 Preview 5 Data Pertama:\n");
    console.table(
      allData
        .slice(0, 5)
        .map(({ no, kode_aset, nama_barang, lokasi, qty }) => ({
          No: no,
          "Kode Asset": kode_aset,
          "Nama Barang":
            nama_barang.substring(0, 40) +
            (nama_barang.length > 40 ? "..." : ""),
          Lokasi: lokasi,
          Qty: qty,
        }))
    );

    console.log("─".repeat(70));
    console.log(
      "🎉 Proses Selesai! Terima kasih telah menggunakan RECOM Scraper."
    );
    console.log("─".repeat(70));
  } catch (error) {
    console.error("\n" + "═".repeat(70));
    console.error("❌ TERJADI ERROR");
    console.error("═".repeat(70));
    console.error(`\nError Message: ${error.message}`);

    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}`);
      console.error(
        `Response: ${JSON.stringify(error.response.data).substring(0, 200)}`
      );
    }

    // Simpan data partial jika ada
    if (allData.length > 0) {
      console.log(
        `\n⚠️  Menyimpan ${formatNumber(
          allData.length
        )} data yang berhasil dikumpulkan...`
      );
      const partialFilename = `hasil_scrape_partial_${Date.now()}.json`;
      fs.writeFileSync(partialFilename, JSON.stringify(allData, null, 2));
      console.log(`   ✅ File partial disimpan: ${partialFilename}`);
    }

    console.error("\n💡 Troubleshooting:");
    console.error("   1. Pastikan cookie session masih valid");
    console.error("   2. Login ulang di browser dan copy cookie baru");
    console.error("   3. Periksa koneksi internet");
    console.error("   4. Cek apakah server target masih accessible");

    process.exit(1);
  }
}

scrapeData();
