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
    return res.status(404).json({
      isSafe: false,
      error: 'CRITICAL WARNING: Blood bag barcode not found in National Registry. Do not transfuse!'
    });
  }

  // Check 1: Infection clearance
  if (bag.status === 'QUARANTINE_TTI_PENDING' || (bag.ttiProfile && !bag.ttiProfile.allTestsPassed)) {
    return res.status(403).json({
      isSafe: false,
      error: 'SAFETY LOCK: This bag has not passed mandatory infection testing for HIV and Hepatitis.'
    });
  }

  // Check 2: Compatibility
  const allowed = CAN_RECEIVE_PRBC[patientBloodGroup] || [];
  if (!allowed.includes(bag.bloodGroup)) {
    return res.status(400).json({
      isSafe: false,
      error: `FATAL INCOMPATIBILITY: Patient is ${patientBloodGroup}, but bag is ${bag.bloodGroup}. Transfusion blocked!`
    });
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

// 2. Patient Blood Management (PBM) Surgery Calculator
app.post('/api/pbm/calculate', (req, res) => {
  const { patientName, currentHemoglobinGdl, daysUntilSurgery, surgeryType = 'Elective Orthopedic / Cardiac' } = req.body;

  const currentHb = Number(currentHemoglobinGdl) || 10.5;
  const days = Number(daysUntilSurgery) || 28;

  let unitsSaved = 0;
  let recommendations = [];

  if (currentHb < 13.0) {
    unitsSaved = currentHb < 11.0 ? 3 : 2;
    recommendations.push('Immediate Intravenous (IV) Ferric Carboxymaltose 1,000 mg infusion');
    recommendations.push('Vitamin B12 and Folate optimization');
    recommendations.push('Plan intra-operative cell salvage (autologous blood recovery) during surgery');
    recommendations.push('Single-unit restrictive transfusion strategy post-op');
  } else {
    unitsSaved = 1;
    recommendations.push('Patient hemoglobin is optimal. Maintain single-unit transfusion threshold.');
  }

  res.json({
    success: true,
    patientName,
    currentHb,
    targetHb: 14.0,
    estimatedUnitsSaved: unitsSaved,
    avoidanceRate: `${unitsSaved * 33}% lower allogeneic blood need`,
    recommendations
  });
});

// 3. NITI Aayog State Blood Rankings
app.get('/api/niti/state-rankings', (req, res) => {
  const stateRankings = [
    { rank: 1, stateName: 'Tamil Nadu', safetyScore: 96.4, voluntaryRatio: 98.2, pphMinutes: 14, zeroDiscardRate: 99.1, grade: 'LEADER' },
    { rank: 2, stateName: 'Maharashtra', safetyScore: 94.8, voluntaryRatio: 96.5, pphMinutes: 16, zeroDiscardRate: 98.4, grade: 'LEADER' },
    { rank: 3, stateName: 'Karnataka', safetyScore: 92.1, voluntaryRatio: 93.4, pphMinutes: 18, zeroDiscardRate: 97.2, grade: 'LEADER' },
    { rank: 4, stateName: 'Delhi-NCR', safetyScore: 90.5, voluntaryRatio: 91.8, pphMinutes: 17, zeroDiscardRate: 96.8, grade: 'ACHIEVER' },
    { rank: 5, stateName: 'Gujarat', safetyScore: 89.2, voluntaryRatio: 90.1, pphMinutes: 19, zeroDiscardRate: 95.9, grade: 'ACHIEVER' },
    { rank: 6, stateName: 'Uttar Pradesh', safetyScore: 78.4, voluntaryRatio: 74.2, pphMinutes: 28, zeroDiscardRate: 88.3, grade: 'ASPIRANT' },
    { rank: 7, stateName: 'Bihar', safetyScore: 72.1, voluntaryRatio: 68.5, pphMinutes: 34, zeroDiscardRate: 84.6, grade: 'ASPIRANT' },
    { rank: 8, stateName: 'Assam', safetyScore: 74.6, voluntaryRatio: 71.0, pphMinutes: 32, zeroDiscardRate: 86.1, grade: 'ASPIRANT' }
  ];
  res.json({ success: true, count: stateRankings.length, data: stateRankings });
});

// 4. Ayushman Bharat (ABHA) One-Click Linking
app.get('/api/abha/link/:donorId', (req, res) => {
  const donor = donors.find(d => d.id === req.params.donorId || d.nationalDonorId === req.params.donorId);
  res.json({
    success: true,
    linked: true,
    abhaId: '91-8273-9182-3918',
    abhaAddress: 'arjun.sharma@abdm',
    nationalHemaPassId: donor ? donor.nationalDonorId : 'HG-IND-2026-8812',
    message: 'Ayushman Bharat Digital Health Account verified with Aadhaar. HemaShield family protection active across all PM-JAY empanelled hospitals.'
  });
});

// 5. Rare Blood Phenotype Geofenced Locator (Bombay Blood & Rh-Null)
app.get('/api/rare-registry', (req, res) => {
  res.json({
    success: true,
    nationalRareTypesFound: [
      { bloodGroup: 'BOMBAY_PHENOTYPE', registeredDonorsIndia: 412, activeInDelhiNCR: 14, currentUnitsInFrozenReserve: 4 },
      { bloodGroup: 'RH_NULL', registeredDonorsIndia: 9, activeInDelhiNCR: 1, currentUnitsInFrozenReserve: 1 },
      { bloodGroup: 'AB_NEGATIVE', registeredDonorsIndia: 18400, activeInDelhiNCR: 890, currentUnitsInFrozenReserve: 62 }
    ]
  });
});

// 6. WhatsApp Bot Simulation Webhook
app.post('/api/whatsapp/simulate-reply', (req, res) => {
  const { incomingMessage, donorName = 'Rahul' } = req.body;

  let replyText = '';
  if (incomingMessage.toLowerCase().includes('yes') || incomingMessage.toLowerCase().includes('confirm')) {
    replyText = `Thank you, ${donorName}! Your 15-minute VIP slot is reserved tomorrow at 10:00 AM at AIIMS Blood Bank Gate 3. Express QR Pass generated. Your HemaShield family protection will be renewed for 12 months!`;
  } else if (incomingMessage.toLowerCase().includes('sos')) {
    replyText = `Emergency Protocol Activated. Please send patient hospital name and blood type. HemaGrid will search 15 km network immediately.`;
  } else {
    replyText = `Hi ${donorName}, you are eligible to donate. AIIMS has a low safe stock of O-. Reply 'YES' to confirm a 10:00 AM 15-min slot tomorrow.`;
  }

  res.json({ success: true, sender: 'HemaGrid Central Bot (+91-11-2616-HEMA)', replyText });
});

// Issue, Inventory, Telemetry, and Camps
app.post('/api/inventory/issue', (req, res) => {
  const { bagBarcode, patientBloodGroup, hospitalId = 'HOSP-01' } = req.body;
  const bag = inventory.find(i => i.bagBarcode === bagBarcode);
  if (!bag) return res.status(404).json({ success: false, error: 'Bag not found' });
  bag.status = 'ISSUED_TRANSFUSED';
  res.json({ success: true, message: `Bag ${bagBarcode} issued.`, data: bag });
});

app.get('/api/inventory', (req, res) => {
  res.json({ success: true, count: inventory.length, data: inventory });
});

app.get('/api/telemetry/:id', (req, res) => {
  const device = telemetry[req.params.id];
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, data: device });
});

app.listen(PORT, () => {
  console.log(`[HemaGrid] Central API with all sovereign modules running on port ${PORT}`);
});
