/**
 * HemaGrid Core Domain Types & Security Contracts
 * Hardened for Government of India (MoHFW, NBTC, Drugs & Cosmetics Act 1940 & Rules 1945)
 */

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'BOMBAY_PHENOTYPE';

export type ComponentType =
  | 'WHOLE_BLOOD'
  | 'PRBC'             // Packed Red Blood Cells (35-42 days at 2-6°C)
  | 'PLATELETS'        // Platelet Concentrates (5 days at 20-24°C with constant agitation)
  | 'FFP'              // Fresh Frozen Plasma (1 year at <= -30°C)
  | 'CRYOPRECIPITATE'; // Cryoprecipitate (Factor VIII / Fibrinogen)

export type InventoryStatus =
  | 'QUARANTINE_TTI_PENDING'  // Mandatory serological testing in progress; LOCKED from issue
  | 'AVAILABLE'               // 100% negative on 5 TTIs + NAT cleared; ready for crossmatch
  | 'RESERVED_CROSSMATCHED'   // Crossmatched for specific recipient; held in secure reserve
  | 'IN_TRANSIT_COLDCHAIN'    // In IoT monitored transit box
  | 'COLDCHAIN_BREACH_LOCKED' // Thermal violation (>6°C or <2°C for PRBC); locked for biohazard review
  | 'ISSUED_TRANSFUSED'       // Completed bedside transfusion
  | 'DISCARDED_BIOHAZARD'     // Reactive TTI or expired; routed to incinerator
  | 'TRANSFERRED_OUT';        // Sent to another certified center

/**
 * Mandatory 5 Transfusion-Transmissible Infections (TTI) required under Schedule F
 */
export interface TTITestingProfile {
  hiv1And2: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING';
  hepatitisB: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING'; // HBsAg
  hepatitisC: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING'; // HCV Antibody
  syphilisVdrl: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING';
  malariaParasite: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  idNatStatus: 'NEGATIVE' | 'POSITIVE' | 'NOT_PERFORMED'; // Individual Donor NAT
  clearedByLabOfficerId: string;
  clearedTimestamp?: string;
  allTestsPassed: boolean;
}

export interface InventoryItem {
  id: string;
  bagBarcode: string;
  bloodBankId: string;
  bloodBankName: string;
  bloodGroup: BloodGroup;
  component: ComponentType;
  volumeMl: number;
  collectionDate: string; // ISO 8601
  expiryDate: string;     // ISO 8601
  status: InventoryStatus;
  ttiProfile: TTITestingProfile;
  storageLocation: string; // e.g. "ColdRoom-A / Shelf-02 / Bin-4"
  temperatureRequirement: {
    minCelsius: number;
    maxCelsius: number;
  };
  reservedForPatientId?: string;
  reservedForPatientAbnormalAntibodies?: boolean;
  crossmatchedByOfficerId?: string;
  crossmatchTimestamp?: string;
  auditTrail: AuditLogEntry[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: 'BLOOD_BANK_OFFICER' | 'LAB_TECHNICIAN' | 'ATTENDING_PHYSICIAN' | 'DRUG_INSPECTOR';
  action: 'COLLECTED' | 'TESTED_TTI' | 'QUARANTINE_OVERRIDE_REJECTED' | 'CROSSMATCH_PASSED' | 'COLDCHAIN_LOCKED' | 'ISSUED' | 'DISCARDED';
  digitalSignatureHash: string; // SHA-256 integrity seal
  remarks?: string;
}

export type EmergencyUrgency =
  | 'STAT_IMMEDIATE_PPH_TRAUMA' // < 20 mins (Postpartum hemorrhage, arterial trauma)
  | 'URGENT_SURGERY_2_HOURS'    // < 2 hours (Emergency laparotomy, ICU hemorrhage)
  | 'PLANNED_THALASSEMIA_DAY'   // Scheduled chronic transfusion
  | 'ELECTIVE_SURGERY';

export interface BloodRequest {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'OTHER';
  hospitalId: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  component: ComponentType;
  unitsRequested: number;
  unitsAllocated: number;
  urgency: EmergencyUrgency;
  diagnosis: string;
  isReplacementCoerced: false; // Anti-coercion flag required by NBTC
  status: 'PENDING' | 'MATCHING' | 'DISPATCHED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
}

export interface InterHospitalTransfer {
  id: string;
  transferManifestNumber: string;
  sourceHospitalId: string;
  sourceHospitalName: string;
  targetHospitalId: string;
  targetHospitalName: string;
  items: Array<{
    bagBarcode: string;
    bloodGroup: BloodGroup;
    component: ComponentType;
    expiryDate: string;
  }>;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED_VERIFIED' | 'LOCKED_BREACH_REJECTED';
  telemetryDeviceId: string;
  thermalBreached: boolean;
  initiatedAt: string;
  receivedAt?: string;
}

export interface ColdChainTelemetry {
  deviceId: string;
  transferId: string;
  currentTempCelsius: number;
  minTempCelsius: number;
  maxTempCelsius: number;
  isBreached: boolean;
  breachDurationMinutes: number;
  agitationActive: boolean; // Vital for Platelets
  batteryPercentage: number;
  location: {
    latitude: number;
    longitude: number;
  };
  lastPingTimestamp: string;
}

/**
 * Universal ABO & Rh Red Cell Compatibility Matrix (Schedule F Standards)
 */
export const PRBC_COMPATIBILITY_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'BOMBAY_PHENOTYPE': ['BOMBAY_PHENOTYPE'] // Bombay can ONLY receive Bombay
};

/**
 * Anti-Coercion Compliance Metrics for Hospitals
 */
export interface HospitalComplianceAudit {
  hospitalId: string;
  hospitalName: string;
  totalTransfusionsLast30Days: number;
  replacementDonationsAttempted: number;
  voluntaryDonationsReceived: number;
  replacementCoercionRatio: number; // Must be < 0.05
  status: 'GOVERNMENT_CERTIFIED_COMPLIANT' | 'WARNING_ISSUED' | 'DRUG_CONTROLLER_SCRUTINY';
}
