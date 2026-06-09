import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse, Pill, AlertTriangle, Users, Activity, Thermometer, Droplets,
  ChevronRight, XCircle, ShieldCheck, ArrowRight, ClipboardList, CheckCircle2,
  Clock, AlertCircle, Stethoscope, CalendarCheck, Handshake, Zap, Bell,
  CircleDot, Timer, CalendarDays, TrendingUp,
} from 'lucide-react'
import { elderly, healthRecords, contacts } from '@/data/mockData'
import { useCareStore } from '@/store/useCareStore'
import { assessRisk, getRiskLevelConfig } from '@/lib/riskEngine'
import { deriveReminders, deriveOverdueTasks } from '@/lib/reminderEngine'
import type { ElderlyStatus, AlertLevel, MedicationStatus, CareTask, CareTaskCategory, FollowUpAppointment, Appointment } from '@/types'

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

const careCategoryIcon: Record<CareTaskCategory, typeof Activity> = {
  daily_care: HeartPulse,
  medical: Pill,
  housework: ClipboardList,
  accompany: Users,
  emotional: HeartPulse,
  finance: ClipboardList,
}

const careCategoryColor: Record<CareTaskCategory, { color: string; bg: string }> = {
  daily_care: { color: 'text-care-500', bg: 'bg-care-50' },
  medical: { color: 'text-health-500', bg: 'bg-health-50' },
  housework: { color: 'text-purple-500', bg: 'bg-purple-50' },
  accompany: { color: 'text-blue-500', bg: 'bg-blue-50' },
  emotional: { color: 'text-pink-500', bg: 'bg-pink-50' },
  finance: { color: 'text-amber-500', bg: 'bg-amber-50' },
}

function getContactName(contactId: string) {
  const c = contacts.find((x) => x.id === contactId)
  return c ? c.name : ''
}

const alertLevelConfig: Record<AlertLevel, { label: string; color: string; bg: string; border: string; iconColor: string }> = {
  urgent: { label: '紧急', color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-l-danger-500', iconColor: 'text-danger-500' },
  warning: { label: '警告', color: 'text-care-600', bg: 'bg-care-50', border: 'border-l-care-500', iconColor: 'text-care-500' },
  info: { label: '提示', color: 'text-info-600', bg: 'bg-info-50', border: 'border-l-info-500', iconColor: 'text-info-500' },
}

const medStatusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  taken: { label: '已服用', color: 'text-health-600', bg: 'bg-health-50', icon: CheckCircle2 },
  pending: { label: '待服用', color: 'text-care-600', bg: 'bg-care-50', icon: Clock },
  missed: { label: '已漏服', color: 'text-danger-600', bg: 'bg-danger-50', icon: XCircle },
}

const followUpTypeLabels: Record<string, string> = {
  chronic_disease: '慢病随访',
  post_surgery: '术后随访',
  health_checkup: '健康体检',
  medication_review: '用药评估',
  rehabilitation: '康复随访',
  mental_health: '心理随访',
}

const followUpStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: '待确认', color: 'text-blue-600', bg: 'bg-blue-50' },
  confirmed: { label: '已确认', color: 'text-health-600', bg: 'bg-health-50' },
  in_progress: { label: '进行中', color: 'text-care-600', bg: 'bg-care-50' },
  completed: { label: '已完成', color: 'text-warm-500', bg: 'bg-warm-50' },
  cancelled: { label: '已取消', color: 'text-warm-400', bg: 'bg-warm-100' },
}

const appointmentStatusConfig: Record<string, { label: string; color: string; bg: string; barColor: string }> = {
  pending: { label: '待审核', color: 'text-amber-600', bg: 'bg-amber-50', barColor: 'bg-amber-400' },
  family_pending: { label: '待确认', color: 'text-orange-600', bg: 'bg-orange-50', barColor: 'bg-orange-400' },
  family_confirmed: { label: '已确认', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-400' },
  completed: { label: '已完成', color: 'text-health-600', bg: 'bg-health-50', barColor: 'bg-health-400' },
  rejected: { label: '已拒绝', color: 'text-red-600', bg: 'bg-red-50', barColor: 'bg-red-400' },
  family_rejected: { label: '家属拒绝', color: 'text-red-600', bg: 'bg-red-50', barColor: 'bg-red-400' },
  cancelled: { label: '已取消', color: 'text-warm-400', bg: 'bg-warm-100', barColor: 'bg-warm-300' },
}

const serviceTypeIcons: Record<string, typeof Handshake> = {
  home_care: HeartPulse,
  medical_assist: Stethoscope,
  housekeeping: ClipboardList,
  accompany: Users,
  psychological: Handshake,
  emergency: Zap,
}

export default function Dashboard() {
  const { medications, alerts, careTasks, checkInRecords, taskReminders, toggleMedication, resolveAlert, appointments, followUpAppointments } = useCareStore()

  const riskAssessment = useMemo(
    () => assessRisk('1', healthRecords, alerts, medications),
    [alerts, medications]
  )
  const riskCfg = getRiskLevelConfig(riskAssessment.overallRisk)

  const todayStr = new Date().toISOString().split('T')[0]
  const todayMedications = medications.filter((m) => m.date === todayStr)
  const pendingMedications = todayMedications.filter((m) => m.status === 'pending')
  const missedMedications = todayMedications.filter((m) => m.status === 'missed')
  const takenMedications = todayMedications.filter((m) => m.status === 'taken')
  const unresolvedAlerts = alerts.filter((a) => !a.resolved)
  const urgentAlerts = unresolvedAlerts.filter((a) => a.level === 'urgent')

  const todayCareTasks = useMemo(() => {
    return careTasks.filter(
      (t) => (t.scheduledDate === todayStr && (t.status === 'pending' || t.status === 'in_progress')) || t.status === 'overdue'
    )
  }, [careTasks, todayStr])

  const overdueCareTasks = useMemo(() => {
    return deriveOverdueTasks(careTasks)
  }, [careTasks])

  const derivedReminders = useMemo(() => {
    return deriveReminders(careTasks, taskReminders)
  }, [careTasks, taskReminders])

  const activeReminders = useMemo(() => {
    return derivedReminders.filter((r) => r.status === 'active')
  }, [derivedReminders])

  const todayCompletedTasks = useMemo(() => {
    return careTasks.filter((t) => t.status === 'completed' && t.scheduledDate === todayStr)
  }, [careTasks, todayStr])

  const todayCheckIns = useMemo(() => {
    return checkInRecords.filter((r) => r.checkInAt.startsWith(todayStr))
  }, [checkInRecords, todayStr])

  const upcomingFollowUps = useMemo(() => {
    return followUpAppointments
      .filter((a) => ['scheduled', 'confirmed'].includes(a.status))
      .sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`))
  }, [followUpAppointments])

  const activeAppointments = useMemo(() => {
    return appointments
      .filter((a) => !['completed', 'cancelled', 'rejected', 'family_rejected'].includes(a.status))
      .sort((a, b) => `${a.appointmentDate}${a.appointmentTime}`.localeCompare(`${b.appointmentDate}${b.appointmentTime}`))
  }, [appointments])

  const todayAppointments = useMemo(() => {
    return appointments.filter((a) => a.appointmentDate === todayStr)
  }, [appointments, todayStr])

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

  const summaryStats = [
    { icon: ClipboardList, label: '待办', count: todayCareTasks.length, color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-200', path: '/family-care-task' },
    { icon: AlertTriangle, label: '告警', count: unresolvedAlerts.length, color: 'text-danger-600', bg: 'bg-danger-50', ring: 'ring-danger-200', path: '/alerts' },
    { icon: Pill, label: '用药', count: pendingMedications.length + missedMedications.length, color: 'text-care-600', bg: 'bg-care-50', ring: 'ring-care-200', path: '/medication' },
    { icon: Stethoscope, label: '随访', count: upcomingFollowUps.length, color: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-200', path: '/follow-up' },
    { icon: CalendarCheck, label: '服务', count: activeAppointments.length, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200', path: '/community-service' },
  ]

  return (
    <div className="min-h-screen bg-warm-50 px-6 py-6 pb-24 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-5">

        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-warm-800">今日照护中枢</h1>
            <p className="text-sm text-warm-400 mt-0.5">{formatDate()}</p>
          </div>
          <div className="flex items-center gap-3">
            {urgentAlerts.length > 0 && (
              <Link to="/alerts" className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-danger-50 border border-danger-200 text-danger-600 text-xs font-medium animate-breathe">
                <Bell className="w-3.5 h-3.5" />
                {urgentAlerts.length} 条紧急告警
              </Link>
            )}
            <div className="w-10 h-10 rounded-full bg-care-100 flex items-center justify-center">
              <span className="text-care-600 text-lg font-semibold">{elderly.name[0]}</span>
            </div>
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
            <Link
              to="/risk-stratification"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all hover:shadow-md ${
                riskAssessment.overallRisk === 'low' ? 'bg-health-50 border-health-200' :
                riskAssessment.overallRisk === 'medium' ? 'bg-care-50 border-care-200' : 'bg-danger-50 border-danger-200'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${riskCfg.color}`} />
              <span className={`text-sm font-bold ${riskCfg.color}`}>{riskCfg.label}</span>
              <span className="text-xs text-warm-500">评分 {riskAssessment.totalScore}</span>
              <ArrowRight className="w-3.5 h-3.5 text-warm-300" />
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-5 gap-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          {summaryStats.map((stat) => (
            <Link
              key={stat.label}
              to={stat.path}
              className={`bg-white rounded-xl p-4 shadow-sm border ring-1 ${stat.ring} flex flex-col items-center gap-2 transition-all hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold text-warm-800">{stat.count}</span>
              <span className="text-xs text-warm-400">{stat.label}</span>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '0.07s' }}>
          {healthCards.map((card) => (
            <div key={card.label} className={`bg-white rounded-xl p-3 shadow-sm border ${card.border} flex flex-col items-center gap-1.5 transition-shadow hover:shadow-md`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <span className="text-xs text-warm-400">{card.label}</span>
              <span className="text-lg font-bold text-warm-800 leading-tight">{card.value}</span>
              <span className="text-[10px] text-warm-300">{card.unit}</span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-3 gap-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>

          <div className="col-span-1 space-y-5">

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-warm-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-danger-500" />
                  告警中心
                </h3>
                <Link to="/alerts" className="text-xs text-care-500 flex items-center gap-0.5 hover:text-care-600">
                  查看全部 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {unresolvedAlerts.length === 0 ? (
                <div className="bg-white rounded-xl p-4 text-center text-warm-400 text-sm border border-warm-200/60">
                  <CheckCircle2 className="w-8 h-8 text-health-400 mx-auto mb-1" />
                  暂无告警
                </div>
              ) : (
                <div className="space-y-2">
                  {unresolvedAlerts.slice(0, 4).map((alert) => {
                    const cfg = alertLevelConfig[alert.level]
                    return (
                      <Link
                        key={alert.id}
                        to="/alerts"
                        onClick={() => resolveAlert(alert.id)}
                        className={`block bg-white rounded-xl p-3 shadow-sm border border-warm-200/60 border-l-4 ${cfg.border} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <AlertTriangle className={`w-4 h-4 ${cfg.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                              <span className="text-xs text-warm-400">{alert.time.slice(11, 16)}</span>
                            </div>
                            <p className="text-sm font-medium text-warm-800 mt-1 truncate">{alert.title}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-warm-700 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-care-500" />
                  今日用药
                </h3>
                <Link to="/medication" className="text-xs text-care-500 flex items-center gap-0.5 hover:text-care-600">
                  用药详情 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-warm-200/60">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-health-50">
                    <p className="text-lg font-bold text-health-600">{takenMedications.length}</p>
                    <p className="text-[10px] text-warm-400">已服</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-care-50">
                    <p className="text-lg font-bold text-care-600">{pendingMedications.length}</p>
                    <p className="text-[10px] text-warm-400">待服</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-danger-50">
                    <p className="text-lg font-bold text-danger-600">{missedMedications.length}</p>
                    <p className="text-[10px] text-warm-400">漏服</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {todayMedications
                    .filter((m) => m.status === 'pending' || m.status === 'missed')
                    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                    .slice(0, 4)
                    .map((med) => {
                      const cfg = medStatusConfig[med.status]
                      const StatusIcon = cfg.icon
                      return (
                        <button
                          key={med.id}
                          onClick={() => toggleMedication(med.id)}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-lg border border-warm-100 transition-all hover:shadow-sm active:scale-[0.98] text-left ${med.status === 'missed' ? 'bg-danger-50/50' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-warm-800 truncate">{med.name} {med.dosage}</p>
                            <p className="text-[10px] text-warm-400">{med.scheduledTime} · {med.notes}</p>
                          </div>
                          <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                        </button>
                      )
                    })}
                  {todayMedications.filter((m) => m.status === 'pending' || m.status === 'missed').length === 0 && (
                    <p className="text-xs text-center text-warm-400 py-2">待服药物已全部完成</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="col-span-2 space-y-5">

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-warm-700 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-purple-500" />
                  今日待办
                  {todayCareTasks.length > 0 && (
                    <span className="inline-flex items-center justify-center bg-purple-500 text-white text-xs rounded-full w-5 h-5 ml-1">
                      {todayCareTasks.length}
                    </span>
                  )}
                </h3>
                <Link to="/family-care-task" className="text-xs text-care-500 flex items-center gap-0.5 hover:text-care-600">
                  任务管理 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="bg-white rounded-xl p-3.5 shadow-sm border border-warm-200/60">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center p-2 rounded-lg bg-care-50">
                    <p className="text-lg font-bold text-care-600">{todayCareTasks.length}</p>
                    <p className="text-[10px] text-warm-400">待完成</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-health-50">
                    <p className="text-lg font-bold text-health-600">{todayCompletedTasks.length}</p>
                    <p className="text-[10px] text-warm-400">已完成</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-50">
                    <p className="text-lg font-bold text-blue-600">{todayCheckIns.length}</p>
                    <p className="text-[10px] text-warm-400">打卡</p>
                  </div>
                </div>

                {todayCareTasks.length === 0 ? (
                  <div className="text-center text-warm-400 text-sm py-4">
                    今日暂无待办事项
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todayCareTasks.slice(0, 5).map((task) => {
                      const isOverdue = task.status === 'overdue'
                      const catIcon = careCategoryIcon[task.category]
                      const catColor = careCategoryColor[task.category]
                      const CatIcon = catIcon
                      return (
                        <Link
                          key={task.id}
                          to="/family-care-task"
                          className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-sm ${isOverdue ? 'bg-danger-50/50 border-danger-100' : 'bg-warm-50/50 border-warm-100'}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? 'bg-danger-100' : catColor.bg}`}>
                            {isOverdue ? <AlertCircle className="w-4 h-4 text-danger-500" /> : <CatIcon className={`w-4 h-4 ${catColor.color}`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-warm-800 truncate">{task.title}</p>
                            <p className="text-[10px] text-warm-400">{task.scheduledTime} · {getContactName(task.assignedContactId)}</p>
                          </div>
                          {isOverdue ? (
                            <span className="text-[10px] font-medium text-danger-500 bg-danger-50 px-2 py-0.5 rounded">逾期</span>
                          ) : task.status === 'in_progress' ? (
                            <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded">进行中</span>
                          ) : (
                            <span className="text-[10px] font-medium text-warm-400 bg-warm-50 px-2 py-0.5 rounded">待执行</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {overdueCareTasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-danger-100">
                    <p className="text-xs font-medium text-danger-600 mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      逾期提醒
                      {activeReminders.length > 0 && (
                        <span className="inline-flex items-center justify-center bg-danger-500 text-white text-[10px] rounded-full w-4 h-4 ml-0.5">
                          {activeReminders.length}
                        </span>
                      )}
                    </p>
                    <div className="space-y-1.5">
                      {activeReminders.slice(0, 2).map((reminder) => {
                        const task = careTasks.find((t) => t.id === reminder.taskId)
                        if (!task) return null
                        return (
                          <Link
                            key={reminder.id}
                            to="/family-care-task"
                            className="flex items-center gap-2 p-2 rounded-lg bg-danger-50 border border-danger-100 transition-all hover:shadow-sm"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-danger-500 flex-shrink-0" />
                            <p className="text-xs text-warm-700 flex-1 min-w-0 truncate">{task.title}</p>
                            <span className="text-[10px] text-danger-500 flex-shrink-0">{reminder.message.slice(0, 20)}…</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-warm-700 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-500" />
                  随访计划
                </h3>
                <Link to="/follow-up" className="text-xs text-care-500 flex items-center gap-0.5 hover:text-care-600">
                  全部随访 <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {upcomingFollowUps.length === 0 ? (
                <div className="bg-white rounded-xl p-4 text-center text-warm-400 text-sm border border-warm-200/60">
                  <CheckCircle2 className="w-8 h-8 text-health-400 mx-auto mb-1" />
                  暂无待执行随访
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingFollowUps.map((fu) => {
                    const statusCfg = followUpStatusConfig[fu.status] || followUpStatusConfig.scheduled
                    const typeLabel = followUpTypeLabels[fu.followUpType] || fu.followUpType
                    return (
                      <Link
                        key={fu.id}
                        to="/follow-up"
                        className="block bg-white rounded-xl p-3.5 shadow-sm border border-warm-200/60 transition-all hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="w-5 h-5 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-warm-800">{fu.doctorName} · {typeLabel}</span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
                            </div>
                            <p className="text-xs text-warm-400 mt-0.5">
                              {fu.scheduledDate} {fu.scheduledTime} · {fu.location}
                            </p>
                            {fu.symptoms && (
                              <p className="text-xs text-warm-500 mt-0.5 truncate">{fu.symptoms}</p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-warm-300 flex-shrink-0" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        <section className="animate-slide-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-warm-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              服务进度
            </h3>
            <Link to="/community-service" className="text-xs text-care-500 flex items-center gap-0.5 hover:text-care-600">
              服务管理 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {activeAppointments.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center text-warm-400 text-sm border border-warm-200/60">
              暂无进行中的服务
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-warm-200/60 overflow-hidden">
              <div className="grid grid-cols-12 gap-0 px-4 py-2.5 bg-warm-50 border-b border-warm-200/60 text-xs font-medium text-warm-500">
                <div className="col-span-4">服务项目</div>
                <div className="col-span-2">时间</div>
                <div className="col-span-2">申请人</div>
                <div className="col-span-2">状态</div>
                <div className="col-span-2">进度</div>
              </div>
              <div className="divide-y divide-warm-100">
                {activeAppointments.map((apt) => {
                  const statusCfg = appointmentStatusConfig[apt.status] || appointmentStatusConfig.pending
                  const ServiceIcon = serviceTypeIcons[apt.serviceType] || CalendarCheck
                  const isToday = apt.appointmentDate === todayStr
                  const progressMap: Record<string, number> = {
                    pending: 20,
                    family_pending: 45,
                    family_confirmed: 70,
                  }
                  const progress = progressMap[apt.status] || 30
                  return (
                    <Link
                      key={apt.id}
                      to="/community-service"
                      className="grid grid-cols-12 gap-0 px-4 py-3 items-center hover:bg-warm-50/50 transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg ${isToday ? 'bg-care-50' : 'bg-warm-50'} flex items-center justify-center flex-shrink-0`}>
                          <ServiceIcon className={`w-4 h-4 ${isToday ? 'text-care-500' : 'text-warm-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-warm-800 truncate">{apt.title}</p>
                          <p className="text-[10px] text-warm-400">{apt.address}</p>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <p className={`text-xs ${isToday ? 'text-care-600 font-medium' : 'text-warm-500'}`}>
                          {isToday ? '今日' : apt.appointmentDate.slice(5)} {apt.appointmentTime}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-warm-600">{apt.applicantName}</p>
                      </div>
                      <div className="col-span-2">
                        <span className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${statusCfg.barColor}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-warm-400">{progress}%</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="px-4 py-2.5 bg-warm-50 border-t border-warm-200/60">
                <div className="flex items-center justify-between text-xs text-warm-500">
                  <span>今日服务 {todayAppointments.length} 项 · 进行中 {activeAppointments.length} 项</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />待审核</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />待确认</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />已确认</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-base font-semibold text-warm-700 mb-3">快捷入口</h3>
          <div className="grid grid-cols-6 gap-3">
            {[
              { icon: HeartPulse, label: '健康数据', path: '/health', color: 'text-health-500', bg: 'bg-health-50', border: 'border-health-200' },
              { icon: Pill, label: '用药管理', path: '/medication', color: 'text-care-500', bg: 'bg-care-50', border: 'border-care-200' },
              { icon: AlertTriangle, label: '告警中心', path: '/alerts', color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200' },
              { icon: CalendarDays, label: '照护排班', path: '/schedule', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
              { icon: Stethoscope, label: '家庭医生', path: '/follow-up', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
              { icon: Users, label: '联系人', path: '/contacts', color: 'text-info-500', bg: 'bg-info-50', border: 'border-info-200' },
            ].map((card) => (
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
