// Initial mock database state for HemaGrid API
const hospitals = [
  {
    id: "HOSP-01",
    name: "All India Institute of Medical Sciences (AIIMS)",
    city: "New Delhi",
    tier: "Mother Hub / Regional Transfusion Center",
    componentSeparation: true,
    natEnabled: true,
    lat: 28.5672,
    lng: 77.2100,
    phone: "+91-11-26588500"
  },
  {
    id: "HOSP-02",
    name: "Safdarjung Hospital & Blood Bank",
    city: "New Delhi",
    tier: "District Hub",
    componentSeparation: true,
    natEnabled: true,
    lat: 28.5701,
    lng: 77.2065,
    phone: "+91-11-26165060"
  },
  {
    id: "HOSP-03",
    name: "Max Super Speciality Hospital",
    city: "New Delhi",
    tier: "Tertiary Private",
    componentSeparation: true,
    natEnabled: true,
    lat: 28.5284,
    lng: 77.2117,
    phone: "+91-11-26515050"
  },
  {
    id: "HOSP-04",
    name: "Mehrauli Community Health Centre (CHC)",
    city: "New Delhi",
    tier: "Spoke / Blood Storage Center",
    componentSeparation: false,
    natEnabled: false,
    lat: 28.5173,
    lng: 77.1824,
    phone: "+91-11-26642130"
  }
];

const now = new Date();
const addDays = (days) => new Date(now.getTime() + days * 86400000).toISOString();
const subDays = (days) => new Date(now.getTime() - days * 86400000).toISOString();

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
    natTested: true,
    elisaTested: true,
    storageLocation: "ColdRoom-A / Shelf-03",
    temperatureRequirement: { minCelsius: 2, maxCelsius: 6 }
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
    natTested: true,
    elisaTested: true,
    storageLocation: "ColdRoom-A / Shelf-01",
    temperatureRequirement: { minCelsius: 2, maxCelsius: 6 }
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
    expiryDate: addDays(2), // 48 hours left!
    status: "AVAILABLE",
    natTested: true,
    elisaTested: true,
    storageLocation: "Agitator-B1",
    temperatureRequirement: { minCelsius: 20, maxCelsius: 24 }
  },
  {
    id: "BAG-1004",
    bagBarcode: "HG-DEL-2611-04P",
    bloodBankId: "HOSP-03",
    bloodBankName: "Max Super Speciality",
    bloodGroup: "B+",
    component: "PLATELETS",
    volumeMl: 55,
    collectionDate: subDays(4),
    expiryDate: addDays(1), // 24 hours left! Urgent redistribution target!
    status: "AVAILABLE",
    natTested: true,
    elisaTested: true,
    storageLocation: "Agitator-A2",
    temperatureRequirement: { minCelsius: 20, maxCelsius: 24 }
  },
  {
    id: "BAG-1005",
    bagBarcode: "HG-DEL-2611-05F",
    bloodBankId: "HOSP-01",
    bloodBankName: "AIIMS New Delhi",
    bloodGroup: "AB+",
    component: "FFP",
    volumeMl: 220,
    collectionDate: subDays(30),
    expiryDate: addDays(335),
    status: "AVAILABLE",
    natTested: true,
    elisaTested: true,
    storageLocation: "DeepFreeze-C / -40C",
    temperatureRequirement: { minCelsius: -45, maxCelsius: -30 }
  },
  {
    id: "BAG-1006",
    bagBarcode: "HG-DEL-2611-06W",
    bloodBankId: "HOSP-02",
    bloodBankName: "Safdarjung Hospital",
    bloodGroup: "B-",
    component: "PRBC",
    volumeMl: 350,
    collectionDate: subDays(28),
    expiryDate: addDays(7), // 7 days left!
    status: "AVAILABLE",
    natTested: true,
    elisaTested: true,
    storageLocation: "ColdRoom-B / Shelf-04",
    temperatureRequirement: { minCelsius: 2, maxCelsius: 6 }
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
    patientName: "Sunita Verma",
    patientAge: 29,
    patientGender: "F",
    hospitalId: "HOSP-04",
    hospitalName: "Mehrauli CHC",
    bloodGroup: "O-",
    component: "PRBC",
    unitsRequested: 2,
    unitsAllocated: 1,
    urgency: "STAT_IMMEDIATE",
    diagnosis: "Severe Postpartum Hemorrhage (Obstetric Emergency)",
    status: "DISPATCHED",
    createdAt: subDays(0.04)
  }
];

let donors = [
  {
    id: "DONOR-101",
    nationalDonorId: "HG-IND-2026-8812",
    fullName: "Arjun Sharma",
    phone: "+91 98765 43210",
    email: "arjun.sharma@example.com",
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
  },
  {
    id: "DONOR-102",
    nationalDonorId: "HG-IND-2026-3918",
    fullName: "Pooja Reddy",
    phone: "+91 98111 22334",
    email: "pooja.r@example.com",
    bloodGroup: "B+",
    dob: "2001-09-24",
    gender: "F",
    lastDonationDate: subDays(45),
    nextEligibleDate: addDays(75),
    totalDonations: 4,
    isEligibleNow: false,
    city: "New Delhi",
    pincode: "110016",
    badgeLevel: "BRONZE"
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
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    targetUnits: 250,
    registeredDonorsCount: 184,
    collectedUnitsCount: 0,
    status: "UPCOMING"
  },
  {
    id: "CAMP-302",
    title: "CyberCity Corporate Voluntary Drive",
    organizerName: "DLF CyberCity & Rotary Club",
    partnerHospitalId: "HOSP-03",
    venueAddress: "Building 10 Amphitheatre, DLF Phase 2",
    city: "Gurugram",
    date: addDays(7).split("T")[0],
    startTime: "10:00 AM",
    endTime: "06:00 PM",
    targetUnits: 300,
    registeredDonorsCount: 220,
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
