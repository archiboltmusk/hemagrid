const express = require('express');
const cors = require('cors');
let {
  hospitals,
  inventory,
  transfers,
  telemetry,
  sosRequests,
  donors,
  camps
} = require('./mockData');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Clinical compatibility
const CAN_RECEIVE_PRBC = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'BOMBAY_PHENOTYPE': ['BOMBAY_PHENOTYPE']
};

const STATUTORY_MAX_PRICING = {
  'WHOLE_BLOOD': 1450,
  'PRBC': 1450,
  'PLATELETS': 400,
  'FFP': 400,
  'CRYOPRECIPITATE': 250
};

// 1. Bedside Double-Scan Tool (Mobile Nurse Verification)
app.post('/api/bedside/double-scan', (req, res) => {
  const { wristbandBarcode, patientName, patientBloodGroup, bagBarcode, nurseId } = req.body;
  const bag = inventory.find(i => i.bagBarcode === bagBarcode);
  if (!bag) {
    return res.status(404).json({ isSafe: false, error: 'CRITICAL WARNING: Blood bag barcode not found in National Registry. Do not transfuse!' });
  }
  if (bag.status === 'QUARANTINE_TTI_PENDING' || (bag.ttiProfile && !bag.ttiProfile.allTestsPassed)) {
    return res.status(403).json({ isSafe: false, error: 'SAFETY LOCK: This bag has not passed mandatory infection testing for HIV and Hepatitis.' });
  }
  const allowed = CAN_RECEIVE_PRBC[patientBloodGroup] || [];
  if (!allowed.includes(bag.bloodGroup)) {
    return res.status(400).json({ isSafe: false, error: `FATAL INCOMPATIBILITY: Patient is ${patientBloodGroup}, but bag is ${bag.bloodGroup}. Transfusion blocked!` });
  }
  res.json({
    isSafe: true,
    patientName,
    patientBloodGroup,
    bagBarcode,
    bagBloodGroup: bag.bloodGroup,
    verifiedByNurseId: nurseId || 'NURSE-PRIYA-102',
    timestamp: new Date().toISOString(),
    message: `SAFE TO TRANSFUSE: ${bag.bloodGroup} red cells safely match ${patientBloodGroup} patient.`
  });
});

// 2. Thalassemia & Chronic Recurring Transfusion Care (Adopted & Upgraded from RaktKhoj)
app.get('/api/thalassemia/schedule/:patientId', (req, res) => {
  res.json({
    success: true,
    patientId: req.params.patientId || "THAL-IND-8821",
    patientName: "Aarav Sharma (Age 7)",
    diagnosis: "Thalassemia Major",
    transfusionCycleDays: 21,
    lastTransfusionDate: "2026-10-25",
    nextScheduledDate: "2026-11-15",
    daysRemaining: 4,
    requiredComponent: "Leukodepleted PRBC (B+)",
    dedicatedDonorCircle: [
      { donorName: "Vikram Malhotra", maskedPhone: "+91 98*** **412", bloodGroup: "B+", confirmedSlot: "15 Nov 10:00 AM" },
      { donorName: "Ananya Sen", maskedPhone: "+91 97*** **991", bloodGroup: "B+", standbySlot: "15 Nov 11:30 AM" }
    ],
    allocatedCenter: "AIIMS Daycare Thalassemia Center (Ward 3B)",
    message: "Zero parent hunting: 2 pre-verified donors calendarized for Aarav's upcoming transfusion cycle."
  });
});

// 3. Searchable Live Blood Bank Directory (Upgraded from RaktKhoj)
app.get('/api/directory/search', (req, res) => {
  const { query, bloodGroup, city = 'New Delhi' } = req.query;

  const directory = [
    {
      id: "HOSP-01",
      name: "AIIMS Central Blood Bank (Mother Hub)",
      type: "Government Autonomous / Apex Hub",
      address: "Ansari Nagar, New Delhi - 110029",
      distanceKm: 2.4,
      phone: "+91-11-26588500",
      emergencyContact: "+91-11-26594242",
      isOpen24x7: true,
      hasComponentSeparation: true,
      hasNATTesting: true,
      availableStock: { "O+": 24, "O-": 3, "A+": 18, "B+": 22, "AB+": 8, "PLATELETS": 14 }
    },
    {
      id: "HOSP-02",
      name: "Safdarjung Hospital Regional Blood Centre",
      type: "Government Medical College",
      address: "Ring Road, Opposite AIIMS, New Delhi - 110029",
      distanceKm: 3.1,
      phone: "+91-11-26165060",
      emergencyContact: "+91-11-26168336",
      isOpen24x7: true,
      hasComponentSeparation: true,
      hasNATTesting: true,
      availableStock: { "O+": 19, "O-": 2, "A+": 12, "B+": 26, "AB+": 5, "PLATELETS": 9 }
    },
    {
      id: "HOSP-03",
      name: "Indian Red Cross Society (IRCS) National Blood Bank",
      type: "Charitable Trust / Humanitarian",
      address: "1 Red Cross Road, New Delhi - 110001",
      distanceKm: 5.8,
      phone: "+91-11-23716441",
      emergencyContact: "+91-11-23716442",
      isOpen24x7: true,
      hasComponentSeparation: true,
      hasNATTesting: true,
      availableStock: { "O+": 35, "O-": 4, "A+": 28, "B+": 40, "AB+": 11, "PLATELETS": 18 }
    },
    {
      id: "HOSP-04",
      name: "Mehrauli Community Health Centre (Spoke)",
      type: "Government Sub-District Storage Center",
      address: "Kalka Das Marg, Mehrauli, New Delhi - 110030",
      distanceKm: 7.2,
      phone: "+91-11-26642130",
      emergencyContact: "+91-11-26642131",
      isOpen24x7: true,
      hasComponentSeparation: false,
      hasNATTesting: false,
      availableStock: { "O+": 4, "O-": 1, "A+": 3, "B+": 5, "AB+": 1, "PLATELETS": 0 }
    }
  ];

  res.json({ success: true, count: directory.length, city, data: directory });
});

// 4. Patient Blood Management
app.post('/api/pbm/calculate', (req, res) => {
  const { patientName, currentHemoglobinGdl, daysUntilSurgery } = req.body;
  const currentHb = Number(currentHemoglobinGdl) || 10.2;
  const days = Number(daysUntilSurgery) || 28;
  const unitsSaved = currentHb < 11.0 ? 3 : (currentHb < 13.0 ? 2 : 1);
  res.json({
    success: true,
    patientName,
    currentHb,
    targetHb: 14.0,
    estimatedUnitsSaved: unitsSaved,
    avoidanceRate: `${unitsSaved * 33}% lower allogeneic blood need`,
    recommendations: [
      "Infuse IV Ferric Carboxymaltose 1,000 mg before Day -14",
      "Plan intra-operative autologous cell salvage recovery",
      "Maintain single-unit restrictive transfusion strategy post-op"
    ]
  });
});

// 5. NITI Aayog State Rankings
app.get('/api/niti/state-rankings', (req, res) => {
  const stateRankings = [
    { rank: 1, stateName: 'Tamil Nadu', safetyScore: 96.4, voluntaryRatio: 98.2, pphMinutes: 14, zeroDiscardRate: 99.1, grade: 'LEADER' },
    { rank: 2, stateName: 'Maharashtra', safetyScore: 94.8, voluntaryRatio: 96.5, pphMinutes: 16, zeroDiscardRate: 98.4, grade: 'LEADER' },
    { rank: 3, stateName: 'Karnataka', safetyScore: 92.1, voluntaryRatio: 93.4, pphMinutes: 18, zeroDiscardRate: 97.2, grade: 'LEADER' },
    { rank: 4, stateName: 'Delhi-NCR', safetyScore: 90.5, voluntaryRatio: 91.8, pphMinutes: 17, zeroDiscardRate: 96.8, grade: 'ACHIEVER' },
    { rank: 5, stateName: 'Gujarat', safetyScore: 89.2, voluntaryRatio: 90.1, pphMinutes: 19, zeroDiscardRate: 95.9, grade: 'ACHIEVER' },
    { rank: 6, stateName: 'Uttar Pradesh', safetyScore: 78.4, voluntaryRatio: 74.2, pphMinutes: 28, zeroDiscardRate: 88.3, grade: 'ASPIRANT' }
  ];
  res.json({ success: true, count: stateRankings.length, data: stateRankings });
});

// 6. WhatsApp Bot Simulation
app.post('/api/whatsapp/simulate-reply', (req, res) => {
  const { incomingMessage, donorName = 'Rahul' } = req.body;
  let replyText = '';
  const msg = (incomingMessage || '').toLowerCase();
  if (msg.includes('yes') || msg.includes('confirm')) {
    replyText = `Thank you, ${donorName}! Your 15-minute VIP slot is reserved tomorrow at 10:00 AM at AIIMS Blood Bank Gate 3. Express QR Pass generated. Your HemaShield family protection will be renewed for 12 months!`;
  } else if (msg.includes('need') || msg.includes('blood') || msg.includes('urgent')) {
    replyText = `Emergency Beacon Active: Found 14 units at AIIMS Blood Bank (2.4 km) & 9 units at Safdarjung (3.1 km). Reply 'HOLD' with your patient name to lock 2 units for 90 minutes, or call 104 now.`;
  } else {
    replyText = `Hi ${donorName}, AIIMS has an emergency low buffer of O-. Reply 'YES' to confirm your 10:00 AM 15-min slot tomorrow, or reply 'NEED [BLOODGROUP]' to find units.`;
  }
  res.json({ success: true, sender: 'HemaGrid Central Bot (+91-11-2616-HEMA)', replyText });
});

// 7. 90-Minute Digital Hold
app.post('/api/reserve/hold', (req, res) => {
  const { hospitalId = 'HOSP-01', bloodGroup = 'O-', component = 'PRBC', units = 1, patientName = 'Emergency Patient', requisitionNo = 'REQ-8821' } = req.body;
  const reservationId = `HOLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 90 * 60 * 1000).toISOString();
  
  res.json({
    success: true,
    reservationId,
    hospitalId,
    bloodGroup,
    component,
    unitsReserved: units,
    patientName,
    requisitionNo,
    status: 'ACTIVE_HELD',
    expiresAt,
    holdDurationMinutes: 90,
    counterInstructions: `Present reservation ID ${reservationId} at hospital blood bank emergency counter. Units are digitally locked and cannot be reallocated during this window.`
  });
});

// 8. Emergency Cold-Chain Courier Dispatch
app.post('/api/courier/dispatch', (req, res) => {
  const { pickupHospitalId = 'HOSP-01', destinationHospital = 'Apollo Indraprastha', ward = 'ICU-3', units = 2, bloodGroup = 'O-' } = req.body;
  const dispatchId = `DISPATCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  
  res.json({
    success: true,
    dispatchId,
    courierPartner: 'HemaGrid Cold-Box Rapid Fleet',
    riderName: 'Vikram Singh',
    riderPhone: '+91-98112-44321',
    currentTempCelsius: 3.6,
    safeTempRange: '2.0°C - 6.0°C',
    coldChainStatus: 'STABLE_COMPLIANT',
    estimatedArrivalMinutes: 24,
    liveTrackingUrl: `https://hemagrid.live/track/${dispatchId}`,
    message: 'Cold-chain certified thermal carrier dispatched. Live temperature sensor active.'
  });
});

// 9. AI Blood Requisition Slip OCR Reader
app.post('/api/ocr/requisition', (req, res) => {
  const { imageUrl, sampleType = 'Obstetric Emergency' } = req.body;
  
  // Simulated high-fidelity OCR model output
  const extractedData = {
    patientName: 'Sunita Sharma',
    ageGender: '34 / Female',
    hospital: 'Safdarjung Hospital',
    wardBed: 'Maternity High Dependency Unit (HDU), Bed 12',
    bloodGroup: 'B Positive (B+)',
    componentRequired: 'PRBC (Packed Red Blood Cells) + RDP (Random Donor Platelets)',
    unitsRequested: '2 Units PRBC, 4 Units Platelets',
    clinicalIndication: 'Severe Postpartum Hemorrhage (PPH)',
    preTransfusionHb: '6.2 g/dL',
    doctorName: 'Dr. Neha Verma, MD (Obs & Gynae)',
    doctorRegNo: 'DMC-44912',
    crossmatchSampleStatus: 'EDTA Vial Received by Lab',
    recommendedAction: 'Immediate release of 2 Units O+ or B+ uncrossmatched/crossmatched under emergency code'
  };
  
  res.json({
    success: true,
    confidenceScore: 0.984,
    extractedData,
    suggestedMatches: [
      { bloodBank: 'Safdarjung Blood Bank', distanceKm: 0.1, availableUnits: 9, readyInMinutes: 15 },
      { bloodBank: 'AIIMS Central Blood Bank', distanceKm: 0.8, availableUnits: 14, readyInMinutes: 20 }
    ]
  });
});

// 10. Statutory NBTC Price Ceiling Calculator
app.get('/api/price-ceiling', (req, res) => {
  const { component = 'PRBC', testType = 'NAT', facility = 'GOVT', category = 'GENERAL' } = req.query;
  
  if (category === 'THALASSEMIA' || category === 'AYUSHMAN' || category === 'BPL') {
    return res.json({
      success: true,
      component,
      statutoryPriceInr: 0,
      legalStatus: '100% FREE AS PER GOVT OF INDIA (MoHFW) DIRECTIVE',
      gazetteCitation: 'National Blood Transfusion Council Guidelines 2022, Sec 4.1',
      warning: 'Any fee charged to Thalassemia or Ayushman cardholders is an illegal punishable offense under Indian law.'
    });
  }

  let price = 1450;
  if (component === 'PRBC' && facility === 'PRIVATE') price = 1550;
  if (component === 'PLATELETS') price = 400;
  if (component === 'FFP') price = 400;
  if (component === 'SDAP') price = 11000;
  if (testType === 'NAT' && component === 'PRBC') price += 1000;

  res.json({
    success: true,
    component,
    facility,
    testType,
    category,
    statutoryPriceInr: price,
    legalStatus: 'CAPPED BY NATIONAL BLOOD TRANSFUSION COUNCIL',
    overchargeReportingHelpline: '1800-11-2026',
    gazetteCitation: 'Drug Controller General of India (DCGI) Order F.No. 12-01/14-DC'
  });
});

// 11. Donor Impact & Life Saved Loop
app.post('/api/donor/life-saved', (req, res) => {
  const { donorId = 'D-10928', unitBarcode = 'DL-8821' } = req.body;
  
  res.json({
    success: true,
    donorId,
    unitBarcode,
    transfusionStatus: 'SUCCESSFULLY_TRANSFUSED',
    transfusionTimestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    recipientInfo: {
      demographic: '28-year-old mother during delivery',
      hospital: 'Safdarjung Hospital Obstetric OT',
      outcome: 'Hemoglobin stabilized from 6.1 to 10.4 g/dL. Mother and newborn safe.'
    },
    messageToDonor: 'Your blood saved a young mother and her baby today. You are a true silent hero.'
  });
});

// Inventory, Telemetry, and Root
app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', service: 'HemaGrid Sovereign Blood DPI', version: '4.2.0' });
});

app.get('/api/inventory', (req, res) => {
  res.json({ success: true, count: inventory.length, data: inventory });
});

app.get('/api/telemetry/:id', (req, res) => {
  const device = telemetry[req.params.id] || { currentTempCelsius: 3.8, isBreached: false };
  res.json({ success: true, data: device });
});

app.listen(PORT, () => {
  console.log(`[HemaGrid] Enhanced server running on port ${PORT}`);
});
