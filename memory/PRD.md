# Salah Time Generator - PRD

## Problem Statement
Build a mobile responsive tool to generate salah (prayer) time for each masjid based on their own adjustments.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI
- **Backend**: FastAPI + MongoDB (Motor)
- **Auth**: Google OAuth via Emergent Auth
- **Export**: CSV, Excel (xlsxwriter), PDF (reportlab)

## What's Been Implemented (April 30, 2026)
- [x] Google OAuth authentication
- [x] Dashboard with stats
- [x] Add Masjid (name, location, Mihrab ID, Imam, Muaddin, Committee Members, Remark)
- [x] Edit Masjid details
- [x] Masjid list with delete
- [x] Waqth Chart management (CSV/Excel upload + manual JSON)
- [x] Waqth Chart detail/preview page
- [x] Masjid Detail with full adjustment configuration
- [x] Time format parser (handles period-format 5.2→5:20, colon 5:20, Excel decimals)
- [x] Salah time generation (rounding: nearest 5, up 5, down 5, custom)
- [x] Fixed time option per prayer
- [x] Iqamah = Azan + offset per prayer
- [x] 2 salah charts per masjid
- [x] Export to CSV, Excel, PDF (slugified filenames)
- [x] Column name normalization (handles FAJR, Fajr, fajr)
- [x] Mobile responsive sidebar/layout

## Test Results (Iteration 2)
- Backend: 26/26 tests pass (100%)
- Frontend: 8/8 Playwright tests pass (100%)

## Prioritized Backlog
### P1 (Next)
- Month/year filtering on generated times
- Bulk masjid import
- Waqth chart edit functionality

### P2 (Future)
- Multi-user sharing (share masjid config with others)
- PDF template customization
- Public shareable link for masjid prayer times
- Automatic prayer time calculation from coordinates
