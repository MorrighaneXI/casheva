# Casheva Command Center

Create a modern, clean, and highly responsive web application UI for "Casheva" (TNI AD Cooperative System). 

### 1. Design System & Theme:

- Style: Professional military/institutional dashboard, clean layout, high contrast, modern rounded cards (Shadcn UI style).

- Color Palette: 

  - Primary: Deep Military/Army Green (#1E3E2B or #2D5A27)

  - Secondary/Accent: Muted Gold/Amber (#D97706) for highlights and statuses

  - Neutral Background: Clean Slate Light Gray (#F8FAFC)

  - Dark Mode support ready.

- Typography: Clean sans-serif (Inter or Plus Jakarta Sans).

### 2. Layout & Global Elements:

- Sidebar Navigation:

  - Header with TNI AD / Koperasi logo placeholder and app title.

  - User context badge displaying current Satminkal/Kotama session (e.g., "Satminkal: Disinfolahtad | Kotama: Mabesad").

  - Role switcher dropdown in header for testing roles: [Admin Koperasi, Pimpinan/Dan/Ka, Kaprim, Pengurus, Pengawas].

  - Menu list: Dashboard, Data Anggota, Transaksi Simpanan, Pengajuan Pinjaman, Verification Center (Approval), Laporan & SHU, Pengaturan Kopstuk.

- Top Header:

  - Search bar, Notification bell with alert badges for pending approvals, and User Profile menu (Nama, Pangkat/NRP).

### 3. Core Pages to Generate:

#### Page A: Executive Dashboard

- KPI Summary Cards (4 Columns):

  1. Total Anggota Aktif (Count & growth indicator)

  2. Total Kas & Simpanan (Rp amount)

  3. Total Pinjaman Berjalan (Rp amount)

  4. Estimasi SHU Tahun Berjalan (Rp amount)

- Analytics Section:

  - Chart 1 (Line chart): Tren Simpanan vs Pinjaman (Jan - Des).

  - Chart 2 (Bar chart): Realisasi Angsuran Bulanan.

- Widget Action Table: "Pengajuan Pinjaman Terbaru" showing status badges (Pending, Verified Jurbay, Approved Dan, ACC Kaprim, Disbursed).

#### Page B: Verification Center / Workflow Pengajuan Pinjaman

- Interactive Loan Application Details & Approval Flow:

  - Horizontal Stepper UI showing workflow status: [1. Pengajuan] -> [2. Verifikasi Jurbay] -> [3. Rekomendasi Dan/Ka] -> [4. ACC Kaprim] -> [5. Upload Berkas] -> [6. Pencairan].

  - Loan Calculator Widget: Inputs for Loan Amount (Rp 1M - 20M), Tenor (1 - 36 Months), auto-calculating 12% per annum interest, monthly installment fee, and net payout.

  - Document Upload Zone: Drag-and-drop file uploaders for PDF/images (Surat Permohonan, Rekomendasi Jurbay, Rekomendasi Dan, Slip Gaji, etc.).

  - Action Panel: Prominent "Approve" (Green) and "Reject" (Red) buttons with a modal dialog for reviewer notes.

#### Page C: Master Data Anggota & Simpanan

- Data Table: List of military members with columns for NRP/NIP, Nama, Pangkat (Pamen, Pama, Ba/Ta/PNS), Korps, Satminkal, and status.

- Action Toolbar: Filters by Pangkat/Satminkal, Search bar, "Run Auto-Generate Simpanan Sukarela Bulanan" button (Auto-executes every 5th of the month).

#### Page D: Laporan & Cetakan (Dynamic Print Preview)

- Dynamic Report Template Preview:

  - Top Kopstuk Satuan editor (allows changing header title & logo).

  - Main Report Table (e.g., Rekapitulasi SHU Anggota with Jasa Modal 20% & Jasa Usaha 30% calculation breakdown).

  - Tajuk Tanda Tangan (Signature block dynamically adjusting for Pejabat approval).

  - Toolbar buttons: [Cetak PDF], [Export Excel], [Sesuaikan Pejabat TTD].

Make the UI interactive using Lucide icons, smooth tab switches, slide-over panels for edit forms, and clean toast notifications.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://casheva.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1987dd53-722e-4be6-b18c-ecb10b3d4993).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
