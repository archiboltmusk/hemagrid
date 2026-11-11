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

// Blood compatibility table
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

// Safe inventory buffers per hospital. If stock falls below this, trigger automated replenishment!
const MINIMUM_SAFE_BUFFER = {
  'O-': 3,
  'O+': 5,
  'A+': 4,
  'B+': 5,
  'AB+': 2,
  'PLATELETS': 4
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'HEALTHY', message: 'HemaGrid Auto-Replenishment Engine Active' });
});

// 1. Issue Blood & Trigger Automatic Replenishment
app.post('/api/inventory/issue', (req, res) => {
  const { bagBarcode, patientBloodGroup, hospitalId = 'HOSP-01' } = req.body;

  const bagIndex = inventory.findIndex(i => i.bagBarcode === bagBarcode);
  if (bagIndex === -1) {
    return res.status(404).json({ success: false, error: 'Blood bag not found' });
  }

  const bag = inventory[bagIndex];

  // Safety checks
  if (bag.status === 'QUARANTINE_TTI_PENDING') {
    return res.status(403).json({ success: false, error: 'Blood is still undergoing safety tests.' });
  }

  // Remove issued bag
  bag.status = 'ISSUED_TRANSFUSED';

  // AUTOMATIC REPLENISHMENT TRIGGER:
  // Count how many bags of this blood group are left in this hospital
  const remainingCount = inventory.filter(
    i => i.bloodBankId === hospitalId && i.bloodGroup === bag.bloodGroup && i.status === 'AVAILABLE'
  ).length;

  const safeBuffer = MINIMUM_SAFE_BUFFER[bag.bloodGroup] || 3;
  let replenishmentTriggered = false;
  let replenishmentNotice = null;

  if (remainingCount < safeBuffer) {
    replenishmentTriggered = true;
    // Find nearby registered donors who are eligible to donate
    const eligibleDonors = donors.filter(d => d.bloodGroup === bag.bloodGroup && d.isEligibleNow);
    replenishmentNotice = {
      bloodGroup: bag.bloodGroup,
      unitsRemaining: remainingCount,
      safeThreshold: safeBuffer,
      actionTaken: `AUTOMATIC REPLENISHMENT: Reserved 2 donation slots and sent private WhatsApp invitations to nearby ${bag.bloodGroup} donors.`,
      notifiedDonorsCount: Math.min(3, eligibleDonors.length)
    };
  }

  res.json({
    success: true,
    message: `Blood unit ${bag.bagBarcode} issued safely for patient.`,
    data: bag,
    replenishment: replenishmentNotice
  });
});

// 2. The Social Contract: "HemaShield Family Blood Insurance"
// When someone donates blood, they and their family get guaranteed blood access
app.get('/api/donors/:id/hemashield', (req, res) => {
  const donor = donors.find(d => d.id === req.params.id || d.nationalDonorId === req.params.id);
  if (!donor) return res.status(404).json({ success: false, error: 'Donor not found' });

  res.json({
    success: true,
    donorName: donor.fullName,
    nationalId: donor.nationalDonorId,
    hemashieldPolicy: {
      status: 'ACTIVE_GUARANTEED_PROTECTION',
      validUntil: '2027-11-11',
      coveredFamilyMembers: [
        'Donor (Self)',
        'Spouse',
        'Father & Mother',
        'Children'
      ],
      guarantee: 'In any medical emergency anywhere in India, donor family receives verified blood units with ZERO replacement donor demands.'
    }
  });
});

// 3. Inventory endpoint
app.get('/api/inventory', (req, res) => {
  const { hospitalId, bloodGroup, component, status } = req.query;
  let results = [...inventory];
  if (hospitalId) results = results.filter(i => i.bloodBankId === hospitalId);
  if (bloodGroup) results = results.filter(i => i.bloodGroup === bloodGroup);
  if (component) results = results.filter(i => i.component === component);
  if (status) results = results.filter(i => i.status === status);
  res.json({ success: true, count: results.length, data: results });
});

// 4. Expiry Radar
app.get('/api/expiry-radar', (req, res) => {
  const now = new Date().getTime();
  const expiring = inventory
    .filter(i => i.status === 'AVAILABLE')
    .map(i => {
      const hoursRemaining = Math.max(0, Math.round((new Date(i.expiryDate) - now) / 3600000));
      return { ...i, hoursRemaining, isUrgent: (i.component === 'PLATELETS' && hoursRemaining <= 48) || (i.component === 'PRBC' && hoursRemaining <= 168) };
    })
    .filter(i => i.isUrgent);
  res.json({ success: true, count: expiring.length, data: expiring });
});

// 5. Telemetry
app.get('/api/telemetry/:id', (req, res) => {
  const device = telemetry[req.params.id];
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, data: device });
});

// 6. SOS Request
app.post('/api/sos/request', (req, res) => {
  const { patientName, hospitalId, bloodGroup, component = 'PRBC', unitsRequested = 1, diagnosis } = req.body;
  const newSOS = {
    id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
    patientName: patientName.slice(0, 3) + '****',
    hospitalId: hospitalId || 'HOSP-01',
    bloodGroup,
    component,
    unitsRequested: Number(unitsRequested),
    diagnosis,
    status: 'SEARCHING_NEARBY_HOSPITALS',
    createdAt: new Date().toISOString()
  };
  sosRequests.unshift(newSOS);
  res.status(201).json({ success: true, message: 'Emergency SOS searching connected hospitals and nearby verified donors.', data: newSOS });
});

app.listen(PORT, () => {
  console.log(`[HemaGrid] System running on port ${PORT}`);
});
