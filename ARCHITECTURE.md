# HemaGrid: Sovereign Technical Specification & National Architecture

An open-source, full-stack digital blood mesh, cold-chain IoT tracking engine, hospital ERP, and voluntary donor network designed for the **Ministry of Health and Family Welfare (MoHFW)**, **National Blood Transfusion Council (NBTC)**, and **State Health Missions**.

---

## 1. The 6 Structural Ground Realities (And How HemaGrid Solves Each)

India's national blood collection numbers look sufficient on paper (~13M units collected annually against ~14.5M units benchmarked by WHO). However, ground realities are fractured by poor distribution, systemic inefficiencies, and deep-seated logistical bottlenecks:

### 1. The Burden of the "Replacement Donor" System
* **Ground Reality:** Hospitals compel distressed relatives of trauma, labor, or emergency surgery patients to arrange replacement donors before blood is released. Many family members are disqualified due to high blood pressure, diabetes, or age, fueling commercial touts and fraudulent donor identity.
* **HemaGrid Solution:** **HemaShield Social Contract & 365-Day Corporate/College Rolling Calendars**. When a citizen donates voluntarily once, their entire family receives guaranteed priority blood access with zero replacement donor demands.

### 2. "Blood Deserts" and Geographic Inequality
* **Ground Reality:** Over 70% of rural and semi-urban populations live 30–60 minutes away from licensed blood centers. Peripheral Community Health Centres (CHCs) lack licensed blood storage units.
* **HemaGrid Solution:** **Hub-and-Spoke Consolidation & Certified Drone/EV Corridors**. Central Mother Hubs supply smaller Blood Storage Centers (Spokes) using IoT-monitored smart cold boxes and autonomous medical drones (< 20-minute transit).

### 3. Lack of Real-Time, Unified Inventory & Inter-Bank Mobility
* **Ground Reality:** Data entry on central portals is manual and delayed. A blood bank showing "3 units" online is often empty in reality. Hospitals in one zone discard surplus units while hospitals 5 km away turn away dying patients.
* **HemaGrid Solution:** **Barcode-Level Auto-Sync & The Inter-Bank Clearinghouse**. Inventory updates automatically at the scanner level. The **Expiry Radar** transfers units nearing expiration (platelets < 48h, PRBC < 7d) to nearby facilities with active demand.

### 4. Overuse of Whole Blood vs. Component Separation
* **Ground Reality:** Non-tertiary centers collect and dispense whole blood, wasting platelets and plasma. One whole blood donation could save up to 3 lives if split into PRBC, Platelets, and FFP.
* **HemaGrid Solution:** **Mandatory Component Tracking & Domestic Plasma Pooling**. HemaGrid tracks individual blood fractions from the phlebotomy chair and routes unutilized plasma to domestic manufacturing plants for Human Albumin and Factor VIII.

### 5. High Wastage and Short Shelf-Life
* **Ground Reality:** Platelets expire within 5 days. Holiday donation camps on August 15 collect thousands of bags that overwhelm storage and expire unused 35 days later, followed by months of shortage.
* **HemaGrid Solution:** **Dynamic Demand Balancing & Algorithmic Quota Management**. Mass collection drives are smoothed into monthly cohorts (30–50 units/week), preventing holiday gluts and mid-year famines.

### 6. The Eligible Donor Paradox
* **Ground Reality:** Myths of weakness or pain, high female anemia deferral rates (hemoglobin < 12.5 g/dL), and scarce Rh-negative (< 5%) and Bombay phenotypes leave emergency reserves vulnerable.
* **HemaGrid Solution:** **Nurturing Anemia Deferral Loops & The National Rare Phenotype Registry**. Deferred donors receive nutritional iron guidance and automatic 30-day re-testing invitations. Rare blood phenotypes are geofenced and matched privately via WhatsApp.

---

## 2. System Architecture

```
                                  ┌─────────────────────────────────────────┐
                                  │   e-RaktKosh National Gateway (MoHFW)   │
                                  │   Ayushman Bharat (ABDM / ABHA ID)      │
                                  └────────────────────▲────────────────────┘
                                                       │ (Live API Sync)
┌───────────────────────────────┐       ┌──────────────▼───────────────┐       ┌───────────────────────────────┐
│       HemaGrid Clinical       │       │    Central Clearinghouse     │       │       HemaPass Citizen        │
│    (Hospital Blood Bank ERP)  │◄─────►│   (API & Matching Engine)    │◄─────►│    (Donor & Patient Portal)   │
│ • Vein-to-Vein Barcoding      │       │ • Expiry Radar Algorithm     │       │ • Digital HemaPass with QR    │
│ • Mandatory 5 TTI Serology    │       │ • Geofenced SOS Beacon       │       │ • HemaShield Family Policy    │
│ • Bedside Double-Scan Tool    │       │ • Auto-Replenishment Trigger │       │ • WhatsApp Zero-App Bot       │
│ • Automatic Quarantine Lock   │       │ • Rare Phenotype Registry    │       │ • 30-Sec Eligibility Checker  │
└───────────────────────────────┘       └──────────────▲───────────────┘       └───────────────────────────────┘
                                                       │
                                        ┌──────────────▼───────────────┐
                                        │      HemaGrid ColdMesh       │
                                        │    (Logistics & Telemetry)   │
                                        │ • Sensirion STS35 IoT Sensors│
                                        │ • Continuous 2°C-6°C Logging │
                                        │ • Autonomous Drone Corridors │
                                        │ • Electronic Handover Manifest│
                                        └──────────────────────────────┘
```

---

## 3. The 4 Applications in the Monorepo

| Service | Port | Primary User | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **API & Match Engine** | `4000` | System / Gateway | Redis live state, PostGIS spatial queries, automated replenishment, TTI safety locks, statutory price validation. |
| **Hospital ERP** | `4001` | Blood Bank Officers, Lab Techs | Component inventory grid, vein-to-vein barcoding, bedside double-scan validation, auto-expiry dispatch. |
| **Consumer Portal** | `4002` | Donors, Anxious Families | Digital HemaPass with QR, emergency SOS beacon, Thalassemia recurring circle, 15-min VIP camp booking. |
| **Logistics Console** | `4003` | Courier Drivers, Drone Fleet | Live IoT temperature logs, route coordinates, automated spoiled-blood lockout, transfer manifests. |

---

## 4. Statutory & Regulatory Standards (India)

* **Drugs & Cosmetics Act, 1940 & Rules, 1945 (Part XII-B & Schedule F):**
  * Prohibition of paid/commercial blood donation.
  * Mandatory screening for 5 TTIs: HIV-1 & 2, Hepatitis B (HBsAg), Hepatitis C (HCV), Syphilis (VDRL), Malaria.
  * Thermal parameters: PRBC ($2^\circ\text{C}$ to $6^\circ\text{C}$), Platelets ($20^\circ\text{C}$ to $24^\circ\text{C}$ with continuous agitation), FFP ($\le -30^\circ\text{C}$).
* **National Blood Transfusion Council (NBTC):**
  * Rate capping adherence: PRBC (₹1,450 Govt / ₹1,550 Private), Platelets (₹400), FFP (₹400).
* **Digital Personal Data Protection (DPDP) Act, 2023:**
  * Strict phone number masking (`+91 98*** **210`) in public directories to prevent tout exploitation.
  * ABHA 14-digit ID native integration.
