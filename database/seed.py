import sys
import os
from datetime import datetime, date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.extensions import db
from backend.models import (
    User, Patient, Doctor, Hospital, Department, HospitalDepartment,
    Pharmacy, Medicine, Queue, QueueItem, Prescription, PrescriptionItem,
    MedicalRecord, Notification
)

def seed_database():
    app = create_app()
    with app.app_context():
        print("[SEED] Resetting database tables...")
        db.drop_all()
        db.create_all()

        print("[SEED] Creating Departments...")
        depts_data = [
            ("General Medicine", "Primary health evaluation and broad systemic care.", "activity"),
            ("Cardiology", "Specialized heart and cardiovascular care.", "heart"),
            ("Dermatology", "Skin, hair, and cosmetic medical treatments.", "sun"),
            ("ENT", "Ear, Nose, Throat and sinus diagnostics.", "ear"),
            ("Orthopedics", "Bone, joint, spine, and musculoskeletal surgery.", "bone"),
            ("Pediatrics", "Infant, child, and adolescent medicine.", "baby"),
            ("Gynecology", "Female reproductive health and maternity care.", "user-check"),
            ("Neurology", "Brain, spine, and nerve disorders.", "brain")
        ]
        dept_objs = {}
        for name, desc, icon in depts_data:
            dept = Department(name=name, description=desc, icon_name=icon)
            db.session.add(dept)
            db.session.flush()
            dept_objs[name] = dept

        print("[SEED] Creating Hospitals...")
        hospitals_data = [
            ("City Care Multi-Specialty Hospital", "124 Central Health Boulevard, City Center", 12.9716, 77.5946, "+1 800-555-0199", "contact@citycare.org", "24/7 Emergency & Outpatient"),
            ("Apex Health Institute & Research", "88 Koramangala 4th Block, South Hub", 12.9352, 77.6245, "+1 800-555-0244", "info@apexhealth.org", "24/7 Emergency & ICU"),
            ("Sunrise Community Hospital", "45 Malleshwaram 18th Cross, North District", 12.9800, 77.5700, "+1 800-555-0311", "support@sunrisehospital.com", "8:00 AM - 10:00 PM"),
            ("Metro Life Heart & General Clinic", "12 BTM Layout 2nd Stage, Outer Ring", 12.9165, 77.6101, "+1 800-555-0450", "care@metrolife.org", "24/7 Critical Care")
        ]
        hosp_objs = []
        for name, addr, lat, lng, phone, email, hours in hospitals_data:
            hosp = Hospital(name=name, address=addr, latitude=lat, longitude=lng, phone=phone, email=email, operating_hours=hours)
            db.session.add(hosp)
            db.session.flush()
            hosp_objs.append(hosp)

            for dept in dept_objs.values():
                hd = HospitalDepartment(hospital_id=hosp.id, department_id=dept.id)
                db.session.add(hd)

        print("[SEED] Creating Safe Demo Users and Profiles...")
        # 1. Patient Demo User
        u_patient = User(name="Demo Patient", email="patient@medisync.demo", phone="+1 555-0101", role="PATIENT")
        u_patient.set_password("patient123")
        db.session.add(u_patient)
        db.session.flush()

        p_patient = Patient(
            user_id=u_patient.id,
            age=32,
            gender="Female",
            blood_group="A+",
            emergency_contact="+1 555-9999",
            address="742 Evergreen Terrace"
        )
        db.session.add(p_patient)

        # Additional Patients for queue simulation
        patient_names = ["Robert Chen", "Elena Rostova", "Michael Vance", "Priya Sharma"]
        p_objs = [p_patient]
        for idx, p_name in enumerate(patient_names, start=2):
            u = User(name=p_name, email=f"patient{idx}@medisync.demo", phone=f"+1 555-010{idx}", role="PATIENT")
            u.set_password("patient123")
            db.session.add(u)
            db.session.flush()

            p = Patient(user_id=u.id, age=25+idx*5, gender="Male" if idx%2==0 else "Female", blood_group="O+", emergency_contact="+1 555-0000")
            db.session.add(p)
            db.session.flush()
            p_objs.append(p)

        # 2. Doctor Demo Users
        doctors_meta = [
            ("Dr. Demo Doctor", "doctor@medisync.demo", "doctor123", "+1 555-0201", hosp_objs[0].id, dept_objs["General Medicine"].id, "MD (Internal Medicine)", "General Physician", 10, 12),
            ("Dr. Ananya Sen", "cardio@medisync.demo", "doctor123", "+1 555-0202", hosp_objs[0].id, dept_objs["Cardiology"].id, "DM Cardiology, FRCP", "Cardiologist", 14, 15),
            ("Dr. Marcus Vance", "derma@medisync.demo", "doctor123", "+1 555-0203", hosp_objs[1].id, dept_objs["Dermatology"].id, "MD Dermatology", "Dermatologist", 8, 10),
            ("Dr. Priya Nair", "ent@medisync.demo", "doctor123", "+1 555-0204", hosp_objs[2].id, dept_objs["ENT"].id, "MS ENT Specialist", "Otolaryngologist", 6, 12)
        ]
        doc_objs = []
        for name, email, pwd, phone, h_id, d_id, qual, spec, exp, avg_t in doctors_meta:
            u_doc = User(name=name, email=email, phone=phone, role="DOCTOR")
            u_doc.set_password(pwd)
            db.session.add(u_doc)
            db.session.flush()

            doc = Doctor(
                user_id=u_doc.id,
                hospital_id=h_id,
                department_id=d_id,
                qualification=qual,
                specialization=spec,
                experience_years=exp,
                avg_consultation_time_mins=avg_t,
                is_available=True
            )
            db.session.add(doc)
            db.session.flush()
            doc_objs.append(doc)

        # 3. Hospital Admin Demo User
        u_admin = User(name="Demo Admin Officer", email="admin@medisync.demo", phone="+1 555-0301", role="HOSPITAL_ADMIN")
        u_admin.set_password("admin123")
        db.session.add(u_admin)

        # 4. Pharmacy Demo User
        u_pharmacy = User(name="Demo Pharmacy", email="pharmacy@medisync.demo", phone="+1 555-0401", role="PHARMACY")
        u_pharmacy.set_password("pharmacy123")
        db.session.add(u_pharmacy)
        db.session.flush()

        pharmacy = Pharmacy(
            user_id=u_pharmacy.id,
            hospital_id=hosp_objs[0].id,
            name="Demo Central Pharmacy",
            address="Ground Floor, City Care Hospital",
            phone="+1 555-0401"
        )
        db.session.add(pharmacy)
        db.session.flush()

        # Medicines Inventory
        meds_data = [
            ("Amoxicillin 500mg", "Antibiotic", "Broad-spectrum penicillin antibiotic.", 120, 15.50, True),
            ("Paracetamol 650mg", "Analgesic", "Fever and mild to moderate pain reliever.", 300, 5.00, True),
            ("Cetirizine 10mg", "Antihistamine", "Relieves allergy symptoms, sneezing & itch.", 80, 8.25, True),
            ("Atorvastatin 10mg", "Cardiovascular", "Lowers cholesterol levels.", 50, 22.00, True),
            ("Metformin 500mg", "Antidiabetic", "Blood glucose management.", 200, 12.00, True),
            ("Omeprazole 20mg", "Gastrointestinal", "Reduces stomach acid secretion.", 150, 18.00, True)
        ]
        for m_name, cat, desc, qty, price, avail in meds_data:
            med = Medicine(
                pharmacy_id=pharmacy.id,
                name=m_name,
                category=cat,
                description=desc,
                stock_quantity=qty,
                unit_price=price,
                is_available=avail
            )
            db.session.add(med)

        print("[SEED] Creating Initial Queue and Token Data...")
        today = date.today()
        queue = Queue(
            hospital_id=hosp_objs[0].id,
            doctor_id=doc_objs[0].id,
            department_id=dept_objs["General Medicine"].id,
            current_token="G-23",
            total_tokens_today=27,
            active_tokens=4,
            status="ACTIVE",
            date=today
        )
        db.session.add(queue)
        db.session.flush()

        token_statuses = [
            (p_objs[1].id, 23, "G-23", "IN_PROGRESS", 0, 0, False),
            (p_objs[2].id, 24, "G-24", "WAITING", 1, 12, False),
            (p_objs[3].id, 25, "G-25", "WAITING", 2, 24, False),
            (p_objs[4].id, 26, "G-26", "WAITING", 3, 36, False),
            (p_objs[0].id, 27, "G-27", "WAITING", 4, 48, False)
        ]

        for pid, tnum, tcode, status, pos, est_wait, is_emg in token_statuses:
            qi = QueueItem(
                queue_id=queue.id,
                patient_id=pid,
                doctor_id=doc_objs[0].id,
                token_number=tnum,
                token_code=tcode,
                status=status,
                position=pos,
                estimated_wait_mins=est_wait,
                is_emergency=is_emg,
                started_at=datetime.utcnow() if status == "IN_PROGRESS" else None
            )
            db.session.add(qi)

        print("[SEED] Creating Sample Prescriptions & Medical Records...")
        rx = Prescription(
            patient_id=p_patient.id,
            doctor_id=doc_objs[0].id,
            hospital_id=hosp_objs[0].id,
            diagnosis="Acute Upper Respiratory Infection & Mild Fever",
            clinical_notes="Patient presented with cough and fever. Advised rest.",
            status="PRESCRIPTION_RECEIVED"
        )
        db.session.add(rx)
        db.session.flush()

        rx_item1 = PrescriptionItem(
            prescription_id=rx.id,
            medicine_name="Paracetamol 650mg",
            dosage="1 Tablet",
            frequency="Thrice daily (TID)",
            duration="3 days",
            instructions="Take after meals."
        )
        db.session.add(rx_item1)

        record = MedicalRecord(
            patient_id=p_patient.id,
            doctor_id=doc_objs[0].id,
            title="General Physical Evaluation",
            record_type="CONSULTATION_SUMMARY",
            notes="Vitals: BP 120/80 mmHg, Temp 99.4 F."
        )
        db.session.add(record)

        notif = Notification(
            user_id=u_patient.id,
            title="Welcome to MediSync!",
            message="Your appointment token G-27 is active.",
            notification_type="SYSTEM"
        )
        db.session.add(notif)

        db.session.commit()
        print("[SEED] Database seeding complete with @medisync.demo accounts!")

if __name__ == '__main__':
    seed_database()
