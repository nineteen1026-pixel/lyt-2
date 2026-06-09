import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Heart,
  Droplets,
  Pill,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Stethoscope,
  Clock,
  Plus,
  X,
  Eye,
} from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import { healthRecords } from '@/data/mockData'
import type { FollowUpType, SuggestionCategory, SuggestionPriority } from '@/types'

const FLOW_STEPS = [
  { key: 'monitor', label: '健康监测', icon: Activity, desc: '持续监测慢病指标' },
  { key: 'visit', label: '复诊就诊', icon: Stethoscope, desc: '按期复诊评估病情' },
  { key: 'adjust', label: '用药调整', icon: Pill, desc: '根据诊断调整方案' },
  { key: 'advise', label: '医嘱执行', icon: Lightbulb, desc: '落实医生健康建议' },
  { key: 'followup', label: '下次随访', icon: CalendarClock, desc: '规划下次复诊时间' },
]

type TabKey = 'overview' | 'adjustments' | 'suggestions' | 'upcoming'

const TABS: { key: TabKey; label: string; icon: typeof Activity }[] = [
  { key: 'overview', label: '慢病概览', icon: Activity },
  { key: 'adjustments', label: '用药调整', icon: Pill },
  { key: 'suggestions', label: '医嘱建议', icon: Lightbulb },
  { key: 'upcoming', label: '随访计划', icon: CalendarClock },
]

const chronicMetrics = [
  { type: 'bloodPressure' as const, label: '血压', icon: Heart, unit: 'mmHg', color: 'text-care-500', bg: 'bg-care-50', border: 'border-care-200' },
  { type: 'bloodSugar' as const, label: '血糖', icon: Droplets, unit: 'mmol/L', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  { type: 'heartRate' as const, label: '心率', icon: Activity, unit: 'bpm', color: 'text-danger-500', bg: 'bg-danger-50', border: 'border-danger-200' },
]

const suggestionCategoryConfig: Record<SuggestionCategory, { label: string; icon: typeof Pill; color: string; bg: string }> = {
  diet: { label: '饮食', icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
  exercise: { label: '运动', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-100' },
  medication: { label: '用药', icon: Pill, color: 'text-blue-600', bg: 'bg-blue-100' },
  lifestyle: { label: '生活方式', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
  monitoring: { label: '监测', icon: Eye, color: 'text-care-600', bg: 'bg-care-100' },
  mental_health: { label: '心理', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
}

const priorityConfig: Record<SuggestionPriority, { label: string; badge: string }> = {
  high: { label: '重要', badge: 'bg-red-100 text-red-600' },
  medium: { label: '一般', badge: 'bg-amber-100 text-amber-600' },
  low: { label: '建议', badge: 'bg-blue-100 text-blue-600' },
}

const followUpTypeConfig: Record<FollowUpType, { label: string; color: string; bg: string }> = {
  chronic_disease: { label: '慢病随访', color: 'text-care-500', bg: 'bg-care-100' },
  post_surgery: { label: '术后随访', color: 'text-purple-500', bg: 'bg-purple-100' },
  health_checkup: { label: '健康体检', color: 'text-health-500', bg: 'bg-health-100' },
  medication_review: { label: '用药评估', color: 'text-blue-500', bg: 'bg-blue-100' },
  rehabilitation: { label: '康复随访', color: 'text-amber-500', bg: 'bg-amber-100' },
  mental_health: { label: '心理随访', color: 'text-pink-500', bg: 'bg-pink-100' },
}

type SuggestionFilter = 'all' | 'active' | 'completed'
const suggestionFilterTabs: { key: SuggestionFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

function getStatusForMetric(type: string, value: number, systolic?: number, diastolic?: number): 'normal' | 'high' | 'low' {
  if (type === 'bloodPressure') {
    if ((systolic ?? 0) > 140 || (diastolic ?? 0) > 90) return 'high'
    if ((systolic ?? 0) < 90 || (diastolic ?? 0) < 60) return 'low'
    return 'normal'
  }
  if (type === 'heartRate') {
    if (value > 100) return 'high'
    if (value < 60) return 'low'
    return 'normal'
  }
  if (type === 'bloodSugar') {
    if (value > 6.1) return 'high'
    if (value < 3.9) return 'low'
    return 'normal'
  }
  return 'normal'
}

const statusLabelMap: Record<string, { label: string; cls: string }> = {
  normal: { label: '正常', cls: 'bg-health-100 text-health-600' },
  high: { label: '偏高', cls: 'bg-danger-100 text-danger-600' },
  low: { label: '偏低', cls: 'bg-blue-100 text-blue-500' },
}

function getTrend(records: { value: number; date: string }[]): 'up' | 'down' | 'stable' {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-14)
  if (recent.length < 3) return 'stable'
  const half = Math.floor(recent.length / 2)
  const firstHalf = recent.slice(0, half)
  const secondHalf = recent.slice(half)
  const avgFirst = firstHalf.reduce((s, r) => s + r.value, 0) / firstHalf.length
  const avgSecond = secondHalf.reduce((s, r) => s + r.value, 0) / secondHalf.length
  const diff = avgSecond - avgFirst
  const avg = (avgFirst + avgSecond) / 2
  if (avg === 0) return 'stable'
  if (Math.abs(diff / avg) < 0.03) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

export default function ChronicFollowUp() {
  const {
    followUpAppointments,
    followUpRecords,
    doctorSuggestions,
    addFollowUpAppointment,
    confirmFollowUpAppointment,
    cancelFollowUpAppointment,
    completeSuggestion,
  } = useCareStore()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [sgstFilter, setSgstFilter] = useState<SuggestionFilter>('all')
  const [expandedAdjustId, setExpandedAdjustId] = useState<string | null>(null)
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    followUpType: '' as FollowUpType | '',
    scheduledDate: '',
    scheduledTime: '',
    symptoms: '',
    notes: '',
  })

  const latestVitals = useMemo(() => {
    const result: Record<string, { value: string; status: 'normal' | 'high' | 'low'; systolic?: number; diastolic?: number; rawValue: number }> = {}
    for (const metric of chronicMetrics) {
      const records = healthRecords
        .filter(r => r.type === metric.type)
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
      const latest = records[0]
      if (!latest) continue
      if (metric.type === 'bloodPressure') {
        const status = getStatusForMetric('bloodPressure', 0, latest.systolic, latest.diastolic)
        result[metric.type] = {
          value: `${latest.systolic}/${latest.diastolic}`,
          status,
          systolic: latest.systolic,
          diastolic: latest.diastolic,
          rawValue: latest.systolic ?? 0,
        }
      } else {
        const status = getStatusForMetric(metric.type, latest.value)
        result[metric.type] = {
          value: `${latest.value}`,
          status,
          rawValue: latest.value,
        }
      }
    }
    return result
  }, [])

  const trends = useMemo(() => {
    const result: Record<string, 'up' | 'down' | 'stable'> = {}
    for (const metric of chronicMetrics) {
      const records = healthRecords
        .filter(r => r.type === metric.type)
        .map(r => ({ value: metric.type === 'bloodPressure' ? (r.systolic ?? r.value) : r.value, date: r.date }))
      result[metric.type] = getTrend(records)
    }
    return result
  }, [])

  const chronicRecords = useMemo(() => {
    return followUpRecords
      .filter(r => r.followUpType === 'chronic_disease' || r.followUpType === 'medication_review')
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
  }, [followUpRecords])

  const chronicSuggestions = useMemo(() => {
    const filtered = doctorSuggestions.filter(s =>
      s.category === 'medication' || s.category === 'monitoring' || s.category === 'diet'
    )
    switch (sgstFilter) {
      case 'active':
        return filtered.filter(s => s.isActive)
      case 'completed':
        return filtered.filter(s => !s.isActive)
      default:
        return filtered
    }
  }, [doctorSuggestions, sgstFilter])

  const upcomingAppointments = useMemo(() => {
    return followUpAppointments
      .filter(a => ['scheduled', 'confirmed'].includes(a.status) &&
        (a.followUpType === 'chronic_disease' || a.followUpType === 'medication_review'))
      .sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`))
  }, [followUpAppointments])

  const nextFollowUpDate = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const appointmentDates = upcomingAppointments.map(a => a.scheduledDate)
    const recordDates = chronicRecords
      .map(r => r.nextFollowUpDate)
      .filter((d): d is string => !!d && d >= today)
    const allDates = [...appointmentDates, ...recordDates]
      .filter(d => d >= today)
      .sort()
    return allDates[0] || null
  }, [chronicRecords, upcomingAppointments])

  const flowStatus = useMemo(() => {
    const hasActiveSuggestions = doctorSuggestions.some(s => s.isActive)
    const hasUpcoming = upcomingAppointments.length > 0
    return {
      monitor: true,
      visit: chronicRecords.length > 0,
      adjust: chronicRecords.some(r => r.medicationAdjustments),
      advise: hasActiveSuggestions,
      followup: hasUpcoming,
    }
  }, [chronicRecords, doctorSuggestions, upcomingAppointments])

  const stats = useMemo(() => {
    const completedVisits = chronicRecords.length
    const activeSuggestions = doctorSuggestions.filter(s => s.isActive && ['medication', 'monitoring', 'diet'].includes(s.category)).length
    const upcomingCount = upcomingAppointments.length
    const adjustmentCount = chronicRecords.filter(r => r.medicationAdjustments).length
    return { completedVisits, activeSuggestions, upcomingCount, adjustmentCount }
  }, [chronicRecords, doctorSuggestions, upcomingAppointments])

  const handleSubmitAppointment = () => {
    if (!form.followUpType || !form.scheduledDate || !form.scheduledTime) return
    const newAppointment = {
      id: `fu${Date.now()}`,
      elderlyId: '1',
      doctorId: 'c6',
      doctorName: '陈医生',
      doctorTitle: '全科主治医师',
      followUpType: form.followUpType as FollowUpType,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      status: 'scheduled' as const,
      location: '社区卫生服务中心 2楼诊室',
      symptoms: form.symptoms,
      notes: form.notes,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-'),
    }
    addFollowUpAppointment(newAppointment)
    setForm({ followUpType: '', scheduledDate: '', scheduledTime: '', symptoms: '', notes: '' })
    setShowForm(false)
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-danger-500" />
    if (trend === 'down') return <TrendingDown size={14} className="text-health-500" />
    return <Minus size={14} className="text-warm-400" />
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-warm-900">慢病复诊管理</h1>
              <p className="mt-1 text-sm text-warm-500">串联健康记录、用药调整、医生建议与随访计划</p>
            </div>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-xl bg-care-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-care-600 active:scale-95"
              >
                <Plus size={16} />
                新增预约
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2.5">
            <div className="rounded-xl bg-white p-3 shadow-sm border border-care-200 animate-slide-up">
              <p className="text-[11px] text-warm-500 mb-0.5">复诊次数</p>
              <p className="text-xl font-bold text-care-600">{stats.completedVisits}</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm border border-blue-200 animate-slide-up" style={{ animationDelay: '60ms' }}>
              <p className="text-[11px] text-warm-500 mb-0.5">用药调整</p>
              <p className="text-xl font-bold text-blue-500">{stats.adjustmentCount}</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm border border-amber-200 animate-slide-up" style={{ animationDelay: '120ms' }}>
              <p className="text-[11px] text-warm-500 mb-0.5">待执行建议</p>
              <p className="text-xl font-bold text-amber-500">{stats.activeSuggestions}</p>
            </div>
            <div className="rounded-xl bg-white p-3 shadow-sm border border-emerald-200 animate-slide-up" style={{ animationDelay: '180ms' }}>
              <p className="text-[11px] text-warm-500 mb-0.5">待就诊</p>
              <p className="text-xl font-bold text-emerald-500">{stats.upcomingCount}</p>
            </div>
          </div>
        </header>

        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-warm-200 animate-slide-up">
          <p className="text-xs font-medium text-warm-500 mb-3">复诊闭环流程</p>
          <div className="flex items-center justify-between">
            {FLOW_STEPS.map((step, i) => {
              const StepIcon = step.icon
              const active = flowStatus[step.key as keyof typeof flowStatus]
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active ? 'bg-care-500 shadow-md shadow-care-500/30' : 'bg-warm-100'}`}>
                      <StepIcon size={18} className={active ? 'text-white' : 'text-warm-300'} />
                    </div>
                    <span className={`text-[10px] font-medium ${active ? 'text-warm-800' : 'text-warm-400'}`}>{step.label}</span>
                  </div>
                  {i < FLOW_STEPS.length - 1 && (
                    <ArrowRight size={14} className="text-warm-300 mx-0.5 -mt-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-6 flex gap-1 rounded-full bg-warm-200/60 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-500 hover:text-warm-700'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="animate-fade-in space-y-4">
            <div className="space-y-3">
              {chronicMetrics.map((metric, i) => {
                const MetricIcon = metric.icon
                const vital = latestVitals[metric.type]
                if (!vital) return null
                const statusInfo = statusLabelMap[vital.status]
                const trend = trends[metric.type]
                return (
                  <div
                    key={metric.type}
                    className={`rounded-xl bg-white shadow-sm border ${metric.border} p-4 animate-slide-up`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center`}>
                          <MetricIcon size={20} className={metric.color} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-warm-800">{metric.label}</p>
                          <p className="text-xs text-warm-400">最新监测值</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-2xl font-bold text-warm-900">{vital.value}</span>
                          <span className="text-xs text-warm-400">{metric.unit}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>
                            {statusInfo.label}
                          </span>
                          <span className="flex items-center gap-0.5 text-[11px] text-warm-400">
                            趋势
                            <TrendIcon trend={trend} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link
              to="/health"
              className="flex items-center justify-between rounded-xl bg-warm-50 border border-warm-200 p-3.5 hover:bg-warm-100 transition-colors animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center gap-2.5">
                <Activity size={16} className="text-care-500" />
                <span className="text-sm font-medium text-warm-700">查看完整健康记录</span>
              </div>
              <ArrowRight size={16} className="text-warm-300" />
            </Link>

            {nextFollowUpDate && (() => {
              const today = new Date()
              const target = new Date(nextFollowUpDate)
              const daysLeft = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              const hasScheduledAppointment = upcomingAppointments.some(a => a.scheduledDate === nextFollowUpDate)
              const isUrgent = daysLeft >= 0 && daysLeft <= 3
              return (
                <div className={`rounded-xl border p-4 animate-slide-up ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-care-50 border-care-200'}`} style={{ animationDelay: '260ms' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarClock size={16} className={isUrgent ? 'text-red-600' : 'text-care-600'} />
                    <span className={`text-sm font-semibold ${isUrgent ? 'text-red-700' : 'text-care-700'}`}>下次复诊提醒</span>
                    {isUrgent && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">即将就诊</span>
                    )}
                  </div>
                  <p className={`text-lg font-bold ${isUrgent ? 'text-red-800' : 'text-care-800'}`}>{nextFollowUpDate}</p>
                  <p className={`text-xs mt-1 ${isUrgent ? 'text-red-600' : 'text-care-600'}`}>
                    {daysLeft >= 0
                      ? `距就诊还有${daysLeft}天${hasScheduledAppointment ? '，已预约请按时前往' : '，请尽快确认预约'}`
                      : '复诊日期已过，请尽快联系医生'}
                  </p>
                  <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${isUrgent ? 'text-red-600 hover:text-red-700' : 'text-care-600 hover:text-care-700'}`}
                  >
                    查看随访计划
                    <ArrowRight size={12} />
                  </button>
                </div>
              )
            })()}

            {chronicRecords.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border border-warm-200 p-4 animate-slide-up" style={{ animationDelay: '320ms' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-warm-600" />
                    <span className="text-sm font-semibold text-warm-700">最近复诊记录</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('adjustments')}
                    className="text-xs text-care-500 hover:text-care-600 flex items-center gap-0.5"
                  >
                    查看全部
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {chronicRecords.slice(0, 2).map((rec) => {
                    const typeCfg = followUpTypeConfig[rec.followUpType]
                    return (
                      <div key={rec.id} className="rounded-lg bg-warm-50 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                              {typeCfg.label}
                            </span>
                            <span className="text-xs text-warm-500">{rec.visitDate}</span>
                          </div>
                          <span className="text-xs text-warm-400">{rec.doctorName}</span>
                        </div>
                        <p className="text-xs text-warm-600 line-clamp-2">{rec.diagnosis}</p>
                        {rec.medicationAdjustments && (
                          <div className="mt-1.5 flex items-start gap-1.5">
                            <Pill size={12} className="text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-600 line-clamp-1">{rec.medicationAdjustments}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {doctorSuggestions.filter(s => s.isActive && ['medication', 'monitoring', 'diet'].includes(s.category)).length > 0 && (
              <div className="rounded-xl bg-white shadow-sm border border-warm-200 p-4 animate-slide-up" style={{ animationDelay: '380ms' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={16} className="text-amber-500" />
                    <span className="text-sm font-semibold text-warm-700">待执行医嘱</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('suggestions')}
                    className="text-xs text-care-500 hover:text-care-600 flex items-center gap-0.5"
                  >
                    查看全部
                    <ArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-2">
                  {doctorSuggestions
                    .filter(s => s.isActive && ['medication', 'monitoring', 'diet'].includes(s.category))
                    .slice(0, 3)
                    .map((sgst) => {
                      const catCfg = suggestionCategoryConfig[sgst.category]
                      const priCfg = priorityConfig[sgst.priority]
                      return (
                        <div key={sgst.id} className="flex items-start gap-2.5 rounded-lg bg-warm-50 p-2.5">
                          <div className={`w-7 h-7 rounded-lg ${catCfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                            <catCfg.icon size={13} className={catCfg.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-warm-800">{sgst.title}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priCfg.badge}`}>
                                {priCfg.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-warm-500 line-clamp-1">{sgst.content}</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'adjustments' && (
          <div className="animate-fade-in">
            {chronicRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <Pill size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无用药调整记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chronicRecords.map((rec, i) => {
                  const isExpanded = expandedAdjustId === rec.id
                  const typeCfg = followUpTypeConfig[rec.followUpType]
                  return (
                    <div
                      key={rec.id}
                      className="rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedAdjustId(isExpanded ? null : rec.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                                {typeCfg.label}
                              </span>
                              <span className="text-xs text-warm-400">{rec.visitDate}</span>
                              <span className="text-xs text-warm-400">· {rec.doctorName}</span>
                            </div>
                            {rec.medicationAdjustments ? (
                              <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                                <Pill size={14} className="text-blue-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-blue-700 font-medium">{rec.medicationAdjustments}</p>
                              </div>
                            ) : (
                              <p className="text-xs text-warm-400">本次无用药调整</p>
                            )}
                          </div>
                          <div className="shrink-0 text-warm-400 mt-1 ml-2">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-warm-100 px-4 pb-4 pt-3 animate-fade-in space-y-3">
                          <div>
                            <p className="text-xs font-medium text-warm-700 mb-1.5">诊断结论</p>
                            <p className="text-sm text-warm-800 bg-warm-50 rounded-lg p-3">{rec.diagnosis}</p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-warm-700 mb-1.5">体征数据</p>
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(rec.vitalSigns).map(([key, value]) => {
                                if (value === undefined) return null
                                const labels: Record<string, string> = {
                                  bloodPressure: '血压', heartRate: '心率', bloodSugar: '血糖',
                                  temperature: '体温', weight: '体重',
                                }
                                const units: Record<string, string> = {
                                  bloodPressure: 'mmHg', heartRate: 'bpm', bloodSugar: 'mmol/L',
                                  temperature: '°C', weight: 'kg',
                                }
                                return (
                                  <div key={key} className="rounded-lg bg-warm-50 p-2.5">
                                    <p className="text-[11px] text-warm-500 mb-0.5">{labels[key]}</p>
                                    <p className="text-sm font-semibold text-warm-800">
                                      {value}
                                      <span className="text-[11px] font-normal text-warm-400 ml-0.5">{units[key]}</span>
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="flex gap-4 text-sm">
                            {rec.nextFollowUpDate && (
                              <div className="flex gap-2">
                                <span className="text-warm-400">下次随访</span>
                                <span className="text-care-600 font-medium">{rec.nextFollowUpDate}</span>
                              </div>
                            )}
                            {rec.notes && (
                              <div className="flex gap-2">
                                <span className="text-warm-400">备注</span>
                                <span className="text-warm-700">{rec.notes}</span>
                              </div>
                            )}
                          </div>

                          {(() => {
                            const linkedSuggestions = doctorSuggestions.filter(s => s.recordId === rec.id)
                            if (linkedSuggestions.length === 0) return null
                            return (
                              <div>
                                <p className="text-xs font-medium text-warm-700 mb-1.5">关联医嘱建议</p>
                                <div className="space-y-1.5">
                                  {linkedSuggestions.map((sgst) => {
                                    const catCfg = suggestionCategoryConfig[sgst.category]
                                    return (
                                      <div key={sgst.id} className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 p-2">
                                        <catCfg.icon size={12} className={catCfg.color} />
                                        <span className="text-xs text-warm-700 flex-1">{sgst.title}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${sgst.isActive ? 'bg-care-100 text-care-600' : 'bg-warm-100 text-warm-400'}`}>
                                          {sgst.isActive ? '进行中' : '已完成'}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="animate-fade-in">
            <div className="mb-4 flex gap-2">
              {suggestionFilterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSgstFilter(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    sgstFilter === tab.key
                      ? 'bg-care-500 text-white shadow-md shadow-care-500/30'
                      : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {chronicSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <Lightbulb size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无慢病相关建议</p>
              </div>
            ) : (
              <div className="space-y-3">
                {chronicSuggestions.map((sgst, i) => {
                  const catCfg = suggestionCategoryConfig[sgst.category]
                  const priCfg = priorityConfig[sgst.priority]
                  const CatIcon = catCfg.icon
                  const isExpanded = expandedSuggestionId === sgst.id

                  const linkedRecord = sgst.recordId
                    ? followUpRecords.find(r => r.id === sgst.recordId)
                    : null

                  return (
                    <div
                      key={sgst.id}
                      className={`rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up ${!sgst.isActive ? 'opacity-60' : ''}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedSuggestionId(isExpanded ? null : sgst.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${catCfg.bg} ${catCfg.color}`}>
                                <CatIcon size={12} />
                                {catCfg.label}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priCfg.badge}`}>
                                {priCfg.label}
                              </span>
                              {!sgst.isActive && (
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-warm-100 text-warm-500">
                                  <CheckCircle2 size={10} />
                                  已完成
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-warm-900 text-sm">{sgst.title}</p>
                            <p className="mt-1 text-xs text-warm-500">
                              {sgst.doctorName} · {sgst.createdAt}
                            </p>
                          </div>
                          <div className="shrink-0 text-warm-400 mt-1 ml-2">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-warm-100 px-4 pb-4 pt-3 animate-fade-in">
                          <p className="text-sm text-warm-700 leading-relaxed">{sgst.content}</p>

                          {linkedRecord && (
                            <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                              <p className="text-xs font-medium text-blue-700 mb-1">关联复诊记录 · {linkedRecord.visitDate}</p>
                              <p className="text-xs text-blue-600 line-clamp-2">{linkedRecord.diagnosis}</p>
                              {linkedRecord.medicationAdjustments && (
                                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                                  <Pill size={11} />
                                  {linkedRecord.medicationAdjustments}
                                </p>
                              )}
                            </div>
                          )}

                          {sgst.isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                completeSuggestion(sgst.id)
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors active:scale-95"
                            >
                              <CheckCircle2 size={14} />
                              标记已完成
                            </button>
                          )}

                          {sgst.completedAt && (
                            <p className="mt-2 text-xs text-warm-400">完成于 {sgst.completedAt}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="animate-fade-in">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <CalendarClock size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无慢病复诊预约</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-care-500 px-4 py-2 text-sm font-medium text-white hover:bg-care-600 transition-colors"
                >
                  <Plus size={14} />
                  立即预约
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt, i) => {
                  const typeCfg = followUpTypeConfig[apt.followUpType]
                  const daysLeft = Math.max(0, Math.ceil((new Date(apt.scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

                  const lastRecord = chronicRecords[0]
                  const relatedSuggestions = lastRecord
                    ? doctorSuggestions.filter(s => s.recordId === lastRecord.id && s.isActive)
                    : []

                  return (
                    <div
                      key={apt.id}
                      className="rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                            {typeCfg.label}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {apt.status === 'confirmed' ? '已确认' : '待确认'}
                          </span>
                          {daysLeft <= 3 && daysLeft > 0 && (
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600 flex items-center gap-0.5">
                              <AlertTriangle size={10} />
                              {daysLeft}天后就诊
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-care-100 flex items-center justify-center">
                            <Stethoscope size={16} className="text-care-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-warm-900 text-sm">{apt.doctorName} · {apt.doctorTitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-warm-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {apt.scheduledDate} {apt.scheduledTime}
                          </span>
                        </div>

                        {apt.symptoms && (
                          <p className="text-xs text-warm-600 bg-warm-50 rounded-lg px-3 py-1.5 mb-2">{apt.symptoms}</p>
                        )}

                        <div className="rounded-lg bg-care-50 border border-care-200 p-2.5 mb-3">
                          <p className="text-xs font-medium text-care-700 mb-1.5">就诊准备清单</p>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-care-600">
                              <CheckCircle2 size={12} className="text-care-400" />
                              携带近两周血压/血糖监测记录
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-care-600">
                              <CheckCircle2 size={12} className="text-care-400" />
                              携带当前用药清单
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-care-600">
                              <CheckCircle2 size={12} className="text-care-400" />
                              记录近期身体症状变化
                            </div>
                          </div>
                        </div>

                        {lastRecord && (
                          <div className="rounded-lg bg-warm-50 border border-warm-200 p-2.5 mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-medium text-warm-700">上次复诊（{lastRecord.visitDate}）</p>
                              <button
                                onClick={() => setActiveTab('adjustments')}
                                className="text-[11px] text-care-500 hover:text-care-600"
                              >
                                查看详情
                              </button>
                            </div>
                            <p className="text-xs text-warm-600 line-clamp-1">{lastRecord.diagnosis}</p>
                            {lastRecord.medicationAdjustments && (
                              <p className="text-xs text-blue-500 mt-0.5 flex items-center gap-1">
                                <Pill size={11} />
                                {lastRecord.medicationAdjustments.length > 40
                                  ? lastRecord.medicationAdjustments.slice(0, 40) + '...'
                                  : lastRecord.medicationAdjustments}
                              </p>
                            )}
                          </div>
                        )}

                        {relatedSuggestions.length > 0 && (
                          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2.5 mb-3">
                            <p className="text-xs font-medium text-amber-700 mb-1">
                              待执行医嘱 ({relatedSuggestions.length})
                            </p>
                            {relatedSuggestions.slice(0, 2).map(s => (
                              <p key={s.id} className="text-xs text-amber-600 truncate">· {s.title}</p>
                            ))}
                            {relatedSuggestions.length > 2 && (
                              <p className="text-xs text-amber-400 mt-0.5">还有 {relatedSuggestions.length - 2} 条...</p>
                            )}
                          </div>
                        )}

                        {apt.status === 'scheduled' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => confirmFollowUpAppointment(apt.id)}
                              className="rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2 text-xs font-medium text-white transition-colors active:scale-95"
                            >
                              确认预约
                            </button>
                            <button
                              onClick={() => cancelFollowUpAppointment(apt.id)}
                              className="rounded-lg bg-warm-100 hover:bg-warm-200 px-4 py-2 text-xs font-medium text-warm-600 transition-colors active:scale-95"
                            >
                              取消
                            </button>
                          </div>
                        )}

                        {apt.status === 'confirmed' && (
                          <Link
                            to="/follow-up"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors active:scale-95"
                          >
                            <CheckCircle2 size={14} />
                            前往完成就诊
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowForm(false)}>
          <div
            className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
              <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
                <CalendarClock size={20} className="text-care-500" />
                新增慢病复诊预约
              </h2>
              <button onClick={() => setShowForm(false)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">复诊类型 <span className="text-red-500">*</span></label>
                <select
                  value={form.followUpType}
                  onChange={(e) => setForm({ ...form, followUpType: e.target.value as FollowUpType })}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                >
                  <option value="">请选择复诊类型</option>
                  <option value="chronic_disease">慢病随访</option>
                  <option value="medication_review">用药评估</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预约日期 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预约时间 <span className="text-red-500">*</span></label>
                  <input
                    type="time"
                    value={form.scheduledTime}
                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">主要症状</label>
                <textarea
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  placeholder="请描述老人当前症状或就诊目的"
                  rows={2}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">备注</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="请输入备注信息"
                  rows={2}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="rounded-lg bg-care-50 border border-care-200 p-3">
                <div className="flex items-center gap-2 text-sm text-care-700 mb-1">
                  <Stethoscope size={14} />
                  <span className="font-medium">家庭医生信息</span>
                </div>
                <p className="text-xs text-care-600">陈医生 · 全科主治医师 · 133-0000-2345</p>
                <p className="text-xs text-care-500 mt-0.5">社区卫生服务中心 2楼诊室</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitAppointment}
                disabled={!form.followUpType || !form.scheduledDate || !form.scheduledTime}
                className="rounded-lg bg-care-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-care-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
