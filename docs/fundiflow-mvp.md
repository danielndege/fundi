# FundiFlow MVP Plan

## Product Vision
FundiFlow is a mobile-first order management dashboard for tailors and dressmakers in Kenya.
It replaces fragile paper notebooks with a digital order book that stores customer details,
measurements, fabric references, and production progress in one place.

## Problem Statement
Many tailoring businesses currently use handwritten notebooks to track:
- customer contacts,
- body measurements,
- fabric references,
- deadlines and fitting dates.

This approach causes costly errors (lost notes, wrong fabrics, missed deadlines).

## Target Users
- Tailors and dressmakers working solo or in small shops.
- Businesses handling bespoke garments, uniforms, and event wear.

## MVP Scope (Simple)

### 1) Measurement Vault
A standardized measurement form for each order:
- Neck
- Chest/Bust
- Waist
- Hips
- Shoulder
- Shoulder-to-Waist
- Sleeve Length
- Inseam
- Outseam
- Armhole
- Cuff
- Across Back
- Bicep
- Thigh
- Knee

Requirements:
- Required/optional field validation.
- Ability to save reusable customer measurements and copy into new orders.

### 2) Fabric Photo Reference
- Attach one or more fabric photos to each order.
- Quick “Capture Photo” flow on mobile camera.
- Display thumbnails in order details.

Requirements:
- Compress images before upload.
- Store metadata (capture date, optional note).

### 3) Status Tracker
Simple workflow:
- Queued
- Cutting
- Sewing
- Fitting
- Done

Requirements:
- Change status from order card/list item.
- Filter orders by current status.
- Sort by nearest deadline.

### 4) Deadline Countdown
Visual urgency indicator based on fitting/pickup date:
- Green: 4+ days remaining
- Yellow: 1–3 days remaining
- Red: overdue or due today

Requirements:
- Countdown visible on both list and detail views.
- Auto-update daily.

## Core Screens
1. **Orders List (Default Home)**
   - Search bar
   - Status filters
   - Countdown badge on each order
2. **Create/Edit Order**
   - Customer info
   - Measurement Vault form
   - Fabric photo upload/capture
   - Fitting & pickup dates
3. **Order Detail**
   - Timeline of status updates
   - Measurement summary
   - Fabric gallery

## Suggested Data Model

### Customer
- id
- full_name
- phone
- alternate_phone (optional)
- notes (optional)

### Order
- id
- customer_id
- garment_type
- status (queued|cutting|sewing|fitting|done)
- fitting_date (optional)
- pickup_date
- created_at
- updated_at

### MeasurementSet
- id
- customer_id
- order_id
- measurement_values (key/value map)
- unit (cm|in)

### FabricPhoto
- id
- order_id
- image_url
- note (optional)
- created_at

## UX Priorities
- Mobile-first layout (single-hand use).
- Large touch targets for quick updates while working.
- Works in low-connectivity conditions (offline draft + sync when online).

## Non-Functional MVP Requirements
- Fast load time on budget Android phones.
- Basic authentication (shop owner + optional assistant).
- Daily cloud backup of order records.
- Audit log for status changes.

## Success Metrics (First 90 Days)
- At least 80% of active orders managed digitally (not paper).
- Reduced missed pickups by 30%.
- Reduced “wrong fabric” incidents by 50%.

## Suggested Technical Stack (MVP)
- Frontend: React + Vite (PWA, mobile-first UI)
- Backend: Supabase (PostgreSQL + Auth + Storage)
- Image storage: Supabase Storage
- Hosting: Vercel (frontend) + Supabase managed backend

## Delivery Plan
1. Week 1: Design flows + schema + auth.
2. Week 2: Order CRUD + measurement vault.
3. Week 3: Fabric photo capture/upload + status tracker.
4. Week 4: Countdown indicators + polish + pilot onboarding.

## Future Enhancements
- SMS/WhatsApp reminders for fittings and pickups.
- Payment tracking and deposit balances.
- Basic analytics (orders per month, top garment types).
- Multi-branch support.
