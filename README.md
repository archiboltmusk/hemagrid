# HemaGrid: India's Integrated Blood Mesh & Logistics Platform

HemaGrid is an open architecture and full-stack software suite designed to eliminate blood shortages, component wastage, and replacement donor distress across India.

---

## Workspace Structure

This repository is organized as an **npm workspaces monorepo**:

```
hemagrid/
├── ARCHITECTURE.md                 # Complete system design & regulatory specs
├── README.md                       # Setup, execution & GitHub push instructions
├── package.json                    # Monorepo orchestrator
│
├── apps/
│   ├── api-server/                 # Central API, Matching Engine & IoT Telemetry (Port 4000)
│   ├── hospital-app/               # Hospital Blood Bank ERP & Expiry Radar (Port 4001)
│   ├── consumer-app/               # Donor Digital Pass & Emergency SOS Beacon (Port 4002)
│   └── partner-app/                # Cold-Chain IoT Monitor & Camp Operations (Port 4003)
│
└── packages/
    └── shared-types/               # Shared TypeScript domain contracts & NBTC data schemas
```

---

## Quick Start

### 1. Prerequisites
* **Node.js**: v18+ (verified with Node v26)
* **npm**: v9+

### 2. Install Dependencies
From the repository root:
```bash
npm install
```

### 3. Running the Applications

You can start each application individually or all concurrently:

| Application | Command | Access URL |
| :--- | :--- | :--- |
| **API & Match Engine** | `npm run dev:api` | [http://localhost:4000](http://localhost:4000) |
| **Hospital Blood Bank ERP** | `npm run dev:hospital` | [http://localhost:4001](http://localhost:4001) |
| **Consumer & Donor Portal** | `npm run dev:consumer` | [http://localhost:4002](http://localhost:4002) |
| **Logistics & Partner Portal** | `npm run dev:partner` | [http://localhost:4003](http://localhost:4003) |

---

## How to Push this Repository to GitHub

This local workspace is already initialized as a Git repository. To push it to your GitHub account:

1. **Create a new repository on GitHub** (e.g., `hemagrid` or `india-blood-grid`). Leave it empty (without initializing README or .gitignore).
2. **Add the remote origin and push**:
   ```bash
   cd /Users/anupam/.gemini/antigravity/scratch/hemagrid
   git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git branch -M main
   git push -u origin main
   ```
3. Alternatively, if you have SSH keys configured:
   ```bash
   git remote add origin git@github.com:<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
   git branch -M main
   git push -u origin main
   ```

---

## Key Features

1. **Vein-to-Vein Tracking:** Barcode scanning and component separation tracking (PRBC, Platelets, FFP) from donor draw to patient transfusion.
2. **Automated Expiry Radar:** Flags platelet units entering their final 48 hours and red cells nearing 35 days, automatically matching them with nearby high-demand hospitals.
3. **Verified Emergency SOS (Zero-Spam):** Replaces frantic social media posts with geofenced, private WhatsApp notifications to eligible compatible donors within 7 km.
4. **Live Cold-Chain IoT Telemetry:** Real-time temperature tracking (2°C–6°C) for inter-hospital EV and drone transfers.
5. **e-RaktKosh Sync Bridge:** Background synchronization service for statutory compliance with the Ministry of Health and Family Welfare (MoHFW).
