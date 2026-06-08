import { Pill, CheckCircle2, Clock, XCircle, Calendar } from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import type { MedicationStatus } from '@/types'

const statusConfig: Record<MedicationStatus, { icon: typeof CheckCircle2; label: string; nodeColor: string; badgeColor: string; badgeText: string }> = {
  taken: {
    icon: CheckCircle2,
    label: '已服药',
    nodeColor: 'bg-health-500 border-health-500',
    badgeColor: 'bg-health-50 text-health-600',
    badgeText: '已服',
  },
  pending: {
    icon: Clock,
    label: '待服药',
    nodeColor: 'bg-warm-300 border-warm-300',
    badgeColor: 'bg-warm-100 text-warm-600',
    badgeText: '待服',
  },
  missed: {
    icon: XCircle,
    label: '漏服',
    nodeColor: 'bg-danger-500 border-danger-500',
    badgeColor: 'bg-danger-50 text-danger-600',
    badgeText: '漏服',
  },
}

export default function MedicationPage() {
  const medications = useCareStore((s) => s.medications)
  const toggleMedication = useCareStore((s) => s.toggleMedication)

  const takenCount = medications.filter((m) => m.status === 'taken').length
  const pendingCount = medications.filter((m) => m.status === 'pending').length
  const missedCount = medications.filter((m) => m.status === 'missed').length

  const sortedMedications = [...medications].sort((a, b) =>
    a.scheduledTime.localeCompare(b.scheduledTime)
  )

  const stats = [
    { icon: CheckCircle2, count: takenCount, label: '已服药', color: 'text-health-500', bg: 'bg-health-50', border: 'border-health-100' },
    { icon: Clock, count: pendingCount, label: '待服药', color: 'text-warm-400', bg: 'bg-warm-50', border: 'border-warm-100' },
    { icon: XCircle, count: missedCount, label: '漏服', color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-100' },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-warm-900 flex items-center gap-2">
          <Pill className="w-7 h-7 text-care-500" />
          用药提醒
        </h1>
        <p className="text-warm-500 mt-1">管理老人每日用药计划</p>
      </div>

      <div className="grid grid-cols-3 gap-4 animate-slide-up">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`${stat.bg} ${stat.border} border rounded-2xl p-5 flex items-center gap-4 transition-shadow duration-300 hover:shadow-md`}
          >
            <div className={`w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-warm-900 leading-none">{stat.count}</p>
              <p className="text-sm text-warm-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="animate-slide-up">
        <h2 className="text-lg font-semibold text-warm-800 mb-5 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-care-500" />
          今日用药时间线
        </h2>
        <div className="relative pl-8">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-warm-200" />
          <div className="space-y-4">
            {sortedMedications.map((med) => {
              const config = statusConfig[med.status]
              const StatusIcon = config.icon
              return (
                <div key={med.id} className="relative animate-fade-in">
                  <div
                    className={`absolute -left-8 top-4 w-[22px] h-[22px] rounded-full border-[3px] border-white ${config.nodeColor} z-10 shadow-sm`}
                  />
                  <div
                    onClick={() => toggleMedication(med.id)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-warm-100 cursor-pointer transition-all duration-300 hover:shadow-md hover:border-care-200 active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-warm-900 text-[15px]">{med.name}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${config.badgeColor}`}>
                            {config.badgeText}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-warm-500">
                          <span className="flex items-center gap-1">
                            <Pill className="w-3.5 h-3.5" />
                            {med.dosage}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {med.scheduledTime}
                          </span>
                        </div>
                        {med.notes && (
                          <p className="text-xs text-warm-400 mt-2 leading-relaxed">{med.notes}</p>
                        )}
                      </div>
                      <StatusIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${med.status === 'taken' ? 'text-health-500' : med.status === 'missed' ? 'text-danger-500' : 'text-warm-300'}`} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="animate-slide-up">
        <h2 className="text-lg font-semibold text-warm-800 mb-5 flex items-center gap-2">
          <Pill className="w-5 h-5 text-care-500" />
          药物总览
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {medications.map((med) => (
            <div
              key={med.id}
              className="bg-gradient-to-br from-warm-50 to-care-50 rounded-2xl p-5 border border-warm-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-care-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-care-500/10 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-care-500" />
                </div>
                <div>
                  <p className="font-semibold text-warm-900 text-[15px]">{med.name}</p>
                  <p className="text-xs text-warm-500">{med.dosage}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-warm-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {med.frequency}
                </span>
                <span className="text-warm-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  下次 {med.scheduledTime}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
