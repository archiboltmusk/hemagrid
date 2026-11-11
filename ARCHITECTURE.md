# HemaGrid Architecture Specification

## 1. System Overview

HemaGrid is an end-to-end, full-stack digital blood banking, real-time inventory balancing, and cold-chain logistics platform tailored specifically to solve India's systemic blood supply fragmentation.

```
                                  ┌───────────────────────────────┐
                                  │   e-RaktKosh National Grid    │
                                  │  (Govt. of India Compliance)  │
                                  └───────────────▲───────────────┘
                                                  │ (Automated Sync API)
┌─────────────────────────┐       ┌───────────────▼───────────────┐       ┌─────────────────────────┐
│      Hospital App       │       │       Central API Server      │       │      Consumer App       │
│  (Port 4001: Clinical)  │◄─────►│   (Port 4000: Match Engine)   │◄─────►│    (Port 4002: Donor)   │
│ • Real-time Stock Grid  │       │ • Expiry Radar Matching       │       │ • Digital HemaPass      │
│ • Expiry Alert Radar    │       │ • Geofenced SOS Beacon        │       │ • Emergency SOS Wizard  │
│ • Vein-to-Vein Barcoding│       │ • Inter-Bank Clearinghouse    │       │ • Pre-Screening Checker │
│ • Issue & Cross-Match   │       │ • IoT Telemetry Ingestion     │       │ • Drive Slot Booking    │
└─────────────────────────┘       └───────────────▲───────────────┘       └─────────────────────────┘
                                                  │
                                  ┌───────────────▼───────────────┐
                                  │      Partner & Logistics      │
                                  │     (Port 4003: Cold Chain)   │
                                  │ • IoT Sensor Temperature Log  │
                                  │ • GPS Route & Drone Tracking  │
                                  │ • Camp Drive Pacing & Roster  │
                                  └───────────────────────────────┘
```

---

## 2. Core Modules & Port Allocations

| Component | Port | Primary Stakeholders | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| **API & Match Engine** | `4000` | System / All Apps | Central inventory state, cross-hospital exchange, SOS dispatch, IoT ingestion. |
| **Hospital ERP App** | `4001` | Blood Bank Officers, Lab Techs, Clinicians | Vein-to-vein bag barcoding, NAT/ELISA test recording, stock grid, expiry radar. |
| **Consumer App** | `4002` | Voluntary Donors, Patient Attendants | Verified Digital HemaPass, emergency SOS beacon, camp slot reservation, eligibility. |
| **Partner App** | `4003` | Cold-Chain Couriers, Drone Operators, Camp Leads | Real-time thermal sensor logs (2°C–6°C), transfer manifests, camp operations. |

---

## 3. Algorithmic Workflows

### 3.1 The Expiry-Radar & Automated Redistribution Algorithm
* **Platelet Lifespan:** 5 days (120 hours).
* **PRBC Lifespan:** 35–42 days.
* **Trigger Condition:** When a blood bank has Platelet units with $\le 48$ hours of shelf life remaining and local burn rate $< 0.5\text{ units/day}$, the system initiates the **Inter-Bank Clearinghouse Protocol**.
* **Target Matching:** The algorithm searches for connected tertiary hospitals, oncology daycares, or trauma units within a 15 km radius with active demand.
* **Execution:** Generates an electronic transfer manifest (`MANIFEST-YYYY-XX-####`) and assigns a calibrated smart IoT cold box.

### 3.2 The Zero-Spam Geofenced SOS Protocol
Unlike public social media requests that expose donor numbers and trigger thousands of irrelevant calls:
1. Hospital or patient attendant raises an emergency request (e.g. 2 units of O-negative PRBC for postpartum hemorrhage).
2. The engine first queries **all nearby blood storage centers** for existing tested inventory.
3. If no physical units exist in the radius, the engine queries the **Verified Donor Registry** with spatial filters:
   $$\text{Filter: } \text{BloodGroup} = \text{TargetGroup} \land \text{Distance} \le 7\text{ km} \land \text{LastDonated} \ge 90\text{ days}$$
4. The system pings **only 5 to 10 verified donors via WhatsApp Cloud API / HemaGrid Push**.
5. The moment 2 donors confirm the slot, the alert immediately closes for all other users.

### 3.3 Cold-Chain Telemetry Quality Assurance
* **Sensors:** Cellular / BLE IoT temperature probes inside insulated transport boxes.
* **Thresholds:**
  * PRBC: $2.0^\circ\text{C}$ to $6.0^\circ\text{C}$
  * Platelets: $20.0^\circ\text{C}$ to $24.0^\circ\text{C}$ (with continuous mechanical agitation)
  * FFP: $\le -30^\circ\text{C}$
* **Breach Protocol:** If temperature deviates for $> 15$ continuous minutes, the receiving hospital's terminal flags the bag for mandatory quarantine and reassessment.

---

## 4. Regulatory & Clinical Compliance (India)

* **Drugs & Cosmetics Act, 1940 & Drugs and Cosmetics Rules, 1945 (Part XII-B & Schedule F):**
  * Strict adherence to collection, testing, processing, storage, and distribution norms.
  * Prohibition of remunerated (paid) blood donation.
* **National Blood Transfusion Council (NBTC) Guidelines:**
  * Mandatory screening for Transfusion-Transmissible Infections (TTI): HIV 1 & 2, Hepatitis B (HBsAg), Hepatitis C (HCV), Syphilis (VDRL), and Malaria.
  * Nucleic Acid Testing (NAT) integration for window-period pathogen reduction.
* **Digital Personal Data Protection (DPDP) Act, 2023:**
  * End-to-end encryption of donor personal phone numbers and medical history.
  * Explicit opt-in consent for emergency alerts.

---

## 5. Technology Stack

* **Monorepo:** npm workspaces with unified script runners.
* **Backend:** Node.js, Express, REST APIs, JSON data layer with simulated e-RaktKosh gateway.
* **Frontends:** Vanilla JS with Tailwind CSS, FontAwesome 6, and responsive modular components.
* **Contract Definitions:** TypeScript shared models (`@hemagrid/shared-types`).
