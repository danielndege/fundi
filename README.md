# FundiFlow

FundiFlow is a mobile-first order management app for tailors and dressmakers.
This repository contains a working front-end MVP web app (React + Vite) built
from `docs/fundiflow-mvp.md`.

## Front-end MVP Features

- Create orders with customer info, garment type, fitting/pickup dates, and notes.
- Required-field validation and fitting/pickup date validation.
- Measurement Vault with all MVP measurement fields.
- Save reusable measurement sets per customer and copy into new orders.
- Fabric photo capture/upload with client-side compression.
- Fabric photo metadata support: capture timestamp and optional note.
- Order status workflow (`queued`, `cutting`, `sewing`, `fitting`, `done`) with timeline.
- Status filter + text search on the Orders List.
- Deadline countdown badges with urgency colors.
- Order detail view with measurements, timeline, and fabric gallery.
- Local persistence using `localStorage`.

## Run locally

```bash
npm install
npm run dev
```

Build production bundle:

```bash
npm run build
```
