# Ringkasan Fitur - RMS

Dokumentasi ini menjelaskan semua fitur yang tersedia dalam sistem RMS (Repair Management System).

## Manajemen Layanan

### 📝 Pembuatan Layanan

**Deskripsi:** Membuat tiket layanan baru untuk perbaikan device pelanggan.

**Fitur:**
- Input data pelanggan (nama, WhatsApp, email)
- Input data device (merk, model, IMEI, warna)
- Pencatatan keluhan/kerusakan
- Penambahan item (suku cadang dan jasa)
- Perhitungan total biaya otomatis
- Penomoran tiket otomatis

**Akses:** Staff, Admin

---

### 🔄 Tracking Status Layanan

**Deskripsi:** Melacak progress layanan dari penerimaan hingga pengambilan.

**Status Alur:**
1. **Diterima** - Layanan baru diterima
2. **Diperbaiki** - Sedang dikerjakan teknisi
3. **Selesai** - Perbaikan selesai, menunggu pembayaran
4. **Diambil** - Pelanggan sudah mengambil device

**Fitur:**
- Update status real-time
- Catatan progress setiap status
- Timeline lengkap layanan
- Riwayat perubahan status

**Akses:** Semua peran (dengan batasan)

---

### 👨‍🔧 Penugasan Teknisi

**Deskripsi:** Menugaskan teknisi untuk menangani layanan.

**Fitur:**
- List teknisi tersedia
- Penugasan manual oleh staff
- Teknisi dapat ambil tugas sendiri
- Notifikasi ke teknisi
- Tracking teknisi per layanan

**Akses:** Staff, Admin, Teknisi (ambil sendiri)

---

### 📊 Detail Layanan

**Deskripsi:** Melihat informasi lengkap tentang sebuah layanan.

**Informasi Tersedia:**
- Data pelanggan lengkap
- Data device dan kelengkapan
- Keluhan dan diagnosa
- Item yang digunakan (sparepart & jasa)
- Total biaya dan pembayaran
- Timeline status
- Teknisi yang menangani
- Catatan internal

**Akses:** Semua peran

---

## Manajemen Inventaris

### 📦 Suku Cadang (Sparepart)

**Deskripsi:** Mengelola inventory suku cadang per toko.

**Fitur:**
- CRUD sparepart (Create, Read, Update, Delete)
- Tracking stok
- Harga beli dan jual
- Kompatibilitas dengan device
- Kategori sparepart
- Low stock alert

**Data Sparepart:**
- Nama
- Harga beli
- Harga jual
- Stok
- Toko
- Device kompatibel

**Akses:** Admin, Staff (terbatas)

---

### 💰 Daftar Harga Layanan

**Deskripsi:** Mengelola harga jasa layanan per toko.

**Fitur:**
- CRUD layanan
- Harga per jenis layanan
- Deskripsi layanan
- Kategori layanan

**Contoh Layanan:**
- Ganti LCD
- Ganti Baterai
- Ganti Kamera
- Flash/Software
- Repair IC
- Lainnya

**Akses:** Admin, Staff (terbatas)

---

### 📱 Katalog Device

**Deskripsi:** Katalog global merk dan model device.

**Fitur:**
- Daftar merk (Samsung, iPhone, Xiaomi, dll)
- Model per merk
- Kompatibilitas sparepart
- Data shared semua toko

**Akses:** Semua peran (read-only untuk sebagian besar)

---

## Manajemen Toko

### 🏪 Data Toko

**Deskripsi:** Mengelola data toko/branch lokasi.

**Fitur:**
- CRUD toko
- Informasi lengkap toko (nama, alamat, telepon)
- Assignment pengguna ke toko
- Data isolation per toko
- Statistik per toko

**Akses:** Admin

---

### 📈 Multi-Store Support

**Deskripsi:** Dukungan untuk multiple toko dengan data terpisah.

**Fitur:**
- Data isolation per toko
- User assignment per toko
- Statistik individual per toko
- Aggregated view untuk admin
- Sparepart & pricelist per toko

**Akses:** Admin (semua toko), Staff/Teknisi (toko sendiri)

---

## Manajemen Pengguna

### 👥 User Management

**Deskripsi:** Mengelola pengguna sistem.

**Fitur:**
- CRUD pengguna
- Assignment role (Admin/Staff/Teknisi)
- Assignment ke toko
- Reset password
- Aktivasi/nonaktivasi user

**Akses:** Admin

---

### 🔐 Role-Based Access Control

**Deskripsi:** Kontrol akses berdasarkan peran pengguna.

**Peran:**

| Peran | Akses |
|-------|-------|
| **Admin** | Full access ke semua fitur dan data |
| **Staff** | Layanan, pelanggan, inventaris (toko sendiri) |
| **Teknisi** | Tugas, update status, tambah item |

**Fitur:**
- Permission per fitur
- Data visibility berdasarkan role
- Role assignment dinamis

**Akses:** Admin (manage role)

---

## Dashboard & Laporan

### 📊 Dashboard Role-Specific

**Deskripsi:** Dashboard yang disesuaikan dengan peran pengguna.

**Dashboard Admin:**
- Statistik semua toko
- Total pendapatan
- Jumlah layanan semua toko
- Performa per toko
- User management quick access

**Dashboard Staff:**
- Statistik toko sendiri
- Layanan aktif
- Layanan selesai hari ini
- Quick action buat layanan baru
- Notifikasi

**Dashboard Teknisi:**
- Tugas tersedia
- Sedang dikerjakan
- Selesai hari ini
- Statistik performa pribadi

---

### 📈 Laporan & Statistik

**Deskripsi:** Generate laporan dan statistik.

**Jenis Laporan:**
- Laporan pendapatan (harian, mingguan, bulanan)
- Laporan layanan per status
- Laporan performa teknisi
- Laporan popularitas jenis perbaikan
- Laporan penggunaan sparepart

**Fitur:**
- Filter periode
- Filter per toko
- Export PDF/Excel
- Grafik visualisasi

**Akses:** Admin (semua), Staff (toko sendiri)

---

## Notifikasi

### 🔔 WhatsApp Notification

**Deskripsi:** Notifikasi otomatis ke pelanggan via WhatsApp.

**Trigger Notifikasi:**
- Layanan baru dibuat
- Perbaikan dimulai
- Perbaikan selesai
- Siap diambil

**Fitur:**
- Template pesan otomatis
- Tracking status kirim
- Manual resend jika gagal

**Akses:** Staff, Admin

---

### 📬 Notifikasi Internal

**Deskripsi:** Notifikasi dalam sistem untuk pengguna.

**Jenis Notifikasi:**
- Tugas baru untuk teknisi
- Update status layanan
- Low stock alert
- User assignment

**Fitur:**
- Real-time notification
- Badge counter
- Mark as read
- Notification history

**Akses:** Semua peran

---

## Fitur Lainnya

### 🔍 Pencarian & Filter

**Deskripsi:** Mencari dan memfilter data.

**Fitur Pencarian:**
- Pencarian layanan (nomor tiket, nama pelanggan)
- Pencarian pelanggan (nama, nomor WA)
- Pencarian sparepart (nama, kompatibilitas)
- Pencarian pengguna (email, nama)

**Fitur Filter:**
- Filter berdasarkan tanggal
- Filter berdasarkan status
- Filter berdasarkan toko
- Filter berdasarkan teknisi
- Filter berdasarkan kategori

**Akses:** Semua peran

---

### 📝 Audit Log

**Deskripsi:** Pencatatan semua aktivitas dalam sistem.

**Yang Dicatat:**
- Login/logout user
- Pembuatan layanan
- Update status
- Perubahan data
- Delete data

**Fitur:**
- Timestamp setiap aksi
- User yang melakukan aksi
- Detail perubahan
- Filterable log

**Akses:** Admin

---

### 🖨️ Cetak Invoice

**Deskripsi:** Generate dan cetak invoice untuk pelanggan.

**Fitur:**
- Template invoice profesional
- Detail lengkap layanan
- Breakdown biaya (sparepart & jasa)
- Informasi toko dan pelanggan
- Export PDF

**Akses:** Staff, Admin

---

### 💳 Pembayaran

**Deskripsi:** Tracking pembayaran layanan.

**Fitur:**
- Status pembayaran (Belum Lunas/Lunas)
- Metode pembayaran (Tunai, Transfer, E-Wallet, Kartu)
- Catatan pembayaran
- Riwayat pembayaran

**Akses:** Staff, Admin

---

### 🌙 Dark Mode

**Deskripsi:** Tema gelap untuk kenyamanan mata.

**Fitur:**
- Toggle dark/light mode
- Persistent preference
- Auto-detect system preference

**Akses:** Semua peran

---

### 📱 Responsive Design

**Deskripsi:** Tampilan optimal di semua device.

**Fitur:**
- Mobile-friendly
- Tablet optimization
- Desktop layout
- Touch-friendly interface

**Akses:** Semua peran

---

## Ringkasan Akses Per Peran

| Fitur | Admin | Staff | Teknisi |
|-------|-------|-------|---------|
| Dashboard | ✅ Semua toko | ✅ Toko sendiri | ✅ Pribadi |
| Buat Layanan | ✅ | ✅ | ❌ |
| Update Status | ✅ | ✅ | ✅ (terbatas) |
| Kelola Toko | ✅ | ❌ | ❌ |
| Kelola Pengguna | ✅ | ❌ | ❌ |
| Kelola Inventaris | ✅ | ✅ (terbatas) | ❌ |
| Ambil Tugas | ✅ | ❌ | ✅ |
| Lihat Laporan | ✅ Semua | ✅ Toko sendiri | ❌ |
| Cetak Invoice | ✅ | ✅ | ❌ |

---

## Integrasi & API

### 🔌 API Endpoints

**Deskripsi:** REST API untuk integrasi eksternal.

**Tersedia:**
- Authentication API
- Services API
- Inventory API
- Users API
- Reports API

**Akses:** Developer (dengan API key)

---

## Roadmap Fitur

Fitur yang direncanakan untuk masa depan:
- [ ] Customer portal (pelanggan bisa track sendiri)
- [ ] SMS notification (selain WhatsApp)
- [ ] Email notification
- [ ] Barcode/QR scanning untuk sparepart
- [ ] Multi-currency support
- [ ] Advanced analytics dengan AI
- [ ] Mobile app native

---

## Butuh Bantuan?

- Lihat panduan spesifik peran: [Admin](admin-guide.md), [Staff](staff-guide.md), [Teknisi](technician-guide.md)
- Lihat [FAQ](faq.md) untuk pertanyaan umum
- Hubungi admin untuk request fitur baru
