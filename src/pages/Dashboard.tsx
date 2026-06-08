import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { HeartPulse, Pill, AlertTriangle, Users, Activity, Thermometer, Droplets, ChevronRight, XCircle, ShieldCheck, ArrowRight } from 'lucide-react'
import { elderly, healthRecords } from '@/data/mockData'
import { useCareStore } from '@/store/useCareStore'
import { assessRisk, getRiskLevelConfig } from '@/lib/riskEngine'
import type { ElderlyStatus, AlertLevel, MedicationStatus } from '@/types'

const statusConfig: Record<ElderlyStatus, { label: string; color: string; bg: string; ring: string }> = {
  normal: { label: '状态良好', color: 'text-health-600', bg: 'bg-health-100', ring: 'ring-health-400' },
  warning: { label: '需要关注', color: 'text-care-600', bg: 'bg-care-100', ring: 'ring-care-400' },
  alert: { label: '紧急告警', color: 'text-danger-600', bg: 'bg-danger-100', ring: 'ring-danger-400' },
}

function getLatestRecord(type: string) {
  return healthRecords
    .filter((r) => r.type === type)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0]
}

function formatDate() {
  const now = new Date()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const w = weekDays[now.getDay()]
  return `${y}年${m}月${d}日 星期${w}`
}

export default function Dashboard() {
  const { medications, alerts, toggleMedication, resolveAlert } = useCareStore()

  const riskAssessment = useMemo(
    () => assessRisk('1', healthRecords, alerts, medications),
    [alerts, medications]
  )
  const riskCfg = getRiskLevelConfig(riskAssessment.overallRisk)

  const todayStr = new Date().toISOString().split('T')[0]
  const todayMedications = medications.filter((m) => m.date === todayStr)
  const activeMedications = todayMedications.filter((m) => m.status === 'pending' || m.status === 'missed')
  const unresolvedAlerts = alerts.filter((a) => !a.resolved)
  const todayTasks = [
    ...activeMedications.map((m) => ({ type: 'med' as const, id: m.id, title: `${m.name} ${m.dosage}`, time: m.scheduledTime, medStatus: m.status, data: m })),
    ...unresolvedAlerts.map((a) => ({ type: 'alert' as const, id: a.id, title: a.title, time: a.time.slice(11, 16), medStatus: undefined as MedicationStatus | undefined, data: a })),
  ].sort((a, b) => a.time.localeCompare(b.time))

  const bp = getLatestRecord('bloodPressure')
  const hr = getLatestRecord('heartRate')
  const bs = getLatestRecord('bloodSugar')
  const tp = getLatestRecord('temperature')

  const statusCfg = statusConfig[elderly.status]

  const healthCards = [
    { icon: Activity, label: '血压', value: bp ? `${bp.systolic}/${bp.diastolic}` : '--', unit: 'mmHg', color: 'text-care-500', bg: 'bg-care-50', border: 'border-care-200' },
    { icon: HeartPulse, label: '心率', value: hr ? `${hr.value}` : '--', unit: 'bpm', color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200' },
    { icon: Droplets, label: '血糖', value: bs ? `${bs.value}` : '--', unit: 'mmol/L', color: 'text-info-500', bg: 'bg-info-50', border: 'border-info-200' },
    { icon: Thermometer, label: '体温', value: tp ? `${tp.value}` : '--', unit: '°C', color: 'text-health-500', bg: 'bg-health-50', border: 'border-health-200' },
  ]

  const navCards = [
    { icon: HeartPulse, label: '健康数据', path: '/health', color: 'text-health-500', bg: 'bg-health-50', border: 'border-health-200' },
    { icon: Pill, label: '用药管理', path: '/medication', color: 'text-care-500', bg: 'bg-care-50', border: 'border-care-200' },
    { icon: AlertTriangle, label: '告警中心', path: '/alerts', color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200' },
    { icon: Users, label: '联系人', path: '/contacts', color: 'text-info-500', bg: 'bg-info-50', border: 'border-info-200' },
  ]

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 pb-24 animate-fade-in">
      <div className="max-w-lg mx-auto space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-800">首页概览</h1>
            <p className="text-sm text-warm-400 mt-0.5">{formatDate()}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-care-100 flex items-center justify-center">
            <span className="text-care-600 text-lg font-semibold">{elderly.name[0]}</span>
          </div>
        </header>

        <section className="bg-white rounded-2xl p-5 shadow-sm border border-warm-200/60 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-full ${statusCfg.bg} flex items-center justify-center text-2xl font-bold ${statusCfg.color}`}>
                {elderly.name[0]}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ring-[3px] ring-white ${statusCfg.ring} ${statusCfg.bg} animate-breathe`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-warm-800">{elderly.name}</h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-warm-400 mt-1">{elderly.age}岁 · {elderly.gender}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          {healthCards.map((card) => (
            <div key={card.label} className={`bg-white rounded-xl p-3 shadow-sm border ${card.border} flex flex-col items-center gap-1.5 transition-shadow hover:shadow-md`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-warm-400">{card.label}</span>
              <span className="text-lg font-bold text-warm-800 leading-tight">{card.value}</span>
              <span className="text-[10px] text-warm-300">{card.unit}</span>
            </div>
          ))}
        </section>

        <Link
          to="/risk-stratification"
          className={`block rounded-2xl p-4 shadow-sm border-2 transition-all hover:shadow-md animate-slide-up ${
            riskAssessment.overallRisk === 'low' ? 'bg-health-50 border-health-200' :
            riskAssessment.overallRisk === 'medium' ? 'bg-care-50 border-care-200' : 'bg-danger-50 border-danger-200'
          }`}
          style={{ animationDelay: '0.07s' }}
        >
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              riskAssessment.overallRisk === 'low' ? 'bg-health-100' :
              riskAssessment.overallRisk === 'medium' ? 'bg-care-100' : 'bg-danger-100'
            }`}>
              <ShieldCheck className={`w-5 h-5 ${riskCfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-warm-800">风险分层</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color}`}>
                  {riskCfg.label}
                </span>
              </div>
              <p className="text-xs text-warm-500 mt-0.5">
                综合评分 {riskAssessment.totalScore} · {riskAssessment.notificationStrategy.label} · 点击查看详情
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-warm-300 shrink-0" />
          </div>
        </Link>

        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-base font-semibold text-warm-700 mb-3">今日待办</h3>
          {todayTasks.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-warm-400 text-sm border border-warm-200/60">
              今日暂无待办事项
            </div>
          ) : (
            <div className="space-y-2.5">
              {todayTasks.map((task) => {
                if (task.type === 'med') {
                  const isMissed = task.medStatus === 'missed'
                  return (
                    <button
                      key={task.id}
                      onClick={() => toggleMedication(task.id)}
                      className={`w-full bg-white rounded-xl p-3.5 shadow-sm border border-warm-200/60 border-l-4 flex items-center gap-3 transition-all hover:shadow-md active:scale-[0.98] text-left ${isMissed ? 'border-l-danger-500' : 'border-l-care-400'}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isMissed ? 'bg-danger-50' : 'bg-care-50'}`}>
                        {isMissed ? <XCircle className="w-4.5 h-4.5 text-danger-500" /> : <Pill className="w-4.5 h-4.5 text-care-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-800 truncate">{task.title}</p>
                        <p className={`text-xs mt-0.5 ${isMissed ? 'text-danger-500 font-medium' : 'text-warm-400'}`}>
                          {task.time} · {isMissed ? '漏服，点击补记' : '点击确认服药'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0" />
                    </button>
                  )
                }
                const alertLevel = (task.data as { level: AlertLevel }).level
                return (
                  <Link
                    key={task.id}
                    to="/alerts"
                    onClick={() => resolveAlert(task.id)}
                    className="bg-white rounded-xl p-3.5 shadow-sm border border-warm-200/60 border-l-4 flex items-center gap-3 transition-all hover:shadow-md active:scale-[0.98]"
                    style={{ borderLeftColor: alertLevel === 'urgent' ? '#EF4444' : alertLevel === 'warning' ? '#FB923C' : '#60A5FA' }}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${alertLevel === 'urgent' ? 'bg-danger-50' : alertLevel === 'warning' ? 'bg-care-50' : 'bg-info-50'}`}>
                      <AlertTriangle className={`w-4.5 h-4.5 ${alertLevel === 'urgent' ? 'text-danger-500' : alertLevel === 'warning' ? 'text-care-500' : 'text-info-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-800 truncate">{task.title}</p>
                      <p className="text-xs text-warm-400 mt-0.5">{task.time} · 点击处理告警</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-base font-semibold text-warm-700 mb-3">快捷入口</h3>
          <div className="grid grid-cols-4 gap-3">
            {navCards.map((card) => (
              <Link
                key={card.path}
                to={card.path}
                className={`bg-white rounded-xl p-3 shadow-sm border ${card.border} flex flex-col items-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5`}
              >
                <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <span className="text-xs font-medium text-warm-600">{card.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
