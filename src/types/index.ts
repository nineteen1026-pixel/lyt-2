export type ElderlyStatus = 'normal' | 'warning' | 'alert'

export interface Elderly {
  id: string
  name: string
  age: number
  gender: string
  status: ElderlyStatus
  avatar: string
}

export type HealthMetricType = 'bloodPressure' | 'heartRate' | 'bloodSugar' | 'temperature'

export interface HealthRecord {
  id: string
  elderlyId: string
  type: HealthMetricType
  value: number
  systolic?: number
  diastolic?: number
  unit: string
  date: string
  time: string
}

export type MedicationStatus = 'taken' | 'pending' | 'missed'

export interface Medication {
  id: string
  elderlyId: string
  name: string
  dosage: string
  frequency: string
  scheduledTime: string
  status: MedicationStatus
  notes: string
}

export type AlertLevel = 'urgent' | 'warning' | 'info'

export interface Alert {
  id: string
  elderlyId: string
  level: AlertLevel
  title: string
  description: string
  time: string
  resolved: boolean
}

export interface Contact {
  id: string
  elderlyId: string
  name: string
  relationship: string
  phone: string
  isEmergency: boolean
  avatar: string
}
