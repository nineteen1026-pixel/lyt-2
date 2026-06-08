import { useState, useMemo } from 'react'
import {
  Stethoscope,
  CalendarPlus,
  ClipboardList,
  Lightbulb,
  Clock,
  MapPin,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Heart,
  Activity,
  Thermometer,
  Weight,
  Pill,
  Apple,
  Dumbbell,
  Moon,
  Eye,
  Brain,
  FileText,
  User,
  Phone,
  Trash2,
  GitCommitHorizontal,
} from 'lucide-react'
import { useCareStore } from '@/store/useCareStore'
import type {
  FollowUpType,
  FollowUpAppointmentStatus,
  FollowUpAppointment,
  SuggestionCategory,
  SuggestionPriority,
} from '@/types'

type TabKey = 'appointments' | 'records' | 'suggestions' | 'timeline'

const TABS: { key: TabKey; label: string; icon: typeof Stethoscope }[] = [
  { key: 'appointments', label: '预约管理', icon: CalendarPlus },
  { key: 'records', label: '随访记录', icon: ClipboardList },
  { key: 'suggestions', label: '医生建议', icon: Lightbulb },
  { key: 'timeline', label: '时间线', icon: GitCommitHorizontal },
]

const followUpTypeConfig: Record<FollowUpType, { label: string; icon: typeof Heart; color: string; bg: string }> = {
  chronic_disease: { label: '慢病随访', icon: Heart, color: 'text-care-500', bg: 'bg-care-100' },
  post_surgery: { label: '术后随访', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100' },
  health_checkup: { label: '健康体检', icon: ClipboardList, color: 'text-health-500', bg: 'bg-health-100' },
  medication_review: { label: '用药评估', icon: Pill, color: 'text-blue-500', bg: 'bg-blue-100' },
  rehabilitation: { label: '康复随访', icon: Dumbbell, color: 'text-amber-500', bg: 'bg-amber-100' },
  mental_health: { label: '心理随访', icon: Brain, color: 'text-pink-500', bg: 'bg-pink-100' },
}

const appointmentStatusConfig: Record<FollowUpAppointmentStatus, { label: string; badge: string; dot: string }> = {
  scheduled: { label: '已预约', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  confirmed: { label: '已确认', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  in_progress: { label: '进行中', badge: 'bg-care-100 text-care-700', dot: 'bg-care-400' },
  completed: { label: '已完成', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-400' },
  cancelled: { label: '已取消', badge: 'bg-warm-200 text-warm-500', dot: 'bg-warm-400' },
}

const suggestionCategoryConfig: Record<SuggestionCategory, { label: string; icon: typeof Apple; color: string; bg: string }> = {
  diet: { label: '饮食', icon: Apple, color: 'text-green-600', bg: 'bg-green-100' },
  exercise: { label: '运动', icon: Dumbbell, color: 'text-amber-600', bg: 'bg-amber-100' },
  medication: { label: '用药', icon: Pill, color: 'text-blue-600', bg: 'bg-blue-100' },
  lifestyle: { label: '生活方式', icon: Moon, color: 'text-purple-600', bg: 'bg-purple-100' },
  monitoring: { label: '监测', icon: Eye, color: 'text-care-600', bg: 'bg-care-100' },
  mental_health: { label: '心理', icon: Brain, color: 'text-pink-600', bg: 'bg-pink-100' },
}

const priorityConfig: Record<SuggestionPriority, { label: string; badge: string }> = {
  high: { label: '重要', badge: 'bg-red-100 text-red-600' },
  medium: { label: '一般', badge: 'bg-amber-100 text-amber-600' },
  low: { label: '建议', badge: 'bg-blue-100 text-blue-600' },
}

const vitalSignLabels: Record<string, { label: string; icon: typeof Heart; unit: string }> = {
  bloodPressure: { label: '血压', icon: Heart, unit: 'mmHg' },
  heartRate: { label: '心率', icon: Activity, unit: 'bpm' },
  bloodSugar: { label: '血糖', icon: Activity, unit: 'mmol/L' },
  temperature: { label: '体温', icon: Thermometer, unit: '°C' },
  weight: { label: '体重', icon: Weight, unit: 'kg' },
}

type AppointmentFilter = 'all' | 'upcoming' | 'completed' | 'cancelled'

const appointmentFilterTabs: { key: AppointmentFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'upcoming', label: '待就诊' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

type SuggestionFilter = 'all' | 'active' | 'completed'

const suggestionFilterTabs: { key: SuggestionFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const followUpTypeOptions: { value: FollowUpType; label: string }[] = [
  { value: 'chronic_disease', label: '慢病随访' },
  { value: 'post_surgery', label: '术后随访' },
  { value: 'health_checkup', label: '健康体检' },
  { value: 'medication_review', label: '用药评估' },
  { value: 'rehabilitation', label: '康复随访' },
  { value: 'mental_health', label: '心理随访' },
]

const initialForm = {
  followUpType: '' as FollowUpType | '',
  scheduledDate: '',
  scheduledTime: '',
  symptoms: '',
  notes: '',
}

function now() {
  return new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(/\//g, '-')
}

export default function FollowUp() {
  const {
    followUpAppointments,
    followUpRecords,
    doctorSuggestions,
    addFollowUpAppointment,
    confirmFollowUpAppointment,
    cancelFollowUpAppointment,
    completeFollowUpVisit,
    completeSuggestion,
  } = useCareStore()

  const [activeTab, setActiveTab] = useState<TabKey>('appointments')
  const [aptFilter, setAptFilter] = useState<AppointmentFilter>('all')
  const [sgstFilter, setSgstFilter] = useState<SuggestionFilter>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null)
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null)
  const [completingAppointmentId, setCompletingAppointmentId] = useState<string | null>(null)
  const [visitForm, setVisitForm] = useState({
    diagnosis: '',
    bloodPressure: '',
    heartRate: '',
    bloodSugar: '',
    temperature: '',
    weight: '',
    medicationAdjustments: '',
    nextFollowUpDate: '',
    notes: '',
    suggestions: [] as Array<{
      category: SuggestionCategory
      priority: SuggestionPriority
      title: string
      content: string
    }>,
  })

  const filteredAppointments = useMemo(() => {
    const sorted = [...followUpAppointments].sort((a, b) => {
      const dateA = `${a.scheduledDate}T${a.scheduledTime}`
      const dateB = `${b.scheduledDate}T${b.scheduledTime}`
      return dateB.localeCompare(dateA)
    })
    switch (aptFilter) {
      case 'upcoming':
        return sorted.filter((a) => ['scheduled', 'confirmed'].includes(a.status))
      case 'completed':
        return sorted.filter((a) => a.status === 'completed')
      case 'cancelled':
        return sorted.filter((a) => a.status === 'cancelled')
      default:
        return sorted
    }
  }, [followUpAppointments, aptFilter])

  const filteredSuggestions = useMemo(() => {
    switch (sgstFilter) {
      case 'active':
        return doctorSuggestions.filter((s) => s.isActive)
      case 'completed':
        return doctorSuggestions.filter((s) => !s.isActive)
      default:
        return doctorSuggestions
    }
  }, [doctorSuggestions, sgstFilter])

  const timelineEvents = useMemo(() => {
    const events: {
      id: string
      date: string
      type: 'appointment' | 'record' | 'suggestion'
      title: string
      detail: string
      status?: string
      icon: typeof Stethoscope
      color: string
      bg: string
    }[] = []

    followUpAppointments.forEach((apt) => {
      const typeCfg = followUpTypeConfig[apt.followUpType]
      events.push({
        id: apt.id,
        date: `${apt.scheduledDate} ${apt.scheduledTime}`,
        type: 'appointment',
        title: `${typeCfg.label}预约`,
        detail: `${apt.doctorName} · ${apt.location}`,
        status: appointmentStatusConfig[apt.status].label,
        icon: typeCfg.icon,
        color: typeCfg.color,
        bg: typeCfg.bg,
      })
    })

    followUpRecords.forEach((rec) => {
      const typeCfg = followUpTypeConfig[rec.followUpType]
      events.push({
        id: rec.id,
        date: rec.visitDate,
        type: 'record',
        title: `${typeCfg.label}记录`,
        detail: rec.diagnosis.slice(0, 40) + (rec.diagnosis.length > 40 ? '...' : ''),
        icon: FileText,
        color: 'text-health-500',
        bg: 'bg-health-100',
      })
    })

    doctorSuggestions.forEach((sgst) => {
      const catCfg = suggestionCategoryConfig[sgst.category]
      events.push({
        id: sgst.id,
        date: sgst.createdAt,
        type: 'suggestion',
        title: sgst.title,
        detail: `${sgst.doctorName}的建议`,
        status: sgst.isActive ? '进行中' : '已完成',
        icon: catCfg.icon,
        color: catCfg.color,
        bg: catCfg.bg,
      })
    })

    return events.sort((a, b) => b.date.localeCompare(a.date))
  }, [followUpAppointments, followUpRecords, doctorSuggestions])

  const stats = useMemo(() => {
    const upcoming = followUpAppointments.filter((a) =>
      ['scheduled', 'confirmed'].includes(a.status)
    ).length
    const completed = followUpAppointments.filter((a) => a.status === 'completed').length
    const activeSuggestions = doctorSuggestions.filter((s) => s.isActive).length
    return { upcoming, completed, activeSuggestions }
  }, [followUpAppointments, doctorSuggestions])

  const handleSubmit = () => {
    if (!form.followUpType || !form.scheduledDate || !form.scheduledTime) return
    const typeCfg = followUpTypeConfig[form.followUpType as FollowUpType]
    const newAppointment: FollowUpAppointment = {
      id: `fu${Date.now()}`,
      elderlyId: '1',
      doctorId: 'c6',
      doctorName: '陈医生',
      doctorTitle: '全科主治医师',
      followUpType: form.followUpType as FollowUpType,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      status: 'scheduled',
      location: '社区卫生服务中心 2楼诊室',
      symptoms: form.symptoms,
      notes: form.notes,
      createdAt: now(),
    }
    addFollowUpAppointment(newAppointment)
    setForm(initialForm)
    setShowForm(false)
  }

  const openCompleteVisit = (aptId: string) => {
    setCompletingAppointmentId(aptId)
    setVisitForm({
      diagnosis: '',
      bloodPressure: '',
      heartRate: '',
      bloodSugar: '',
      temperature: '',
      weight: '',
      medicationAdjustments: '',
      nextFollowUpDate: '',
      notes: '',
      suggestions: [],
    })
  }

  const handleCompleteVisit = () => {
    if (!completingAppointmentId || !visitForm.diagnosis) return
    completeFollowUpVisit({
      appointmentId: completingAppointmentId,
      diagnosis: visitForm.diagnosis,
      vitalSigns: {
        bloodPressure: visitForm.bloodPressure || undefined,
        heartRate: visitForm.heartRate ? Number(visitForm.heartRate) : undefined,
        bloodSugar: visitForm.bloodSugar ? Number(visitForm.bloodSugar) : undefined,
        temperature: visitForm.temperature ? Number(visitForm.temperature) : undefined,
        weight: visitForm.weight ? Number(visitForm.weight) : undefined,
      },
      medicationAdjustments: visitForm.medicationAdjustments,
      nextFollowUpDate: visitForm.nextFollowUpDate || undefined,
      notes: visitForm.notes,
      suggestions: visitForm.suggestions,
    })
    setCompletingAppointmentId(null)
    setActiveTab('records')
  }

  const addSuggestionToForm = () => {
    setVisitForm((prev) => ({
      ...prev,
      suggestions: [
        ...prev.suggestions,
        { category: 'diet', priority: 'medium', title: '', content: '' },
      ],
    }))
  }

  const removeSuggestionFromForm = (index: number) => {
    setVisitForm((prev) => ({
      ...prev,
      suggestions: prev.suggestions.filter((_, i) => i !== index),
    }))
  }

  const updateSuggestionInForm = (index: number, field: string, value: string) => {
    setVisitForm((prev) => ({
      ...prev,
      suggestions: prev.suggestions.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }))
  }

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-warm-900">家庭医生随访</h1>
              <p className="mt-1 text-sm text-warm-500">管理家庭医生预约、随访记录和健康建议</p>
            </div>
            {activeTab === 'appointments' && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-xl bg-care-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-care-600 active:scale-95"
              >
                <Plus size={16} />
                新增预约
              </button>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-care-200 animate-slide-up">
              <p className="text-xs text-warm-500 mb-1">待就诊</p>
              <p className="text-2xl font-bold text-care-600">{stats.upcoming}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-emerald-200 animate-slide-up" style={{ animationDelay: '80ms' }}>
              <p className="text-xs text-warm-500 mb-1">已随访</p>
              <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm border border-blue-200 animate-slide-up" style={{ animationDelay: '160ms' }}>
              <p className="text-xs text-warm-500 mb-1">待执行建议</p>
              <p className="text-2xl font-bold text-blue-500">{stats.activeSuggestions}</p>
            </div>
          </div>
        </header>

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

        {activeTab === 'appointments' && (
          <div className="animate-fade-in">
            <div className="mb-4 flex gap-2">
              {appointmentFilterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAptFilter(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                    aptFilter === tab.key
                      ? 'bg-care-500 text-white shadow-md shadow-care-500/30'
                      : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm animate-fade-in">
                <CalendarPlus size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无预约记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((apt, i) => {
                  const typeCfg = followUpTypeConfig[apt.followUpType]
                  const stCfg = appointmentStatusConfig[apt.status]
                  const TypeIcon = typeCfg.icon

                  return (
                    <div
                      key={apt.id}
                      className={`rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up ${
                        apt.status === 'cancelled' ? 'opacity-60' : ''
                      }`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="p-4">
                        <div className="mb-2 flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                            <TypeIcon size={12} />
                            {typeCfg.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${stCfg.badge}`}>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${stCfg.dot}`} />
                            {stCfg.label}
                          </span>
                        </div>

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-7 h-7 rounded-full bg-care-100 flex items-center justify-center">
                                <Stethoscope size={14} className="text-care-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-warm-900 text-sm">{apt.doctorName}</p>
                                <p className="text-xs text-warm-400">{apt.doctorTitle}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center gap-3 text-xs text-warm-500">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {apt.scheduledDate} {apt.scheduledTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {apt.location}
                              </span>
                            </div>
                            {apt.symptoms && (
                              <p className="mt-2 text-xs text-warm-600 bg-warm-50 rounded-lg px-3 py-1.5">
                                {apt.symptoms}
                              </p>
                            )}
                          </div>
                        </div>

                        {apt.status === 'scheduled' && (
                          <div className="mt-3 flex gap-2">
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
                          <div className="mt-3 space-y-2.5">
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5">
                              <div className="flex items-center gap-2 text-sm text-blue-700">
                                <CheckCircle2 size={14} />
                                <span className="font-medium text-xs">预约已确认，请按时就诊</span>
                              </div>
                              {apt.notes && (
                                <p className="text-xs text-blue-600 mt-1">提示：{apt.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => openCompleteVisit(apt.id)}
                              className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-medium text-white transition-colors active:scale-95 flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 size={14} />
                              完成就诊
                            </button>
                          </div>
                        )}

                        {apt.status === 'completed' && (() => {
                          const linkedRecord = followUpRecords.find((r) => r.appointmentId === apt.id)
                          const linkedSuggestions = doctorSuggestions.filter((s) => s.recordId && linkedRecord && s.recordId === linkedRecord.id)
                          return (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2 text-xs text-emerald-600">
                                <CheckCircle2 size={14} />
                                <span className="font-medium">就诊已完成</span>
                              </div>
                              {linkedRecord && (
                                <div
                                  className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 cursor-pointer hover:bg-emerald-100 transition-colors"
                                  onClick={() => {
                                    setActiveTab('records')
                                    setExpandedRecordId(linkedRecord.id)
                                  }}
                                >
                                  <p className="text-xs font-medium text-emerald-700 mb-1">随访记录</p>
                                  <p className="text-xs text-emerald-600 line-clamp-2">{linkedRecord.diagnosis}</p>
                                  {linkedRecord.nextFollowUpDate && (
                                    <p className="text-xs text-emerald-500 mt-1">下次随访：{linkedRecord.nextFollowUpDate}</p>
                                  )}
                                </div>
                              )}
                              {linkedSuggestions.length > 0 && (
                                <div
                                  className="rounded-lg bg-blue-50 border border-blue-200 p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                                  onClick={() => setActiveTab('suggestions')}
                                >
                                  <p className="text-xs font-medium text-blue-700 mb-1">
                                    医生建议 ({linkedSuggestions.length})
                                  </p>
                                  {linkedSuggestions.slice(0, 2).map((s) => (
                                    <p key={s.id} className="text-xs text-blue-600 truncate">· {s.title}</p>
                                  ))}
                                  {linkedSuggestions.length > 2 && (
                                    <p className="text-xs text-blue-400 mt-0.5">还有 {linkedSuggestions.length - 2} 条建议...</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {apt.status === 'cancelled' && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-warm-400">
                            <XCircle size={14} className="text-warm-400" />
                            <span>预约已取消</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'records' && (
          <div className="animate-fade-in space-y-3">
            {followUpRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <ClipboardList size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无随访记录</p>
              </div>
            ) : (
              followUpRecords
                .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
                .map((rec, i) => {
                  const typeCfg = followUpTypeConfig[rec.followUpType]
                  const TypeIcon = typeCfg.icon
                  const isExpanded = expandedRecordId === rec.id

                  return (
                    <div
                      key={rec.id}
                      className="rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedRecordId(isExpanded ? null : rec.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                                <TypeIcon size={12} />
                                {typeCfg.label}
                              </span>
                              <span className="text-xs text-warm-400">{rec.visitDate}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-health-100 flex items-center justify-center">
                                <User size={12} className="text-health-600" />
                              </div>
                              <span className="text-sm font-semibold text-warm-900">{rec.doctorName}</span>
                            </div>
                            <p className="text-xs text-warm-500 line-clamp-2">{rec.diagnosis}</p>
                          </div>
                          <div className="shrink-0 text-warm-400 mt-1">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-warm-100 px-4 pb-4 pt-3 animate-fade-in">
                          <div className="mb-3">
                            <p className="text-xs font-medium text-warm-700 mb-2">诊断</p>
                            <p className="text-sm text-warm-800 bg-warm-50 rounded-lg p-3">{rec.diagnosis}</p>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs font-medium text-warm-700 mb-2">体征数据</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Object.entries(rec.vitalSigns).map(([key, value]) => {
                                const cfg = vitalSignLabels[key]
                                if (!cfg || value === undefined) return null
                                const VitalIcon = cfg.icon
                                return (
                                  <div key={key} className="rounded-lg bg-warm-50 p-2.5">
                                    <div className="flex items-center gap-1.5 text-xs text-warm-500 mb-1">
                                      <VitalIcon size={11} />
                                      {cfg.label}
                                    </div>
                                    <p className="text-sm font-semibold text-warm-800">
                                      {value}
                                      <span className="text-xs font-normal text-warm-400 ml-0.5">{cfg.unit}</span>
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {rec.medicationAdjustments && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-warm-700 mb-2">用药调整</p>
                              <p className="text-sm text-warm-800 bg-blue-50 rounded-lg p-3">{rec.medicationAdjustments}</p>
                            </div>
                          )}

                          <div className="space-y-2 text-sm">
                            {rec.nextFollowUpDate && (
                              <div className="flex gap-2">
                                <span className="text-warm-400 w-20 shrink-0">下次随访</span>
                                <span className="text-care-600 font-medium">{rec.nextFollowUpDate}</span>
                              </div>
                            )}
                            {rec.notes && (
                              <div className="flex gap-2">
                                <span className="text-warm-400 w-20 shrink-0">备注</span>
                                <span className="text-warm-700">{rec.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
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

            {filteredSuggestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <Lightbulb size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无建议</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSuggestions.map((sgst, i) => {
                  const catCfg = suggestionCategoryConfig[sgst.category]
                  const priCfg = priorityConfig[sgst.priority]
                  const CatIcon = catCfg.icon
                  const isExpanded = expandedSuggestionId === sgst.id

                  return (
                    <div
                      key={sgst.id}
                      className={`rounded-xl bg-white shadow-sm border border-warm-200 overflow-hidden animate-slide-up ${
                        !sgst.isActive ? 'opacity-60' : ''
                      }`}
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
                          <div className="shrink-0 text-warm-400 mt-1">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-warm-100 px-4 pb-4 pt-3 animate-fade-in">
                          <p className="text-sm text-warm-700 leading-relaxed">{sgst.content}</p>

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
                            <p className="mt-2 text-xs text-warm-400">
                              完成于 {sgst.completedAt}
                            </p>
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

        {activeTab === 'timeline' && (
          <div className="animate-fade-in">
            {timelineEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
                <GitCommitHorizontal size={48} className="text-warm-300 mb-3" />
                <p className="text-warm-500 text-sm">暂无时间线事件</p>
              </div>
            ) : (
              <div className="relative pl-8">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-warm-200" />

                {timelineEvents.map((event, i) => {
                  const EventIcon = event.icon

                  let typeLabel = ''
                  if (event.type === 'appointment') typeLabel = '预约'
                  else if (event.type === 'record') typeLabel = '记录'
                  else typeLabel = '建议'

                  return (
                    <div
                      key={`${event.type}-${event.id}`}
                      className="relative mb-4 animate-slide-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className={`absolute -left-5 top-1.5 w-6 h-6 rounded-full ${event.bg} flex items-center justify-center ring-2 ring-white`}>
                        <EventIcon size={12} className={event.color} />
                      </div>

                      <div className="rounded-xl bg-white shadow-sm border border-warm-200 p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${event.bg} ${event.color}`}>
                                {typeLabel}
                              </span>
                              <p className="text-sm font-semibold text-warm-900 truncate">{event.title}</p>
                            </div>
                            <p className="text-xs text-warm-500">{event.detail}</p>
                          </div>
                          {event.status && (
                            <span className="shrink-0 text-[10px] font-medium text-warm-400 bg-warm-50 px-2 py-0.5 rounded-full">
                              {event.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-warm-300 mt-2">{event.date}</p>
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
                <Stethoscope size={20} className="text-care-500" />
                新增随访预约
              </h2>
              <button onClick={() => setShowForm(false)} className="text-warm-400 hover:text-warm-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-warm-700 mb-1.5">随访类型 <span className="text-danger-500">*</span></label>
                <select
                  value={form.followUpType}
                  onChange={(e) => setForm({ ...form, followUpType: e.target.value as FollowUpType })}
                  className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                >
                  <option value="">请选择随访类型</option>
                  {followUpTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预约日期 <span className="text-danger-500">*</span></label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">预约时间 <span className="text-danger-500">*</span></label>
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
                  <Phone size={14} />
                  <span className="font-medium">家庭医生信息</span>
                </div>
                <p className="text-xs text-care-600">
                  陈医生 · 全科主治医师 · 133-0000-2345
                </p>
                <p className="text-xs text-care-500 mt-0.5">
                  社区卫生服务中心 2楼诊室
                </p>
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
                onClick={handleSubmit}
                disabled={!form.followUpType || !form.scheduledDate || !form.scheduledTime}
                className="rounded-lg bg-care-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-care-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                提交预约
              </button>
            </div>
          </div>
        </div>
      )}

      {completingAppointmentId && (() => {
        const apt = followUpAppointments.find((a) => a.id === completingAppointmentId)
        if (!apt) return null
        const typeCfg = followUpTypeConfig[apt.followUpType]
        const suggestionCategoryOptions: { value: SuggestionCategory; label: string }[] = [
          { value: 'diet', label: '饮食' },
          { value: 'exercise', label: '运动' },
          { value: 'medication', label: '用药' },
          { value: 'lifestyle', label: '生活方式' },
          { value: 'monitoring', label: '监测' },
          { value: 'mental_health', label: '心理' },
        ]
        const priorityOptions: { value: SuggestionPriority; label: string }[] = [
          { value: 'high', label: '重要' },
          { value: 'medium', label: '一般' },
          { value: 'low', label: '建议' },
        ]
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setCompletingAppointmentId(null)}>
            <div
              className="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl animate-slide-up overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-warm-100">
                <h2 className="text-lg font-semibold text-warm-900 flex items-center gap-2">
                  <Stethoscope size={20} className="text-emerald-500" />
                  完成就诊
                </h2>
                <button onClick={() => setCompletingAppointmentId(null)} className="text-warm-400 hover:text-warm-600 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 py-2 border-b border-warm-100 bg-warm-50">
                <div className="flex items-center gap-2 text-xs text-warm-500">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${typeCfg.bg} ${typeCfg.color}`}>
                    {typeCfg.label}
                  </span>
                  <span>{apt.doctorName} · {apt.scheduledDate} {apt.scheduledTime}</span>
                </div>
              </div>

              <div className="px-6 py-5 max-h-[65vh] overflow-y-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">诊断结论 <span className="text-red-500">*</span></label>
                  <textarea
                    value={visitForm.diagnosis}
                    onChange={(e) => setVisitForm({ ...visitForm, diagnosis: e.target.value })}
                    placeholder="请输入诊断结论"
                    rows={2}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-warm-700 mb-2">体征数据</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-warm-500 mb-1">血压 (mmHg)</label>
                      <input
                        type="text"
                        value={visitForm.bloodPressure}
                        onChange={(e) => setVisitForm({ ...visitForm, bloodPressure: e.target.value })}
                        placeholder="如 138/86"
                        className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-warm-500 mb-1">心率 (bpm)</label>
                      <input
                        type="number"
                        value={visitForm.heartRate}
                        onChange={(e) => setVisitForm({ ...visitForm, heartRate: e.target.value })}
                        placeholder="如 74"
                        className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-warm-500 mb-1">血糖 (mmol/L)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={visitForm.bloodSugar}
                        onChange={(e) => setVisitForm({ ...visitForm, bloodSugar: e.target.value })}
                        placeholder="如 6.0"
                        className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-warm-500 mb-1">体温 (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={visitForm.temperature}
                        onChange={(e) => setVisitForm({ ...visitForm, temperature: e.target.value })}
                        placeholder="如 36.5"
                        className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-warm-500 mb-1">体重 (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={visitForm.weight}
                        onChange={(e) => setVisitForm({ ...visitForm, weight: e.target.value })}
                        placeholder="如 58.5"
                        className="w-full rounded-lg border border-warm-300 px-3 py-2 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-warm-700 mb-1.5">用药调整</label>
                  <textarea
                    value={visitForm.medicationAdjustments}
                    onChange={(e) => setVisitForm({ ...visitForm, medicationAdjustments: e.target.value })}
                    placeholder="请描述用药调整方案"
                    rows={2}
                    className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">下次随访日期</label>
                    <input
                      type="date"
                      value={visitForm.nextFollowUpDate}
                      onChange={(e) => setVisitForm({ ...visitForm, nextFollowUpDate: e.target.value })}
                      className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warm-700 mb-1.5">备注</label>
                    <input
                      type="text"
                      value={visitForm.notes}
                      onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                      placeholder="补充说明"
                      className="w-full rounded-lg border border-warm-300 px-3 py-2.5 text-sm text-warm-800 focus:border-care-500 focus:ring-1 focus:ring-care-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-warm-700">医生建议</p>
                    <button
                      onClick={addSuggestionToForm}
                      className="flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors"
                    >
                      <Plus size={12} />
                      添加建议
                    </button>
                  </div>
                  {visitForm.suggestions.length === 0 && (
                    <p className="text-xs text-warm-400 bg-warm-50 rounded-lg p-3 text-center">
                      暂无建议，可点击上方按钮添加
                    </p>
                  )}
                  <div className="space-y-3">
                    {visitForm.suggestions.map((sgst, idx) => (
                      <div key={idx} className="rounded-lg border border-warm-200 bg-warm-50 p-3 relative">
                        <button
                          onClick={() => removeSuggestionFromForm(idx)}
                          className="absolute top-2 right-2 text-warm-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <select
                            value={sgst.category}
                            onChange={(e) => updateSuggestionInForm(idx, 'category', e.target.value)}
                            className="rounded-lg border border-warm-300 px-2.5 py-1.5 text-xs text-warm-800 focus:border-care-500 outline-none"
                          >
                            {suggestionCategoryOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <select
                            value={sgst.priority}
                            onChange={(e) => updateSuggestionInForm(idx, 'priority', e.target.value)}
                            className="rounded-lg border border-warm-300 px-2.5 py-1.5 text-xs text-warm-800 focus:border-care-500 outline-none"
                          >
                            {priorityOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          value={sgst.title}
                          onChange={(e) => updateSuggestionInForm(idx, 'title', e.target.value)}
                          placeholder="建议标题"
                          className="w-full rounded-lg border border-warm-300 px-2.5 py-1.5 text-xs text-warm-800 focus:border-care-500 outline-none mb-2"
                        />
                        <textarea
                          value={sgst.content}
                          onChange={(e) => updateSuggestionInForm(idx, 'content', e.target.value)}
                          placeholder="建议详细内容"
                          rows={2}
                          className="w-full rounded-lg border border-warm-300 px-2.5 py-1.5 text-xs text-warm-800 focus:border-care-500 outline-none resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-warm-100 flex justify-end gap-3">
                <button
                  onClick={() => setCompletingAppointmentId(null)}
                  className="rounded-lg border border-warm-300 px-5 py-2.5 text-sm font-medium text-warm-600 hover:bg-warm-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCompleteVisit}
                  disabled={!visitForm.diagnosis}
                  className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  完成就诊
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
