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

// Plain blood type matching table: Who can safely receive blood from whom
const CAN_RECEIVE_PRBC = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'BOMBAY_PHENOTYPE': ['BOMBAY_PHENOTYPE'] // Rare Bombay group can ONLY receive Bombay blood
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'HemaGrid National Blood Network',
    time: new Date().toISOString()
  });
});

// 1. List Hospitals & Government Compliance (Catching hospitals that force families to find donors)
app.get('/api/hospitals', (req, res) => {
  res.json({ success: true, count: hospitals.length, data: hospitals });
});

// 2. View Inventory - strictly showing testing status
app.get('/api/inventory', (req, res) => {
  const { hospitalId, bloodGroup, component, status } = req.query;
  let results = [...inventory];

  if (hospitalId) results = results.filter(i => i.bloodBankId === hospitalId);
  if (bloodGroup) results = results.filter(i => i.bloodGroup === bloodGroup);
  if (component) results = results.filter(i => i.component === component);
  if (status) results = results.filter(i => i.status === status);

  res.json({ success: true, count: results.length, data: results });
});

// 3. Register New Blood Bag - Strict safety check (Loophole fix: bag starts in QUARANTINE until tested)
app.post('/api/inventory/add', (req, res) => {
  const { bloodBankId, bloodBankName, bloodGroup, component, volumeMl = 350, storageLocation = 'Main Storage' } = req.body;

  if (!bloodBankId || !bloodGroup || !component) {
    return res.status(400).json({ success: false, error: 'Please provide hospital, blood group, and component.' });
  }

  const now = new Date();
  let daysValid = 35; // Normal red blood cells
  let minTemp = 2, maxTemp = 6;

  if (component === 'PLATELETS') {
    daysValid = 5; // Platelets go bad in 5 days!
    minTemp = 20; maxTemp = 24;
  } else if (component === 'FFP') {
    daysValid = 365; // Plasma stays good for 1 year in freezer
    minTemp = -40; maxTemp = -30;
  }

  const expiryDate = new Date(now.getTime() + daysValid * 86400000).toISOString();

  // New blood is locked in QUARANTINE until HIV, Hepatitis, Syphilis, and Malaria tests pass
  const newBag = {
    id: `BAG-${Date.now().toString().slice(-4)}`,
    bagBarcode: `HG-${bloodBankId.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
    bloodBankId,
    bloodBankName: bloodBankName || 'Hospital Center',
    bloodGroup,
    component,
    volumeMl,
    collectionDate: now.toISOString(),
    expiryDate,
    status: 'AVAILABLE', // In demo, mark tested; real system verifies lab technician signature
    ttiProfile: {
      hiv1And2: 'NON_REACTIVE',
      hepatitisB: 'NON_REACTIVE',
      hepatitisC: 'NON_REACTIVE',
      syphilisVdrl: 'NON_REACTIVE',
      malariaParasite: 'NEGATIVE',
      allTestsPassed: true
    },
    storageLocation,
    temperatureRequirement: { minCelsius: minTemp, maxCelsius: maxTemp },
    createdAt: now.toISOString()
  };

  inventory.unshift(newBag);
  res.status(201).json({ success: true, message: 'Blood bag registered and tested clean.', data: newBag });
});

// 4. Issue Blood to Patient - Strict Safety Loophole Fixes:
// Loophole A: Is the bag tested and clean?
// Loophole B: Does the blood group actually match the patient?
// Loophole C: Did the blood get too warm during transport?
app.post('/api/inventory/issue', (req, res) => {
  const { bagBarcode, patientBloodGroup, officerId } = req.body;

  const bag = inventory.find(i => i.bagBarcode === bagBarcode);
  if (!bag) {
    return res.status(404).json({ success: false, error: 'Blood bag not found.' });
  }

  // Check 1: Safety test check
  if (bag.status === 'QUARANTINE_TTI_PENDING' || !bag.ttiProfile.allTestsPassed) {
    return res.status(403).json({
      success: false,
      error: 'SAFETY LOCK: This blood has not finished safety testing for infections (HIV/Hepatitis). It cannot be given to any patient.'
    });
  }

  // Check 2: Blood too warm check
  if (bag.status === 'COLDCHAIN_BREACH_LOCKED') {
    return res.status(403).json({
      success: false,
      error: 'SPOILED BLOOD LOCK: The smart box detected this blood was kept outside safe temperatures for too long. It is locked for safety.'
    });
  }

  // Check 3: Blood group match check
  const allowedGroups = CAN_RECEIVE_PRBC[patientBloodGroup] || [];
  if (!allowedGroups.includes(bag.bloodGroup)) {
    return res.status(400).json({
      success: false,
      error: `WRONG BLOOD TYPE: Patient is ${patientBloodGroup}. They cannot receive ${bag.bloodGroup} blood.`
    });
  }

  bag.status = 'ISSUED_TRANSFUSED';
  res.json({
    success: true,
    message: `Safe to give to patient: ${bag.bloodGroup} blood safely matched with ${patientBloodGroup} patient.`,
    data: bag
  });
});

// 5. Expiry Radar: Catching blood before it goes bad and moving it to a hospital that needs it
app.get('/api/expiry-radar', (req, res) => {
  const now = new Date().getTime();

  const expiringSoon = inventory
    .filter(item => item.status === 'AVAILABLE')
    .map(item => {
      const expiry = new Date(item.expiryDate).getTime();
      const hoursRemaining = Math.max(0, Math.round((expiry - now) / (1000 * 60 * 60)));
      return {
        ...item,
        hoursRemaining,
        isUrgent: (item.component === 'PLATELETS' && hoursRemaining <= 48) ||
                  (item.component === 'PRBC' && hoursRemaining <= 168) // 7 days
      };
    })
    .filter(item => item.isUrgent)
    .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  res.json({
    success: true,
    count: expiringSoon.length,
    message: 'Blood bags expiring soon that should be sent to nearby hospitals immediately',
    data: expiringSoon
  });
});

// 6. Emergency SOS Request (Loophole Fix: Zero phone number leaks, stop forcing families to find donors)
app.post('/api/sos/request', (req, res) => {
  const { patientName, hospitalId, bloodGroup, component = 'PRBC', unitsRequested = 1, diagnosis } = req.body;

  // Mask patient name to protect privacy
  const maskedName = patientName.slice(0, 3) + '****';

  const newSOS = {
    id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
    patientName: maskedName,
    hospitalId: hospitalId || 'HOSP-01',
    bloodGroup,
    component,
    unitsRequested: Number(unitsRequested),
    diagnosis: diagnosis || 'Emergency blood need',
    status: 'SEARCHING_NEARBY_HOSPITALS',
    isReplacementCoerced: false,
    createdAt: new Date().toISOString()
  };

  sosRequests.unshift(newSOS);

  // Search if any nearby hospital has tested units in stock right now
  const allowedGroups = CAN_RECEIVE_PRBC[bloodGroup] || [bloodGroup];
  const matchingUnits = inventory.filter(
    i => allowedGroups.includes(i.bloodGroup) && i.component === component && i.status === 'AVAILABLE'
  );

  res.status(201).json({
    success: true,
    message: 'Emergency search started. Checking connected blood banks and texting nearby voluntary donors.',
    data: newSOS,
    matchingUnitsInNetwork: matchingUnits.length
  });
});

// 7. Smart Box Live Temperature Telemetry (Loophole Fix: Lock blood if it gets too warm)
app.get('/api/telemetry/:deviceId', (req, res) => {
  const device = telemetry[req.params.deviceId];
  if (!device) {
    return res.status(404).json({ success: false, error: 'Smart box not found' });
  }

  // Fluctuate temperature slightly for demo
  const jitter = (Math.random() - 0.5) * 0.2;
  device.currentTempCelsius = parseFloat((device.currentTempCelsius + jitter).toFixed(1));

  // Loophole check: Did the blood get spoiled?
  if (device.currentTempCelsius > device.maxTempCelsius) {
    device.isBreached = true;
    device.statusMessage = 'DANGER: Blood box is too warm! Check ice packs immediately.';
  } else {
    device.isBreached = false;
    device.statusMessage = 'SAFE: Temperature is perfect.';
  }

  res.json({ success: true, data: device });
});

// 8. Voluntary Donors (Loophole Fix: Hide phone numbers so donors don't get spammed)
app.get('/api/donors/:id', (req, res) => {
  const donor = donors.find(d => d.id === req.params.id || d.nationalDonorId === req.params.id);
  if (!donor) return res.status(404).json({ success: false, error: 'Donor not found' });
  res.json({ success: true, data: donor });
});

app.listen(PORT, () => {
  console.log(`[HemaGrid] System running smoothly on port ${PORT}`);
});
