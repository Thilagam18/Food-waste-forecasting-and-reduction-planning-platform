export type Role = 'PATIENT' | 'DOCTOR' | 'HOSPITAL_ADMIN' | 'PHARMACY';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: Role;
  created_at?: string;
  patient_id?: number;
  doctor_id?: number;
  hospital_id?: number;
  pharmacy_id?: number;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  icon_name?: string;
}

export interface Doctor {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  hospital_id: number;
  hospital_name?: string;
  department_id: number;
  department: Department;
  qualification: string;
  specialization: string;
  experience_years: number;
  avg_consultation_time_mins: number;
  is_available: boolean;
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  operating_hours: string;
  departments: Department[];
  doctors_count: number;
  distance_km?: number;
  total_queue_waiting?: number;
  estimated_wait_mins?: number;
  doctors?: Doctor[];
}

export type QueueItemStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EMERGENCY';

export interface QueueItem {
  id: number;
  queue_id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  token_number: number;
  token_code: string;
  status: QueueItemStatus;
  position: number;
  estimated_wait_mins: number;
  is_emergency: boolean;
  booked_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Queue {
  id: number;
  hospital_id: number;
  hospital_name?: string;
  doctor_id: number;
  doctor_name?: string;
  department_id: number;
  department?: Department;
  current_token: string;
  total_tokens_today: number;
  active_tokens: number;
  waiting_patients_count: number;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  date: string;
}

export interface PrescriptionItem {
  id?: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  patient_name: string;
  doctor_id: number;
  doctor_name: string;
  hospital_id: number;
  hospital_name: string;
  diagnosis: string;
  clinical_notes?: string;
  status: 'PRESCRIPTION_RECEIVED' | 'PREPARING' | 'READY' | 'COMPLETED';
  created_at: string;
  items: PrescriptionItem[];
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  doctor_id?: number;
  doctor_name: string;
  title: string;
  record_type: string;
  notes: string;
  record_date: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

export interface Medicine {
  id: number;
  pharmacy_id: number;
  name: string;
  category?: string;
  description?: string;
  stock_quantity: number;
  unit_price: number;
  is_available: boolean;
}

export interface AIAnalysis {
  category: string;
  confidence: number;
  reasoning: string;
  disclaimer: string;
}

export interface AIRecommendation {
  recommended_hospital_id: number;
  recommended_hospital_name: string;
  match_score: number;
  reasoning: string[];
  disclaimer: string;
}
