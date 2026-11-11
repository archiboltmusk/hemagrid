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

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'HemaGrid Central API & Real-time Grid Engine',
    timestamp: new Date().toISOString()
  });
});

// Hospitals list
app.get('/api/hospitals', (req, res) => {
  res.json({ success: true, count: hospitals.length, data: hospitals });
});

// Inventory - List with filters (hospitalId, bloodGroup, component)
app.get('/api/inventory', (req, res) => {
  const { hospitalId, bloodGroup, component, status } = req.query;
  let results = [...inventory];

  if (hospitalId) {
    results = results.filter(i => i.bloodBankId === hospitalId);
  }
  if (bloodGroup) {
    results = results.filter(i => i.bloodGroup === bloodGroup);
  }
  if (component) {
    results = results.filter(i => i.component === component);
  }
  if (status) {
    results = results.filter(i => i.status === status);
  }

  res.json({ success: true, count: results.length, data: results });
});

// Add new bag to inventory (Vein-to-vein entry)
app.post('/api/inventory/add', (req, res) => {
  const {
    bloodBankId,
    bloodBankName,
    bloodGroup,
    component,
    volumeMl = 350,
    storageLocation = 'Main Cold Storage'
  } = req.body;

  if (!bloodBankId || !bloodGroup || !component) {
    return res.status(400).json({ success: false, error: 'Missing mandatory fields' });
  }

  const now = new Date();
  let shelfLifeDays = 35; // Default PRBC
  let tempRange = { minCelsius: 2, maxCelsius: 6 };

  if (component === 'PLATELETS') {
    shelfLifeDays = 5;
    tempRange = { minCelsius: 20, maxCelsius: 24 };
  } else if (component === 'FFP') {
    shelfLifeDays = 365;
    tempRange = { minCelsius: -40, maxCelsius: -30 };
  }

  const expiryDate = new Date(now.getTime() + shelfLifeDays * 86400000).toISOString();

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
    status: 'AVAILABLE',
    natTested: true,
    elisaTested: true,
    storageLocation,
    temperatureRequirement: tempRange,
    createdAt: now.toISOString()
  };

  inventory.unshift(newBag);
  res.status(201).json({ success: true, message: 'Bag registered in HemaGrid and synced to e-RaktKosh', data: newBag });
});

// Expiry Radar - Finds units nearing expiry to trigger automated cross-hospital transfers
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
    description: 'Units requiring immediate consumption or inter-bank redistribution',
    data: expiringSoon
  });
});

// Inter-Hospital Transfers
app.get('/api/transfers', (req, res) => {
  res.json({ success: true, count: transfers.length, data: transfers });
});

app.post('/api/transfers/request', (req, res) => {
  const { sourceHospitalId, targetHospitalId, items } = req.body;
  if (!sourceHospitalId || !targetHospitalId || !items || !items.length) {
    return res.status(400).json({ success: false, error: 'Incomplete transfer payload' });
  }

  const source = hospitals.find(h => h.id === sourceHospitalId) || { name: 'Source Center' };
  const target = hospitals.find(h => h.id === targetHospitalId) || { name: 'Target Center' };

  const newTransfer = {
    id: `TRF-${Math.floor(100 + Math.random() * 900)}`,
    transferManifestNumber: `MANIFEST-${new Date().getFullYear()}-DL-${Math.floor(1000 + Math.random() * 9000)}`,
    sourceHospitalId,
    sourceHospitalName: source.name,
    targetHospitalId,
    targetHospitalName: target.name,
    items,
    status: 'IN_TRANSIT',
    telemetryDeviceId: `IOT-BOX-${Math.floor(10 + Math.random() * 80)}`,
    estimatedTransitMinutes: 35,
    initiatedAt: new Date().toISOString()
  };

  transfers.unshift(newTransfer);

  // Initialize simulated IoT box
  telemetry[newTransfer.telemetryDeviceId] = {
    deviceId: newTransfer.telemetryDeviceId,
    transferId: newTransfer.id,
    currentTempCelsius: 4.2,
    minTempCelsius: 2.0,
    maxTempCelsius: 6.0,
    isBreached: false,
    batteryPercentage: 98,
    location: {
      latitude: source.lat || 28.5672,
      longitude: source.lng || 77.2100
    },
    lastPingTimestamp: new Date().toISOString(),
    tempHistory: [{ time: 'Just now', temp: 4.2 }]
  };

  res.status(201).json({ success: true, message: 'Transfer manifest generated and cold-chain route locked', data: newTransfer });
});

// Telemetry endpoint for IoT boxes
app.get('/api/telemetry/:deviceId', (req, res) => {
  const device = telemetry[req.params.deviceId];
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device telemetry not found' });
  }

  // Slightly fluctuate temp to simulate live IoT pings
  const jitter = (Math.random() - 0.5) * 0.2;
  device.currentTempCelsius = parseFloat((device.currentTempCelsius + jitter).toFixed(1));
  device.lastPingTimestamp = new Date().toISOString();

  res.json({ success: true, data: device });
});

// Emergency SOS Blood Requests
app.get('/api/sos/active', (req, res) => {
  res.json({ success: true, count: sosRequests.length, data: sosRequests });
});

app.post('/api/sos/request', (req, res) => {
  const {
    patientName,
    patientAge,
    patientGender,
    hospitalId,
    bloodGroup,
    component,
    unitsRequested,
    urgency,
    diagnosis
  } = req.body;

  const hospital = hospitals.find(h => h.id === hospitalId) || {
    name: 'Apollo / AIIMS Partner Center',
    city: 'New Delhi'
  };

  const newSOS = {
    id: `SOS-${Math.floor(100 + Math.random() * 900)}`,
    patientName,
    patientAge: Number(patientAge) || 30,
    patientGender: patientGender || 'OTHER',
    hospitalId: hospitalId || 'HOSP-01',
    hospitalName: hospital.name,
    bloodGroup,
    component: component || 'PRBC',
    unitsRequested: Number(unitsRequested) || 1,
    unitsAllocated: 0,
    urgency: urgency || 'URGENT_2_HOURS',
    diagnosis: diagnosis || 'Emergency blood requirement',
    status: 'MATCHING',
    createdAt: new Date().toISOString()
  };

  sosRequests.unshift(newSOS);

  // Auto-matching algorithm: search inventory for matching available blood
  const matchingInventory = inventory.filter(
    i => i.bloodGroup === bloodGroup && i.component === newSOS.component && i.status === 'AVAILABLE'
  );

  res.status(201).json({
    success: true,
    message: 'Emergency SOS activated across HemaGrid network and nearby verified donor beacons',
    data: newSOS,
    availableUnitsFound: matchingInventory.length
  });
});

// Donor Profile & Registration
app.get('/api/donors/:id', (req, res) => {
  const donor = donors.find(d => d.id === req.params.id || d.nationalDonorId === req.params.id);
  if (!donor) {
    return res.status(404).json({ success: false, error: 'Donor record not found' });
  }
  res.json({ success: true, data: donor });
});

app.post('/api/donors/register', (req, res) => {
  const { fullName, phone, email, bloodGroup, dob, gender, city, pincode } = req.body;

  const newDonor = {
    id: `DONOR-${Date.now().toString().slice(-4)}`,
    nationalDonorId: `HG-IND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    fullName,
    phone,
    email,
    bloodGroup,
    dob,
    gender: gender || 'M',
    totalDonations: 0,
    isEligibleNow: true,
    city: city || 'New Delhi',
    pincode: pincode || '110001',
    badgeLevel: 'BRONZE',
    nextEligibleDate: new Date().toISOString().split('T')[0]
  };

  donors.push(newDonor);
  res.status(201).json({ success: true, message: 'Donor registered with Digital HemaPass', data: newDonor });
});

// Camps
app.get('/api/camps', (req, res) => {
  res.json({ success: true, count: camps.length, data: camps });
});

// e-RaktKosh Sync Status Simulation
app.get('/api/e-raktkosh/sync-status', (req, res) => {
  res.json({
    success: true,
    gateway: 'e-RaktKosh National Health Portal API Gateway v3.1',
    status: 'ONLINE',
    lastSyncTimestamp: new Date().toISOString(),
    latencyMs: 142,
    recordsSyncedLast24Hours: 14820,
    complianceStatus: '100% REGULATORY_COMPLIANT'
  });
});

app.listen(PORT, () => {
  console.log(`[HemaGrid API] Server running on http://localhost:${PORT}`);
});
