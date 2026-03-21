import { faker } from '@faker-js/faker';
import fs from 'fs';

const HOSPITAL_CHAINS = ['Apollo', 'AIIMS', 'Fortis', 'Max', 'Medanta'];

const CITIES = [
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Chandigarh', state: 'Punjab' },
  { city: 'Bhopal', state: 'Madhya Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Patna', state: 'Bihar' },
  { city: 'Guwahati', state: 'Assam' },
];

const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
  'Dermatology', 'Gastroenterology', 'Pulmonology', 'Nephrology', 'Urology',
  'Endocrinology', 'Rheumatology', 'Ophthalmology', 'ENT', 'Psychiatry',
  'General Surgery', 'Plastic Surgery', 'Anesthesiology', 'Radiology', 'Pathology',
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const WARD_TYPES = ['ICU', 'GENERAL', 'PRIVATE', 'SEMI_PRIVATE', 'EMERGENCY'];

const SCHEDULES = [
  'Mon-Fri 9AM-5PM', 'Mon-Fri 10AM-6PM', 'Mon-Sat 8AM-2PM',
  'Tue-Sat 2PM-10PM', 'Mon-Wed-Fri 9AM-3PM', 'Mon-Fri 6AM-2PM',
  'Shift A: 6AM-2PM', 'Shift B: 2PM-10PM', 'Shift C: 10PM-6AM',
  'Mon-Fri 8AM-4PM', 'Tue-Thu-Sat 9AM-5PM', 'Wed-Sun 10AM-6PM',
];

const MEDICATIONS = [
  'Amoxicillin 500mg', 'Metformin 850mg', 'Amlodipine 5mg', 'Atorvastatin 20mg',
  'Omeprazole 20mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Cetirizine 10mg',
  'Azithromycin 250mg', 'Pantoprazole 40mg', 'Metoprolol 50mg', 'Losartan 50mg',
  'Ciprofloxacin 500mg', 'Doxycycline 100mg', 'Prednisone 10mg', 'Gabapentin 300mg',
  'Clopidogrel 75mg', 'Levothyroxine 50mcg', 'Montelukast 10mg', 'Ranitidine 150mg',
];

const DOSAGE_INSTRUCTIONS = [
  'Take 1 tablet twice daily after meals',
  'Take 1 tablet once daily in the morning',
  'Take 1 tablet three times daily before meals',
  'Take 2 tablets at bedtime',
  'Take 1 tablet every 8 hours',
  'Take 1 tablet once daily with food',
  'Apply topically twice daily',
  'Take 1 capsule once daily on empty stomach',
  'Dissolve in water and take before meals',
  'Take as needed, max 4 tablets per day',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePrivacyCode(): string {
  return String(randomInt(100, 999));
}

function generateIndianPhone(): string {
  const prefixes = ['98', '97', '96', '95', '94', '93', '91', '90', '88', '87', '86', '85'];
  return `+91${pickRandom(prefixes)}${String(randomInt(10000000, 99999999))}`;
}

const outFile = 'seed.sql';

function appendSql(sql: string) {
  fs.appendFileSync(outFile, sql + '\n');
}

function escapeSql(str: string): string {
  if (!str) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

async function main() {
  if (fs.existsSync(outFile)) {
    fs.unlinkSync(outFile);
  }

  console.log('Generating seed SQL...');

  // Arrays to hold generated IDs
  const hospitalIds: number[] = [];
  const bedIds: number[] = [];
  const doctorIds: number[] = [];
  const patientIds: number[] = [];

  // Hospitals
  appendSql(`-- Hospitals`);
  for (let i = 0; i < 200; i++) {
    const chain = HOSPITAL_CHAINS[i % HOSPITAL_CHAINS.length];
    const location = CITIES[i % CITIES.length];
    const branchNum = Math.floor(i / CITIES.length) + 1;
    const totalBeds = randomInt(50, 100);
    const id = i + 1;
    hospitalIds.push(id);

    const name = escapeSql(`${chain} Hospital - ${location.city} Branch ${branchNum}`);
    const city = escapeSql(location.city);
    const state = escapeSql(location.state);
    const address = escapeSql(`${randomInt(1, 500)}, ${faker.location.street()}, ${location.city} - ${randomInt(100000, 999999)}`);
    const phone = escapeSql(generateIndianPhone());

    appendSql(`INSERT INTO hospitals (id, name, city, state, address, phone, "totalBeds", "createdAt", "updatedAt") VALUES (${id}, ${name}, ${city}, ${state}, ${address}, ${phone}, ${totalBeds}, NOW(), NOW());`);
  }
  
  // Set sequence
  appendSql(`SELECT setval('hospitals_id_seq', 200, true);`);

  // Beds
  appendSql(`-- Beds`);
  let bedIdCounter = 1;
  const BATCH_SIZE = 500;
  let currentBedBatch: string[] = [];

  for (let i = 0; i < 200; i++) {
    const hospitalId = hospitalIds[i];
    const bedCount = randomInt(50, 100);

    for (let b = 0; b < bedCount; b++) {
      const wardType = escapeSql(WARD_TYPES[b % WARD_TYPES.length]);
      const bedNumber = escapeSql(`${WARD_TYPES[b % WARD_TYPES.length].substring(0, 3)}-${String(b + 1).padStart(3, '0')}`);
      const status = escapeSql(pickRandom(['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'OCCUPIED']));
      const floor = Math.floor(b / 20) + 1;
      const id = bedIdCounter++;
      bedIds.push(id);

      currentBedBatch.push(`(${id}, ${bedNumber}, ${wardType}, ${status}, ${floor}, ${hospitalId}, NOW(), NOW())`);
      
      if (currentBedBatch.length >= BATCH_SIZE) {
        appendSql(`INSERT INTO beds (id, "bedNumber", "wardType", status, floor, "hospitalId", "createdAt", "updatedAt") VALUES ${currentBedBatch.join(', ')};`);
        currentBedBatch = [];
      }
    }
  }
  if (currentBedBatch.length > 0) {
    appendSql(`INSERT INTO beds (id, "bedNumber", "wardType", status, floor, "hospitalId", "createdAt", "updatedAt") VALUES ${currentBedBatch.join(', ')};`);
  }
  appendSql(`SELECT setval('beds_id_seq', ${bedIdCounter - 1}, true);`);

  // Admins
  appendSql(`-- Admins`);
  let adminBatch: string[] = [];
  for (let i = 0; i < 200; i++) {
    const firstName = escapeSql(faker.person.firstName());
    const lastName = escapeSql(faker.person.lastName());
    const email = escapeSql(`admin.${firstName.toLowerCase().replace(/'/g, '')}.${lastName.toLowerCase().replace(/'/g, '')}${i}@medibed.in`);
    const pwd = escapeSql(faker.string.alphanumeric(64));
    
    adminBatch.push(`(${i + 1}, ${firstName} || ' ' || ${lastName}, ${email}, ${pwd}, 'ADMIN', ${hospitalIds[i]}, NOW(), NOW())`);
  }
  appendSql(`INSERT INTO admins (id, name, email, "passwordHash", role, "hospitalId", "createdAt", "updatedAt") VALUES ${adminBatch.join(', ')};`);
  appendSql(`SELECT setval('admins_id_seq', 200, true);`);

  // Doctors
  appendSql(`-- Doctors`);
  let docBatch: string[] = [];
  for (let i = 0; i < 2000; i++) {
    const id = i + 1;
    doctorIds.push(id);
    const firstName = escapeSql(faker.person.firstName());
    const lastName = escapeSql(faker.person.lastName());
    const name = escapeSql(`Dr. ${firstName.replace(/'/g, '')} ${lastName.replace(/'/g, '')}`);
    const email = escapeSql(`dr.${firstName.toLowerCase().replace(/'/g, '')}.${lastName.toLowerCase().replace(/'/g, '')}${i}@medibed.in`);
    const spec = escapeSql(pickRandom(SPECIALTIES));
    const sched = escapeSql(pickRandom(SCHEDULES));
    const phone = escapeSql(generateIndianPhone());
    const hid = pickRandom(hospitalIds);

    docBatch.push(`(${id}, ${name}, ${email}, ${spec}, ${sched}, ${phone}, ${hid}, NOW(), NOW())`);
    
    if (docBatch.length >= BATCH_SIZE) {
        appendSql(`INSERT INTO doctors (id, name, email, specialty, schedule, phone, "hospitalId", "createdAt", "updatedAt") VALUES ${docBatch.join(', ')};`);
        docBatch = [];
    }
  }
  if (docBatch.length > 0) {
     appendSql(`INSERT INTO doctors (id, name, email, specialty, schedule, phone, "hospitalId", "createdAt", "updatedAt") VALUES ${docBatch.join(', ')};`);
  }
  appendSql(`SELECT setval('doctors_id_seq', 2000, true);`);


  // Patients
  appendSql(`-- Patients`);
  const usedCodes = new Set<string>();
  let patBatch: string[] = [];
  for (let i = 0; i < 1000; i++) {
    const id = i + 1;
    patientIds.push(id);
    const firstName = escapeSql(faker.person.firstName());
    const lastName = escapeSql(faker.person.lastName());
    const name = escapeSql(`${firstName.replace(/'/g, '')} ${lastName.replace(/'/g, '')}`);
    const email = escapeSql(`${firstName.toLowerCase().replace(/'/g, '')}.${lastName.toLowerCase().replace(/'/g, '')}${i}@email.com`);
    const phone = escapeSql(generateIndianPhone());
    
    // Privacy code is VarChar(3) and needs to be unique. 
    // Since we create exactly 1000 patients, index 0-999 padded to 3 digits is perfect.
    const pcode = escapeSql(String(i).padStart(3, '0'));
    const btype = escapeSql(pickRandom(BLOOD_TYPES));
    
    patBatch.push(`(${id}, ${name}, ${email}, ${phone}, ${pcode}, ${btype}, NOW() - interval '20 years', 'PATIENT', NOW(), NOW())`);
    
    if (patBatch.length >= BATCH_SIZE) {
        appendSql(`INSERT INTO patients (id, name, email, phone, "privacyCode", "bloodType", "dateOfBirth", role, "createdAt", "updatedAt") VALUES ${patBatch.join(', ')};`);
        patBatch = [];
    }
  }
  if (patBatch.length > 0) {
    appendSql(`INSERT INTO patients (id, name, email, phone, "privacyCode", "bloodType", "dateOfBirth", role, "createdAt", "updatedAt") VALUES ${patBatch.join(', ')};`);
  }
  appendSql(`SELECT setval('patients_id_seq', 1000, true);`);

  // Bed Bookings
  appendSql(`-- Bed Bookings`);
  let bookBatch: string[] = [];
  const usedBeds = new Set<number>();
  for (let i = 0; i < 500; i++) {
    const id = i + 1;
    let bedId: number;
    do { bedId = pickRandom(bedIds); } while (usedBeds.has(bedId));
    usedBeds.add(bedId);

    const isActive = Math.random() > 0.4;
    const status = escapeSql(isActive ? 'ACTIVE' : 'DISCHARGED');
    const patId = pickRandom(patientIds);
    const docId = pickRandom(doctorIds);

    let dDate = isActive ? 'NULL' : "NOW() + interval '5 days'";
    
    bookBatch.push(`(${id}, NOW() - interval '2 days', ${dDate}, ${status}, ${bedId}, ${patId}, ${docId}, NOW(), NOW())`);
    
    if (bookBatch.length >= BATCH_SIZE) {
        appendSql(`INSERT INTO bed_bookings (id, "admissionDate", "dischargeDate", status, "bedId", "patientId", "doctorId", "createdAt", "updatedAt") VALUES ${bookBatch.join(', ')};`);
        bookBatch = [];
    }
  }
  if (bookBatch.length > 0) {
    appendSql(`INSERT INTO bed_bookings (id, "admissionDate", "dischargeDate", status, "bedId", "patientId", "doctorId", "createdAt", "updatedAt") VALUES ${bookBatch.join(', ')};`);
  }
  appendSql(`SELECT setval('bed_bookings_id_seq', 500, true);`);

  // Prescriptions
  appendSql(`-- Prescriptions`);
  let rxBatch: string[] = [];
  for (let i = 0; i < 1000; i++) {
    const id = i + 1;
    const med = escapeSql(pickRandom(MEDICATIONS));
    const dose = escapeSql(pickRandom(MEDICATIONS).split(' ').pop() || '500mg');
    const instructions = escapeSql(pickRandom(DOSAGE_INSTRUCTIONS));
    const patId = pickRandom(patientIds);
    const docId = pickRandom(doctorIds);

    rxBatch.push(`(${id}, ${med}, ${dose}, ${instructions}, NOW() - interval '10 days', ${patId}, ${docId}, NOW(), NOW())`);
    
    if (rxBatch.length >= BATCH_SIZE) {
       appendSql(`INSERT INTO prescriptions (id, medication, dosage, instructions, date, "patientId", "doctorId", "createdAt", "updatedAt") VALUES ${rxBatch.join(', ')};`);
       rxBatch = [];
    }
  }
  if (rxBatch.length > 0) {
    appendSql(`INSERT INTO prescriptions (id, medication, dosage, instructions, date, "patientId", "doctorId", "createdAt", "updatedAt") VALUES ${rxBatch.join(', ')};`);
  }
  appendSql(`SELECT setval('prescriptions_id_seq', 1000, true);`);

  console.log('SQL generated to seed.sql');
}

main().catch(console.error);
