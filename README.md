# MediSync – AI-Powered Smart Healthcare Coordination Platform

MediSync is a working full-stack healthcare coordination platform designed to reduce patient waiting times, improve hospital navigation, provide real-time token/queue management, and seamlessly connect Patients, Doctors, Hospital Administrators, and Pharmacies in one unified ecosystem.

---

## 1. Project Overview & Problem Statement

### Problem Statement
Overcrowded outpatient departments (OPDs), uncoordinated patient arrivals, and unpredictable emergency interruptions lead to long patient wait times, low hospital resource utilization, and frustrated patients.

### Solution
MediSync replaces manual waiting lines with an **AI-driven Smart Healthcare Coordination Engine**:
- **AI Health Concern Categorization**: Automatically suggests the best hospital department (General Medicine, Cardiology, Dermatology, ENT, Orthopedics, Pediatrics, Gynecology, Neurology, etc.) with strict non-diagnostic medical disclaimers.
- **Location-Based Map Discovery**: Finds nearby hospitals using Leaflet/OpenStreetMap, calculating distances and queue congestion.
- **Real-Time Smart Queue System**: Live token tracking ($A-23$, $A-27$) with dynamic wait time countdowns and Socket.IO real-time updates.
- **Emergency Priority Injection**: Dynamically recalculates queue positions and ETAs for downstream waiting patients when an emergency case arises.
- **Integrated Digital Prescriptions & Pharmacy Fulfillment**: Direct end-to-end digital prescription flow from doctors to pharmacies.

---

## 2. Authentication & Role-Based Authorization API

MediSync uses JWT (JSON Web Tokens) for secure, stateless authentication and `@role_required(*roles)` middleware for role-based authorization across four distinct roles (`PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `PHARMACY`).

### A. Register User (`POST /api/auth/register`)
**Request Body**:
```json
{
  "name": "Sarah Jenkins",
  "email": "sarah@example.com",
  "phone": "+1 555-0101",
  "password": "securepassword123",
  "role": "PATIENT",
  "age": 32,
  "gender": "Female"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Sarah Jenkins",
    "email": "sarah@example.com",
    "phone": "+1 555-0101",
    "role": "PATIENT"
  }
}
```

---

### B. User Login (`POST /api/auth/login`)
**Request Body**:
```json
{
  "email": "patient@medisync.demo",
  "password": "patient123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Demo Patient",
    "email": "patient@medisync.demo",
    "phone": "+1 555-0101",
    "role": "PATIENT"
  }
}
```

---

## 3. Doctor Module REST APIs

All doctor endpoints require `Authorization: Bearer <access_token>` with role `DOCTOR`. Doctor A cannot access Doctor B's queue or patients (403 Forbidden).

### A. Doctor Dashboard (`GET /api/doctors/dashboard`)
Returns doctor profile, today's appointments count, waiting count, current serving token, next patient, completed count, and current queue.
```json
{
  "success": true,
  "doctor": { "id": 1, "name": "Dr. Demo Doctor", "specialization": "General Physician" },
  "current_token": "G-23",
  "waiting_patients_count": 4,
  "completed_consultations_count": 0,
  "avg_waiting_time_mins": 12
}
```

---

### B. Call Next Patient (`POST /api/doctors/queue/next`)
Advances the queue: sets current patient `IN_PROGRESS` -> `COMPLETED`, transitions next `EMERGENCY` or `WAITING` patient to `IN_PROGRESS`, recalculates ETAs, and emits a SocketIO notification.
```json
{
  "success": true,
  "message": "Called token G-24",
  "called_patient": {
    "token_code": "G-24",
    "patient_name": "Elena Rostova",
    "status": "IN_PROGRESS"
  }
}
```

---

### C. Trigger Emergency Case (`POST /api/doctors/queue/emergency`)
Injects an emergency patient into position #1 immediately following the active consultation. Recalculates all ETAs dynamically and sends emergency update notifications.
```json
{
  "patient_id": 1,
  "reason": "Acute chest pain & dyspnea"
}
```

---

### D. Complete Consultation (`POST /api/doctors/consultations/<queue_item_id>/complete`)
Stores the doctor's clinical diagnosis and notes into `MedicalRecord` (no AI auto-diagnosis; doctor-approved clinical assessment only).
```json
{
  "diagnosis": "Acute Upper Respiratory Infection",
  "clinical_notes": "Prescribed oral hydration and 3 days rest."
}
```

---

### E. Create Digital Prescription (`POST /api/doctors/prescriptions`)
```json
{
  "patient_id": 1,
  "diagnosis": "Acute Upper Respiratory Infection",
  "clinical_notes": "Take full antibiotic course.",
  "medicines": [
    {
      "name": "Amoxicillin 500mg",
      "dosage": "1 Capsule",
      "frequency": "Twice daily (BD)",
      "duration": "5 days",
      "instructions": "After meals"
    }
  ]
}
```

---

## 4. Safe Pre-Configured Demo Credentials

| Role | Email | Password | Access Dashboard |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@medisync.demo` | `patient123` | `/patient/dashboard` |
| **Doctor** | `doctor@medisync.demo` | `doctor123` | `/doctor/dashboard` |
| **Hospital Admin** | `admin@medisync.demo` | `admin123` | `/hospital/dashboard` |
| **Pharmacy** | `pharmacy@medisync.demo` | `pharmacy123` | `/pharmacy/dashboard` |

---

## 5. Quick Start Instructions

### 1. Install Dependencies & Setup Database
```bash
pip install -r backend/requirements.txt
python database/seed.py
```

### 2. Run Test Suite
```bash
python -m pytest tests/
```

### 3. Start Flask Backend Server
```bash
python backend/app.py
```
*API runs at `http://localhost:5000`.*
