# Pedoman & Aturan Pengembangan Kode (AGENTS.md)
**EPT UNU Purwokerto (CBT & Sertifikasi Bahasa)**

Dokumen ini memuat aturan standar penulisan kode (coding standards) dan konvensi arsitektur yang wajib ditaati oleh semua AI agent dan developer saat bekerja di repositori ini.

---

## 1. Arsitektur Monorepo & Tech Stack

Aplikasi ini menggunakan struktur monorepo berbasis NPM Workspaces:
- **`apps/web`**: Frontend SPA/SSR menggunakan SvelteKit (Svelte 5), TypeScript, Tailwind CSS, Lucide Icons, dan Svelte-Sonner.
- **`apps/api`**: Backend REST API & Realtime menggunakan Fastify, TypeScript, Zod, JWT, WebSocket, dan BullMQ.
- **`packages/database`**: ORM & Data Layer menggunakan Prisma Client terhubung ke MySQL.

---

## 2. Aturan Frontend (`apps/web`)

### A. Aturan Tailwind CSS & Display Classes
1. **Dilarang Bentrok Display Classes**:
   - Jangan pernah menggabungkan class display yang saling menimpa pada breakpoint yang sama (misal `block` bersamaan dengan `flex`).
   - Jangan mendeklarasikan `flex` tanpa prefix jika elemen memiliki `hidden sm:flex`. Deklarasi yang benar adalah `hidden sm:flex` (bukan `flex ... hidden sm:flex`).
2. **Konsistensi Token Tema (Theme Tokens)**:
   - Gunakan semantic color tokens untuk komponen dashboard: `bg-card`, `text-card-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`.
   - Gunakan palet warna institusional secara terukur:
     - **Emerald / Teal**: Aksi utama (Primary actions), status sukses, status terverifikasi.
     - **Slate / Zinc**: Latar belakang neutral, typography, borders.
     - **Amber / Yellow**: Warning, informasi pending, skor estimasi, aksi butuh perhatian.
     - **Rose / Red**: Danger, aksi destruktif, jawaban salah, error.
     - **Indigo / Purple**: Security, role matrix, analitik.
3. **Responsivitas**:
   - Terapkan pendekatan mobile-first (`hidden md:flex`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).

### B. Larangan Icon AI Magic Sparkle
- **Dilarang Keras**: Jangan gunakan icon `Sparkles` atau icon bertema "AI magic" untuk fungsi UI standar atau institusional (misal header modul, card badge, banner informasi, atau tombol submit).
- **Gunakan Icon Fungsional & Semantik dari `lucide-svelte`**:
  - Soal / Bacaan / Pembahasan: `BookOpen`, `FileQuestion`, `FileText`
  - Audio Listening: `Headphones`, `Volume2`, `Play`, `Pause`
  - Hasil / Nilai / Ekstraksi Data: `FileSpreadsheet`, `Award`, `CheckCircle2`, `BarChart3`
  - Hak Akses / Role / Keamanan: `Shield`, `ShieldCheck`, `Key`, `Lock`
  - Jadwal / Sesi Ujian: `Calendar`, `Clock`, `UserCheck`
  - Peringatan / Info: `AlertCircle`, `Info`, `Bell`

### C. Kebersihan Import & Aksesibilitas
- **Hapus Dead Imports**: Selalu bersihkan import dari `lucide-svelte` atau modul lain yang tidak lagi digunakan dalam template.
- **Semantik Tombol**: Setiap elemen `<button>` wajib memiliki atribut `type="button"` atau `type="submit"` secara eksplisit.
- **Pesan Notifikasi**: Gunakan `toast.success()`, `toast.error()`, atau `toast.warning()` dari `svelte-sonner` dengan pesan Bahasa Indonesia yang ringkas dan informatif.

---

## 3. Aturan Backend (`apps/api`)

### A. Struktur Modular Fastify
Setiap fitur baru harus dibuat modular di bawah direktori `apps/api/src/modules/{feature}/` dengan pemisahan tanggung jawab yang jelas:
```
apps/api/src/modules/{feature}/
├── {feature}.routes.ts      # Definisi endpoint HTTP & schema Fastify
├── {feature}.controller.ts  # Request handler & HTTP response wrapper
├── {feature}.service.ts     # Business logic & interaksi Prisma
└── {feature}.schema.ts      # Validasi Zod (body, query, params, response)
```

### B. Validasi Input & Tipe Data
- Semua input (`body`, `querystring`, `params`) wajib divalidasi menggunakan skema **Zod**.
- Jangan mengandalkan validasi manual di dalam service layer jika sudah bisa disaring di route schema.

### C. Format Response API yang Seragam
Setiap route controller harus mengembalikan format payload yang konsisten:
- **Response Berhasil**:
  ```json
  {
    "success": true,
    "message": "Data berhasil disimpan.",
    "data": { ... }
  }
  ```
- **Response Gagal**:
  ```json
  {
    "success": false,
    "message": "Deskripsi kesalahan yang jelas.",
    "errors": [ ... ]
  }
  ```

### D. Keamanan & RBAC (Role-Based Access Control)
- Lindungi endpoint privat menggunakan hook autentikasi token JWT.
- Pastikan otorisasi memvalidasi hak akses dari 7 role pengguna:
  `SUPER_ADMIN`, `ADMIN_EPT`, `ADMIN`, `QUESTION_AUTHOR`, `VALIDATOR`, `PROCTOR`, `STUDENT`.

---

## 4. Aturan Basis Data (`packages/database`)

1. **Prisma Client**:
   - Selalu akses database melalui instance Prisma Client yang diekspor dari `@starter-kit/database`.
   - Hindari raw query SQL (`$queryRaw`) kecuali untuk query agregasi analitik kompleks yang membutuhkan optimasi khusus.
2. **Integritas Relasi**:
   - Berikan indeks (`@@index`) pada foreign keys dan kolom yang sering dicari (seperti `identityNumber`, `sessionId`, `examId`, `certificateNo`).
3. **Data Seeding & Migrasi**:
   - Perubahan skema dilakukan melalui `npm run db:push` atau migrasi resmi.
   - Jangan memasukkan data rahasia produksi (credentials/private keys) ke dalam seed file `prisma/seed.ts`.

---

## 5. Konvensi Penamaan (Naming Conventions)

| Tipe Elemen | Konvensi | Contoh |
| :--- | :--- | :--- |
| **Svelte Component** | `PascalCase.svelte` | `AudioPlayer.svelte`, `ScoreModal.svelte` |
| **Route Folder** | `kebab-case` | `demo-test`, `master-data`, `audit-logs` |
| **Types / Interfaces** | `PascalCase` | `ExamResult`, `QuestionItem`, `UserRole` |
| **Functions / Methods** | `camelCase` | `handleStartExam()`, `calculateScore()` |
| **Variables / Properties**| `camelCase` | `isSubmitting`, `userAnswers`, `audioUrl` |
| **Enums & Konstanta** | `UPPER_SNAKE_CASE` | `ROLE_ADMIN_EPT`, `SECTION_LISTENING` |
| **Prisma Model** | `PascalCase` | `User`, `ExamSession`, `Certificate` |

---

## 6. Protokol Verifikasi & Quality Gate

Sebelum menyelesaikan tugas atau menyerahkan perubahan:
1. **Frontend Check**:
   Jalankan pemeriksaan diagnostik pada workspace web:
   ```bash
   npm run check --workspace=apps/web
   ```
   *Wajib menghasilkan **0 errors** dan **0 warnings**.*
2. **Backend Check**:
   Pastikan kode TypeScript backend terkompilasi tanpa error:
   ```bash
   npm run build --workspace=apps/api
   ```
3. **Bahasa Antarmuka**:
   Seluruh teks UI, label input, placeholder, konfirmasi dialog, dan pesan error ramah pengguna harus menggunakan **Bahasa Indonesia** yang baku, rapi, dan sesuai dengan lingkungan akademik UNU Purwokerto.
