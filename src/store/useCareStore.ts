import { create } from 'zustand'
import type { Alert, Medication } from '@/types'
import { alerts as mockAlerts, medications as mockMedications } from '@/data/mockData'

interface CareStore {
  alerts: Alert[]
  medications: Medication[]
  resolveAlert: (id: string) => void
  toggleMedication: (id: string) => void
}

export const useCareStore = create<CareStore>((set) => ({
  alerts: mockAlerts,
  medications: mockMedications,
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
}))
