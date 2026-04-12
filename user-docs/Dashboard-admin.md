# Panduan Admin - RMS

Panduan ini dirancang khusus untuk administrator sistem RMS. Sebagai admin, Anda memiliki akses penuh ke semua fitur dan data dalam sistem.

## Dashboard Admin

### Ringkasan Dashboard

Dashboard admin menampilkan:
- **Total Toko** - Jumlah semua toko dalam sistem
- **Total Layanan** - Jumlah layanan di semua toko
- **Total Pendapatan** - Pendapatan gabungan dari semua toko
- **Layanan Aktif** - Layanan yang sedang berjalan

### Statistik Toko

Setiap toko ditampilkan dengan:
- Nama toko
- Jumlah layanan aktif
- Pendapatan bulan ini
- Jumlah staff dan teknisi

---

## Manajemen Toko

### Melihat Daftar Toko

1. Navigasi ke menu **Dashboard**
2. Anda akan melihat daftar semua toko
3. Setiap toko ditampilkan dalam kartu dengan informasi ringkas

### Menambah Toko Baru

1. Klik tombol **"Tambah Toko Baru"**
2. Isi formulir dengan informasi berikut:
   - **Nama Toko** - Nama lengkap toko
   - **Alamat** - Alamat lengkap toko
   - **Nomor Telepon** - Kontak toko
3. Klik **"Simpan"**

### Mengedit Toko

1. Pada kartu toko, klik tombol **"Edit"**
2. Ubah informasi yang diperlukan
3. Klik **"Simpan"** untuk menyimpan perubahan

### Menghapus Toko

> ⚠️ **Peringatan:** Menghapus toko akan menghapus semua data terkait termasuk layanan, pengguna, dan inventaris.

1. Pada kartu toko, klik tombol **"Hapus"**
2. Konfirmasi penghapusan
3. Toko dan semua data terkait akan dihapus

---

## Manajemen Karyawan

### Melihat Daftar Karyawan

1. Navigasi ke menu **Karyawan**
2. Anda akan melihat daftar semua karyawan di semua toko
3. Informasi yang ditampilkan:
   - Nama
   - Email
   - Peran (Admin/Staff/Teknisi)
   - Toko tempat bertugas

### Menambah Karyawan Baru

1. Klik tombol **"Tambah Karyawan"**
2. Isi formulir:
   - **Nama** - Nama lengkap karyawan
   - **Email** - Email untuk login
   - **Kata Sandi** - Kata sandi awal
   - **Peran** - Pilih peran (Admin/Staff/Teknisi)
   - **Toko** - Pilih toko tempat bertugas
3. Klik **"Simpan"**

### Mengedit Karyawan

1. Cari karyawan yang ingin diedit
2. Klik tombol **"Edit"** pada baris karyawan
3. Ubah informasi yang diperlukan
4. Klik **"Simpan"**

### Mengubah Peran Karyawan

1. Buka detail karyawan
2. Pilih peran baru dari dropdown
3. Simpan perubahan

> ⚠️ **Catatan:** Hanya admin yang dapat mengubah peran pengguna lain.

### Menghapus Karyawan

1. Buka detail karyawan
2. Klik tombol **"Hapus"**
3. Konfirmasi penghapusan

> ⚠️ **Peringatan:** Karyawan yang dihapus tidak dapat dikembalikan.

---

## Manajemen Inventaris

### Mengelola Suku Cadang (Sparepart)

#### Melihat Suku Cadang

1. Navigasi ke menu **Inventaris**
2. Pilih tab **Suku Cadang**
3. Pilih toko yang ingin dilihat

#### Menambah Suku Cadang Baru

1. Klik tombol **"Tambah Suku Cadang"**
2. Isi informasi:
   - **Nama** - Nama suku cadang
   - **Harga Beli** - Harga pembelian
   - **Harga Jual** - Harga penjualan
   - **Stok** - Jumlah stok awal
   - **Kompatibilitas** - Pilih device yang kompatibel
3. Klik **"Simpan"**

#### Mengedit Suku Cadang

1. Cari suku cadang yang ingin diedit
2. Klik tombol **"Edit"**
3. Ubah informasi yang diperlukan
4. Klik **"Simpan"**

#### Menghapus Suku Cadang

1. Pada baris suku cadang, klik tombol **"Hapus"**
2. Konfirmasi penghapusan

> ⚠️ **Catatan:** Suku cadang yang sedang digunakan dalam layanan aktif tidak dapat dihapus.

### Mengelola Daftar Harga Layanan

#### Melihat Daftar Harga

1. Navigasi ke menu **Inventaris**
2. Pilih tab **Daftar Harga Layanan**
3. Pilih toko yang ingin dilihat

#### Menambah Layanan Baru

1. Klik tombol **"Tambah Layanan"**
2. Isi informasi:
   - **Nama Layanan** - Contoh: "Ganti LCD"
   - **Harga** - Harga layanan
   - **Deskripsi** - Deskripsi layanan (opsional)
3. Klik **"Simpan"**

#### Mengedit Daftar Harga

1. Cari layanan yang ingin diedit
2. Klik tombol **"Edit"**
3. Ubah informasi yang diperlukan
4. Klik **"Simpan"**

#### Menghapus Layanan

1. Pada baris layanan, klik tombol **"Hapus"**
2. Konfirmasi penghapusan

---

## Laporan dan Statistik

### Statistik Layanan

Akses statistik untuk melihat:
- Total layanan per periode
- Status layanan (Dalam Perbaikan/Selesai/Diambil)
- Waktu rata-rata perbaikan
- Teknisi dengan performa terbaik

### Laporan Pendapatan

- Pendapatan harian, mingguan, bulanan
- Pendapatan per toko
- Pendapatan per jenis layanan
- Metode pembayaran

### Cara Mengakses Laporan

1. Navigasi ke menu **Laporan**
2. Pilih jenis laporan yang diinginkan
3. Pilih periode waktu
4. Klik **"Generate Laporan"**
5. Laporan dapat diunduh dalam format PDF atau Excel

---

## Tips untuk Admin

### Best Practices

1. **Backup Data Berkala**
   - Pastikan database di-backup secara teratur

2. **Review Akses Pengguna**
   - Periksa peran pengguna secara berkala
   - Hapus akses untuk karyawan yang sudah tidak aktif

3. **Monitor Aktivitas**
   - Periksa log aktivitas untuk audit
   - Pantau layanan yang tertunda

4. **Update Inventaris**
   - Pastikan harga dan stok selalu update
   - Review daftar harga secara berkala

### Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| Pengguna tidak bisa login | Reset kata sandi atau periksa status akun |
| Data tidak sinkron | Refresh halaman atau clear cache browser |
| Laporan tidak muncul | Periksa filter periode dan coba lagi |

---

## Butuh Bantuan?

- Lihat [FAQ](faq.md) untuk pertanyaan umum
- Hubungi tim development untuk masalah teknis
- Dokumentasi API tersedia untuk integrasi
