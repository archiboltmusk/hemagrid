// Hardened mock database state with clinical TTI profiles, audit trails, and anti-coercion audits
const now = new Date();
const addDays = (days) => new Date(now.getTime() + days * 86400000).toISOString();
const subDays = (days) => new Date(now.getTime() - days * 86400000).toISOString();

const hospitals = [
  {
    id: "HOSP-01",
    name: "All India Institute of Medical Sciences (AIIMS)",
    city: "New Delhi",
    tier: "Mother Hub / Regional Transfusion Center",
    licenseNumber: "DL-BB-AIIMS-1982-A",
    componentSeparation: true,
    natEnabled: true,
    lat: 28.5672,
    lng: 77.2100,
    phone: "+91-11-26588500",
    complianceAudit: {
      totalTransfusionsLast30Days: 1420,
      replacementDonationsAttempted: 12,
      voluntaryDonationsReceived: 1408,
      replacementCoercionRatio: 0.008, // 0.8% - Fully Compliant
      status: "GOVERNMENT_CERTIFIED_COMPLIANT"
    }
  },
  {
    id: "HOSP-02",
    name: "Safdarjung Hospital & Blood Bank",
    city: "New Delhi",
    tier: "District Hub",
    licenseNumber: "DL-BB-SFD-1994-B",
    componentSeparation: true,
    natEnabled: true,
    lat: 28.5701,
    lng: 77.2065,
    phone: "+91-11-26165060",
    complianceAudit: {
      totalTransfusionsLast30Days: 980,
      replacementDonationsAttempted: 24,
      voluntaryDonationsReceived: 956,
      replacementCoercionRatio: 0.024,
      status: "GOVERNMENT_CERTIFIED_COMPLIANT"
    }
  },
  {
    id: "HOSP-03",
    name: "Max Super Speciality Hospital",
    city: "New Delhi",
    tier: "Tertiary Private",
    licenseNumber: "DL-BB-MAX-2006-P",
    componentSeparation: true,
    natEnabled: true,
    lat: 28.5284,
    lng: 77.2117,
    phone: "+91-11-26515050",
    complianceAudit: {
      totalTransfusionsLast30Days: 610,
      replacementDonationsAttempted: 18,
      voluntaryDonationsReceived: 592,
      replacementCoercionRatio: 0.029,
      status: "GOVERNMENT_CERTIFIED_COMPLIANT"
    }
  },
  {
    id: "HOSP-04",
    name: "Mehrauli Community Health Centre (CHC)",
    city: "New Delhi",
    tier: "Spoke / Blood Storage Center",
    licenseNumber: "DL-BSC-MEH-2015-S",
    componentSeparation: false,
    natEnabled: false,
    lat: 28.5173,
    lng: 77.1824,
    phone: "+91-11-26642130",
    complianceAudit: {
      totalTransfusionsLast30Days: 85,
      replacementDonationsAttempted: 2,
      voluntaryDonationsReceived: 83,
      replacementCoercionRatio: 0.023,
      status: "GOVERNMENT_CERTIFIED_COMPLIANT"
    }
  }
];

let inventory = [
  {
    id: "BAG-1001",
    bagBarcode: "HG-DEL-2611-01A",
    bloodBankId: "HOSP-01",
    bloodBankName: "AIIMS New Delhi",
    bloodGroup: "O+",
    component: "PRBC",
    volumeMl: 350,
    collectionDate: subDays(10),
    expiryDate: addDays(25),
    status: "AVAILABLE",
    ttiProfile: {
      hiv1And2: "NON_REACTIVE",
      hepatitisB: "NON_REACTIVE",
      hepatitisC: "NON_REACTIVE",
      syphilisVdrl: "NON_REACTIVE",
      malariaParasite: "NEGATIVE",
      idNatStatus: "NEGATIVE",
      clearedByLabOfficerId: "OFFICER-DR-VERMA-90",
      clearedTimestamp: subDays(9),
      allTestsPassed: true
    },
    storageLocation: "ColdRoom-A / Shelf-03",
    temperatureRequirement: { minCelsius: 2, maxCelsius: 6 },
    auditTrail: [
      {
        id: "AUD-01",
        timestamp: subDays(10),
        actorUserId: "OFFICER-DR-VERMA-90",
        actorRole: "BLOOD_BANK_OFFICER",
        action: "COLLECTED",
        digitalSignatureHash: "sha256-a94f1b2c4e6d",
        remarks: "Voluntary donor collection at IIT Delhi camp"
      },
      {
        id: "AUD-02",
        timestamp: subDays(9),
        actorUserId: "LAB-TECH-SINGH-41",
        actorRole: "LAB_TECHNICIAN",
        action: "TESTED_TTI",
        digitalSignatureHash: "sha256-e88390bb21ac",
        remarks: "All 5 TTIs negative + ID-NAT negative confirmed"
      }
    ]
  },
  {
    id: "BAG-1002",
    bagBarcode: "HG-DEL-2611-02B",
    bloodBankId: "HOSP-01",
    bloodBankName: "AIIMS New Delhi",
    bloodGroup: "O-",
    component: "PRBC",
    volumeMl: 350,
    collectionDate: subDays(2),
    expiryDate: addDays(33),
    status: "AVAILABLE",
    ttiProfile: {
      hiv1And2: "NON_REACTIVE",
      hepatitisB: "NON_REACTIVE",
      hepatitisC: "NON_REACTIVE",
      syphilisVdrl: "NON_REACTIVE",
      malariaParasite: "NEGATIVE",
      idNatStatus: "NEGATIVE",
      clearedByLabOfficerId: "OFFICER-DR-VERMA-90",
      clearedTimestamp: subDays(1),
      allTestsPassed: true
    },
    storageLocation: "ColdRoom-A / Shelf-01",
    temperatureRequirement: { minCelsius: 2, maxCelsius: 6 },
    auditTrail: []
  },
  {
    id: "BAG-1003",
    bagBarcode: "HG-DEL-2611-03P",
    bloodBankId: "HOSP-02",
    bloodBankName: "Safdarjung Hospital",
    bloodGroup: "A+",
    component: "PLATELETS",
    volumeMl: 50,
    collectionDate: subDays(3),
    expiryDate: addDays(2), // 48h left!
    status: "AVAILABLE",
    ttiProfile: {
      hiv1And2: "NON_REACTIVE",
      hepatitisB: "NON_REACTIVE",
      hepatitisC: "NON_REACTIVE",
      syphilisVdrl: "NON_REACTIVE",
      malariaParasite: "NEGATIVE",
      idNatStatus: "NEGATIVE",
      clearedByLabOfficerId: "OFFICER-DR-KAPOOR-12",
      allTestsPassed: true
    },
    storageLocation: "Agitator-B1",
    temperatureRequirement: { minCelsius: 20, maxCelsius: 24 },
    auditTrail: []
  },
  {
    id: "BAG-1007-QUARANTINE",
    bagBarcode: "HG-DEL-2611-07Q",
    bloodBankId: "HOSP-01",
    bloodBankName: "AIIMS New Delhi",
    bloodGroup: "B+",
    component: "PRBC",
    volumeMl: 350,
    collectionDate: subDays(0.5),
    expiryDate: addDays(34),
    status: "QUARANTINE_TTI_PENDING",
    ttiProfile: {
      hiv1And2: "PENDING",
      hepatitisB: "PENDING",
      hepatitisC: "PENDING",
      syphilisVdrl: "PENDING",
      malariaParasite: "PENDING",
      idNatStatus: "NOT_PERFORMED",
      clearedByLabOfficerId: "PENDING",
      allTestsPassed: false
    },
    storageLocation: "QuarantineHold-01",
    temperatureRequirement: { minCelsius: 2, maxCelsius: 6 },
    auditTrail: [
      {
        id: "AUD-07",
        timestamp: subDays(0.5),
        actorUserId: "SYSTEM_GATEWAY",
        actorRole: "BLOOD_BANK_OFFICER",
        action: "COLLECTED",
        digitalSignatureHash: "sha256-lock-001",
        remarks: "Locked in quarantine until serology & NAT complete"
      }
    ]
  }
];

let transfers = [
  {
    id: "TRF-901",
    transferManifestNumber: "MANIFEST-2026-DL-0091",
    sourceHospitalId: "HOSP-01",
    sourceHospitalName: "AIIMS New Delhi",
    targetHospitalId: "HOSP-04",
    targetHospitalName: "Mehrauli CHC",
    items: [
      {
        bagBarcode: "HG-DEL-2611-01A",
        bloodGroup: "O+",
        component: "PRBC",
        expiryDate: addDays(25)
      }
    ],
    status: "IN_TRANSIT",
    telemetryDeviceId: "IOT-BOX-42",
    thermalBreached: false,
    estimatedTransitMinutes: 28,
    initiatedAt: subDays(0.02)
  }
];

let telemetry = {
  "IOT-BOX-42": {
    deviceId: "IOT-BOX-42",
    transferId: "TRF-901",
    currentTempCelsius: 3.8,
    minTempCelsius: 2.0,
    maxTempCelsius: 6.0,
    isBreached: false,
    breachDurationMinutes: 0,
    agitationActive: true,
    batteryPercentage: 92,
    location: {
      latitude: 28.5412,
      longitude: 77.1950
    },
    lastPingTimestamp: new Date().toISOString(),
    tempHistory: [
      { time: "18:00", temp: 4.1 },
      { time: "18:10", temp: 3.9 },
      { time: "18:20", temp: 3.8 }
    ]
  }
};

let sosRequests = [
  {
    id: "SOS-701",
    patientName: "Sunita V****", // Masked for privacy
    patientAge: 29,
    patientGender: "F",
    hospitalId: "HOSP-04",
    hospitalName: "Mehrauli CHC",
    bloodGroup: "O-",
    component: "PRBC",
    unitsRequested: 2,
    unitsAllocated: 1,
    urgency: "STAT_IMMEDIATE_PPH_TRAUMA",
    diagnosis: "Severe Postpartum Hemorrhage (Obstetric Emergency)",
    isReplacementCoerced: false,
    status: "DISPATCHED",
    createdAt: subDays(0.04)
  }
];

let donors = [
  {
    id: "DONOR-101",
    nationalDonorId: "HG-IND-2026-8812",
    fullName: "Arjun S*****", // Masked in public APIs
    maskedPhone: "+91 98*** **210", // DPDP Act Compliance
    bloodGroup: "O-",
    dob: "1998-04-12",
    gender: "M",
    lastDonationDate: subDays(110),
    nextEligibleDate: subDays(20),
    totalDonations: 8,
    isEligibleNow: true,
    city: "New Delhi",
    pincode: "110029",
    badgeLevel: "SILVER"
  }
];

let camps = [
  {
    id: "CAMP-301",
    title: "IIT Delhi Annual Youth Blood Drive",
    organizerName: "IIT Delhi NSS & Red Cross",
    partnerHospitalId: "HOSP-01",
    venueAddress: "Student Activity Centre, Hauz Khas",
    city: "New Delhi",
    date: addDays(3).split("T")[0],
    targetUnits: 250,
    registeredDonorsCount: 184,
    collectedUnitsCount: 0,
    status: "UPCOMING"
  }
];

module.exports = {
  hospitals,
  inventory,
  transfers,
  telemetry,
  sosRequests,
  donors,
  camps
};
