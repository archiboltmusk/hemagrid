/**
 * HemaGrid Core Domain Types & Data Contracts
 * Compliant with Drugs & Cosmetics Act (India) and National Blood Transfusion Council (NBTC) norms.
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
  | 'PRBC'             // Packed Red Blood Cells (35-42 days shelf life at 2-6°C)
  | 'PLATELETS'        // Random/Single Donor Platelets (5 days shelf life at 20-24°C with agitation)
  | 'FFP'              // Fresh Frozen Plasma (1 year shelf life at -30°C or colder)
  | 'CRYOPRECIPITATE'; // Cryoprecipitated Antihemophilic Factor

export type InventoryStatus =
  | 'QUARANTINE'       // Under mandatory serological testing (NAT/ELISA)
  | 'AVAILABLE'        // Tested, labeled, ready for issue
  | 'RESERVED'         // Cross-matched for a specific recipient
  | 'IN_TRANSIT'       // In cold-chain transfer to another facility
  | 'ISSUED'           // Transfused to patient
  | 'EXPIRED'          // Shelf life exceeded (marked for biohazard disposal)
  | 'DISCARDED';       // Defective/reactive

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
  natTested: boolean;
  elisaTested: boolean;
  storageLocation: string; // e.g. "Refrigerator-A / Shelf-2"
  temperatureRequirement: {
    minCelsius: number;
    maxCelsius: number;
  };
  reservedForPatientId?: string;
  createdAt: string;
}

export type EmergencyUrgency =
  | 'STAT_IMMEDIATE'      // < 30 mins (Trauma, Massive Postpartum Hemorrhage)
  | 'URGENT_2_HOURS'      // < 2 hours (Emergency surgery, ICU critical)
  | 'PLANNED_SAME_DAY'    // Within 12-24 hours (Scheduled elective surgery, Thalassemia cycle)
  | 'SCHEDULED_DATE';

export interface BloodRequest {
  id: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F' | 'OTHER';
  hospitalId: string;
  hospitalName: string;
  hospitalLocation: {
    address: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  bloodGroup: BloodGroup;
  component: ComponentType;
  unitsRequested: number;
  unitsAllocated: number;
  urgency: EmergencyUrgency;
  diagnosis: string;
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
  status: 'PENDING_APPROVAL' | 'PACKED' | 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED';
  telemetryDeviceId?: string;
  estimatedTransitMinutes: number;
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
  batteryPercentage: number;
  location: {
    latitude: number;
    longitude: number;
  };
  lastPingTimestamp: string;
}

export interface DonorProfile {
  id: string;
  nationalDonorId: string; // e.g., HG-IND-9021-392
  fullName: string;
  phone: string;
  email?: string;
  bloodGroup: BloodGroup;
  dob: string;
  gender: 'M' | 'F' | 'OTHER';
  lastDonationDate?: string;
  nextEligibleDate: string;
  totalDonations: number;
  isEligibleNow: boolean;
  city: string;
  pincode: string;
  preferredDonationCenterId?: string;
  notificationsEnabled: boolean;
  badgeLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'CENTURION';
}

export interface DonationCamp {
  id: string;
  title: string;
  organizerName: string; // Corporate, College, NGO
  partnerHospitalId: string;
  venueAddress: string;
  city: string;
  date: string;
  startTime: string;
  endTime: string;
  targetUnits: number;
  registeredDonorsCount: number;
  collectedUnitsCount: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}
