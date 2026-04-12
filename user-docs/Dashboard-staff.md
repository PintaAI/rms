# Panduan Staff - RMS

Panduan ini dirancang khusus untuk staff toko dalam sistem RMS. Staff bertanggung jawab untuk mengelola layanan dan pelanggan.

## Dashboard Staff

### Ringkasan Dashboard

Dashboard staff menampilkan:
- **Layanan Aktif** - Jumlah layanan yang sedang berjalan
- **Layanan Selesai Hari Ini** - Layanan yang selesai hari ini
- **Pendapatan Hari Ini** - Total pendapatan hari ini
- **Menunggu Teknisi** - Layanan yang belum diambil teknisi

### Statistik Cepat

- Layanan berdasarkan status
- Layanan terbaru
- Notifikasi penting

---

## Manajemen Layanan

### Melihat Daftar Layanan

1. Navigasi ke menu **Layanan**
2. Anda akan melihat daftar semua layanan di toko Anda
3. Informasi yang ditampilkan:
   - Nomor layanan/tiket
   - Nama pelanggan
   - Device (merk & model)
   - Keluhan/kerusakan
   - Status saat ini
   - Teknisi yang menangani
   - Tanggal masuk

### Filter dan Pencarian

Gunakan filter untuk menemukan layanan:
- **Berdasarkan Status** - Semua/Diterima/Diperbaiki/Selesai/Diambil
- **Berdasarkan Tanggal** - Hari ini/Minggu ini/Bulan ini
- **Berdasarkan Teknisi** - Pilih teknisi tertentu
- **Pencarian** - Cari berdasarkan nama pelanggan atau nomor tiket

---

## Membuat Layanan Baru

### Langkah-langkah Membuat Layanan

1. **Klik tombol "Buat Layanan Baru"**
   - Tombol terletak di halaman dashboard atau halaman Layanan

2. **Isi Informasi Pelanggan**
   - **Nama Pelanggan** - Nama lengkap pelanggan
   - **Nomor WhatsApp** - Nomor WA untuk notifikasi
   - **Email** - Email pelanggan (opsional)
   - **Alamat** - Alamat pelanggan (opsional)

3. **Isi Informasi Device**
   - **Merk** - Pilih merk device (Samsung, iPhone, Xiaomi, dll)
   - **Model** - Pilih model device
   - **IMEI/Serial Number** - Nomor IMEI atau serial (opsional)
   - **Warna** - Warna device
   - **Kelengkapan** - Catatan kelengkapan (case, charger, dll)

4. **Isi Informasi Perbaikan**
   - **Keluhan Utama** - Deskripsi masalah/kerusakan
   - **Catatan Tambahan** - Informasi lain yang relevan
   - **Prioritas** - Normal/Express

5. **Tambah Item Layanan**
   - **Suku Cadang** - Pilih sparepart yang dibutuhkan
   - **Jasa Layanan** - Pilih jenis jasa perbaikan
   - Sistem akan menghitung total otomatis

6. **Simpan Layanan**
   - Review semua informasi
   - Klik **"Simpan Layanan"**
   - Nomor tiket akan dibuat otomatis

### Tips Membuat Layanan

✅ **Pastikan data pelanggan akurat** untuk notifikasi yang tepat

✅ **Foto kondisi device** sebelum perbaikan sebagai dokumentasi

✅ **Catat semua kelengkapan** yang dibawa pelanggan

✅ **Jelaskan estimasi biaya** dan waktu perbaikan kepada pelanggan

---

## Mengelola Pelanggan

### Melihat Riwayat Pelanggan

1. Cari pelanggan berdasarkan nama atau nomor WA
2. Klik pada nama pelanggan
3. Anda akan melihat:
   - Informasi kontak
   - Riwayat layanan
   - Total pengeluaran
   - Catatan khusus

### Menambah Pelanggan Baru

Pelanggan otomatis tercatat saat membuat layanan baru. Untuk menambah manual:

1. Navigasi ke menu **Pelanggan**
2. Klik **"Tambah Pelanggan"**
3. Isi informasi pelanggan
4. Klik **"Simpan"**

### Catatan Pelanggan

Tambahkan catatan khusus untuk pelanggan:
- Preferensi komunikasi
- Riwayat keluhan
- Diskon khusus
- Lainnya

---

## Melacak Status Layanan

### Status Layanan

Sistem memiliki alur status berikut:

| Status | Deskripsi |
|--------|-----------|
| 📥 **Diterima** | Layanan baru diterima, menunggu teknisi |
| 🔧 **Diperbaiki** | Sedang dikerjakan oleh teknisi |
| ✅ **Selesai** | Perbaikan selesai, menunggu pembayaran/pengambilan |
| 📤 **Diambil** | Pelanggan sudah mengambil device |

### Mengupdate Status

1. Buka detail layanan
2. Klik tombol **"Update Status"**
3. Pilih status baru
4. Tambahkan catatan jika perlu
5. Klik **"Simpan"**

> ⚠️ **Catatan:** Hanya status tertentu yang dapat diubah oleh staff. Teknisi memiliki kontrol lebih untuk status perbaikan.

### Notifikasi ke Pelanggan

Sistem dapat mengirim notifikasi WhatsApp otomatis saat status berubah:
- Layanan diterima
- Perbaikan dimulai
- Perbaikan selesai
- Siap diambil

---

## Detail Layanan

### Informasi dalam Detail Layanan

Saat membuka detail layanan, Anda akan melihat:

#### Informasi Pelanggan
- Nama, nomor WA, email
- Riwayat layanan sebelumnya

#### Informasi Device
- Merk, model, IMEI
- Warna, kelengkapan

#### Informasi Perbaikan
- Keluhan utama
- Diagnosa teknisi
- Item yang digunakan (sparepart & jasa)
- Total biaya
- Status pembayaran

#### Timeline
- Waktu penerimaan
- Waktu penugasan teknisi
- Waktu selesai
- Waktu pengambilan

### Mencetak Invoice

1. Buka detail layanan
2. Klik tombol **"Cetak Invoice"**
3. Invoice akan terbuka dalam jendela baru
4. Cetak atau simpan sebagai PDF

### Menerima Pembayaran

1. Buka detail layanan
2. Klik tombol **"Terima Pembayaran"**
3. Pilih metode pembayaran:
   - Tunai
   - Transfer
   - E-Wallet
   - Kartu Kredit/Debit
4. Masukkan jumlah yang dibayar
5. Klik **"Proses Pembayaran"**
6. Status akan berubah menjadi "Lunas"

---

## Interaksi dengan Teknisi

### Menugaskan Teknisi

1. Buka layanan yang belum ada teknisi
2. Klik **"Tugaskan Teknisi"**
3. Pilih teknisi yang tersedia
4. Teknisi akan mendapat notifikasi

### Komunikasi dengan Teknisi

- Gunakan fitur catatan internal untuk komunikasi
- Teknisi dapat update status dan menambah item
- Monitor progress melalui dashboard

---

## Tips untuk Staff

### Best Practices

1. **Verifikasi Data Pelanggan**
   - Pastikan nomor WA aktif untuk notifikasi
   - Catat nama dengan benar

2. **Dokumentasi Lengkap**
   - Foto kondisi device sebelum perbaikan
   - Catat semua goresan/kerusakan yang sudah ada
   - List semua kelengkapan yang dibawa

3. **Komunikasi yang Jelas**
   - Jelaskan prosedur perbaikan
   - Berikan estimasi waktu dan biaya
   - Update pelanggan jika ada perubahan

4. **Follow-up**
   - Hubungi pelanggan jika device sudah siap
   - Follow-up layanan yang sudah lama tidak diambil

### Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| Tidak bisa membuat layanan | Periksa koneksi internet, refresh halaman |
| Pelanggan tidak dapat notifikasi | Periksa nomor WhatsApp, coba kirim manual |
| Data tidak tersimpan | Pastikan semua field wajib diisi |
| Invoice tidak bisa dicetak | Periksa popup blocker di browser |

---

## Butuh Bantuan?

- Lihat [FAQ](faq.md) untuk pertanyaan umum
- Hubungi admin untuk masalah akses
- Konsultasi dengan supervisor untuk kasus khusus
