# EPTUNU - Platform Computer-Based Testing (CBT) UNU Purwokerto

Platform Ujian Bahasa Inggris Terkomputerisasi (English Proficiency Test) Universitas Nahdlatul Ulama Purwokerto.

---

## 🔑 Kredensial Login Demo (Password Default: `password123`)

| Role Pengguna | Identity Number (NIM / NIP) | Email | Akses & Wewenang |
|---|---|---|---|
| 🛡️ **Super Admin** | `SUPERADMIN01` | `superadmin@unupurwokerto.ac.id` | Pengelola penuh sistem, setting, audit log, & hak akses |
| 🏛️ **Admin EPT / UPT Bahasa** | `ADMINEPT01` | `adminept@unupurwokerto.ac.id` | Operator utama (Periode tes, jadwal, paket soal, cetak sertifikat) |
| 📝 **Penyusun Soal (Author)** | `AUTHOR01` | `author@unupurwokerto.ac.id` | Pembuat & pengedit bank soal Listening (MP3), Structure, Reading |
| 🔍 **Validator (Reviewer)** | `VALIDATOR01` | `validator@unupurwokerto.ac.id` | Reviewer kualitas soal (Approve, Reject, Catatan revisi) |
| 👁️ **Pengawas (Proctor)** | `PROCTOR01` | `proctor@unupurwokerto.ac.id` | Pengawas ujian real-time (Reset sesi, tambahan waktu, monitoring) |
| 👨‍🎓 **Peserta (Student)** | `202601001` | `ahmad.fauzi@student.unupurwokerto.ac.id` | Mengikuti ujian CBT, lihat hasil skor TOEFL (310-677), sertifikat |
| 📊 **Pimpinan (Executive)** | `EXECUTIVE01` | `pimpinan@unupurwokerto.ac.id` | Dashboard statistik kelulusan & rekap per Fakultas/Prodi |

---

## 🔑 Token Ujian Simulasi
- **Token**: `EPT2026`

---

## 🚀 Cara Menjalankan Aplikasi
```bash
# 1. Jalankan server API & Web bersamaan
npm run dev

# App Frontend: http://localhost:5173
# API Server:   http://localhost:3001
# Swagger Docs: http://localhost:3001/documentation
```