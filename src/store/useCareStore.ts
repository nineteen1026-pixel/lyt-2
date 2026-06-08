import { create } from 'zustand'
import type { Alert, Medication, Appointment, AppointmentStatus } from '@/types'
import { alerts as mockAlerts, medications as mockMedications, appointments as mockAppointments } from '@/data/mockData'

interface CareStore {
  alerts: Alert[]
  medications: Medication[]
  appointments: Appointment[]
  resolveAlert: (id: string) => void
  toggleMedication: (id: string) => void
  approveAppointment: (id: string) => void
  rejectAppointment: (id: string, reason: string) => void
  familyConfirmAppointment: (id: string) => void
  familyRejectAppointment: (id: string, reason: string) => void
  completeAppointment: (id: string) => void
  cancelAppointment: (id: string) => void
  addAppointment: (appointment: Appointment) => void
}

export const useCareStore = create<CareStore>((set) => ({
  alerts: mockAlerts,
  medications: mockMedications,
  appointments: mockAppointments,
  resolveAlert: (id: string) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    })),
  toggleMedication: (id: string) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'taken' ? 'pending' : 'taken' }
          : m
      ),
    })),
  approveAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status: 'family_pending' as AppointmentStatus } : a
      ),
    })),
  rejectAppointment: (id: string, reason: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status: 'rejected' as AppointmentStatus, rejectReason: reason } : a
      ),
    })),
  familyConfirmAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'family_confirmed' as AppointmentStatus,
              familyConfirmed: true,
              familyConfirmTime: new Date().toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\//g, '-'),
            }
          : a
      ),
    })),
  familyRejectAppointment: (id: string, reason: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id
          ? {
              ...a,
              status: 'family_rejected' as AppointmentStatus,
              familyConfirmed: false,
              rejectReason: reason,
            }
          : a
      ),
    })),
  completeAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status: 'completed' as AppointmentStatus } : a
      ),
    })),
  cancelAppointment: (id: string) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a
      ),
    })),
  addAppointment: (appointment: Appointment) =>
    set((state) => ({
      appointments: [appointment, ...state.appointments],
    })),
}))
