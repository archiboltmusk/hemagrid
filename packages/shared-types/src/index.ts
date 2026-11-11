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

export interface TTITestingProfile {
  hiv1And2: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING';
  hepatitisB: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING';
  hepatitisC: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING';
  syphilisVdrl: 'NON_REACTIVE' | 'REACTIVE' | 'PENDING';
  malariaParasite: 'NEGATIVE' | 'POSITIVE' | 'PENDING';
  idNatStatus: 'NEGATIVE' | 'POSITIVE' | 'NOT_PERFORMED';
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
  collectionDate: string;
  expiryDate: string;
  status: InventoryStatus;
  ttiProfile: TTITestingProfile;
  storageLocation: string;
  temperatureRequirement: {
    minCelsius: number;
    maxCelsius: number;
  };
  auditTrail: AuditLogEntry[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: 'BLOOD_BANK_OFFICER' | 'LAB_TECHNICIAN' | 'ATTENDING_PHYSICIAN' | 'DRUG_INSPECTOR';
  action: string;
  digitalSignatureHash: string;
  remarks?: string;
}

// Ayushman Bharat Digital Health Account (ABHA) Integration
export interface ABHAProfile {
  abhaId: string; // 14-digit ABHA Number (e.g. 91-8273-9182-3918)
  abhaAddress: string; // e.g. arjun.sharma@abdm
  fullName: string;
  gender: 'M' | 'F' | 'OTHER';
  dob: string;
  linkedHemaPassId: string;
  verifiedWithAadhaar: boolean;
}

// NITI Aayog State Blood Index Ranking
export interface StateBloodIndex {
  stateCode: string;
  stateName: string;
  safetyScore: number; // 0 - 100
  voluntaryDonationRatio: number; // Percentage
  maternalPPHResponseMinutes: number;
  zeroDiscardCompliance: number; // Percentage
  rank: number;
  grade: 'LEADER' | 'ACHIEVER' | 'ASPIRANT';
}

// Patient Blood Management (PBM) Surgery Assessment
export interface PBMAssessment {
  patientId: string;
  scheduledSurgeryDate: string;
  baselineHemoglobinGdl: number;
  targetHemoglobinGdl: number;
  transfusionAvoidanceScore: number;
  recommendedInterventions: string[];
  estimatedBloodUnitsSaved: number;
}

// Bedside Double-Scan Verification
export interface BedsideScanVerification {
  patientWristbandBarcode: string;
  patientName: string;
  patientBloodGroup: BloodGroup;
  bloodBagBarcode: string;
  bloodBagGroup: BloodGroup;
  isSafeToTransfuse: boolean;
  alertMessage: string;
  verifiedByNurseId: string;
  verificationTimestamp: string;
}
