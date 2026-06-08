import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Activity,
  HeartPulse,
  Droplets,
  Pill,
  Phone,
  MessageSquare,
  Video,
  Bell,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { healthRecords } from '@/data/mockData'
import { useCareStore } from '@/store/useCareStore'
import { assessRisk, getRiskLevelConfig } from '@/lib/riskEngine'
import type { RiskLevel } from '@/types'

const ICON_MAP: Record<string, typeof Activity> = {
  Activity,
  HeartPulse,
  Droplets,
  AlertTriangle,
  Pill,
}

const FACTOR_COLORS: Record<RiskLevel, { bar: string; bg: string; text: string }> = {
  low: { bar: 'bg-health-500', bg: 'bg-health-50', text: 'text-health-600' },
  medium: { bar: 'bg-care-500', bg: 'bg-care-50', text: 'text-care-600' },
  high: { bar: 'bg-danger-500', bg: 'bg-danger-50', text: 'text-danger-600' },
}

const CHANNEL_ICONS: Record<string, typeof Phone> = {
  '微信推送': MessageSquare,
  '短信通知': Bell,
  '电话确认': Phone,
  '视频通话': Video,
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${m}/${d}`
}

export default function RiskStratification() {
  const { alerts, medications } = useCareStore()

  const assessment = useMemo(
    () => assessRisk('1', healthRecords, alerts, medications),
    [alerts, medications]
  )

  const riskConfig = getRiskLevelConfig(assessment.overallRisk)

  const miniChartData = useMemo(() => {
    const types = ['bloodPressure', 'heartRate', 'bloodSugar'] as const
    return types.map((type) => {
      const filtered = healthRecords
        .filter(r => r.type === type)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-7)
      return {
        type,
        data: filtered.map(r => ({
          date: formatDate(r.date),
          value: type === 'bloodPressure' ? (r.systolic ?? 0) : r.value,
        })),
      }
    })
  }, [])

  const miniChartDomains: Record<string, [number, number]> = {
    bloodPressure: [110, 160],
    heartRate: [55, 100],
    bloodSugar: [4, 8],
  }

  const miniChartColors: Record<string, string> = {
    bloodPressure: '#F97316',
    heartRate: '#EF4444',
    bloodSugar: '#3B82F6',
  }

  const miniChartLabels: Record<string, string> = {
    bloodPressure: '收缩压',
    heartRate: '心率',
    bloodSugar: '血糖',
  }

  const RiskIcon = assessment.overallRisk === 'low'
    ? ShieldCheck
    : assessment.overallRisk === 'medium'
    ? AlertCircle
    : AlertTriangle

  return (
    <div className="min-h-screen bg-warm-50 px-4 py-6 pb-24 animate-fade-in">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-warm-900">风险分层</h1>
          <p className="mt-1 text-sm text-warm-500">基于健康趋势、告警等级与用药依从性的综合风险评估</p>
        </div>

        <div className={`rounded-2xl bg-gradient-to-br ${riskConfig.gradient} p-6 text-white shadow-lg animate-slide-up`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <RiskIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-bold">{riskConfig.label}</span>
                <span className="text-white/70 text-sm">
                  综合评分 {assessment.totalScore}/{assessment.maxTotalScore}
                </span>
              </div>
              <p className="text-white/80 text-sm">
                {assessment.overallRisk === 'low' && '老人当前整体状态良好，请继续保持关注'}
                {assessment.overallRisk === 'medium' && '老人存在部分风险因素，建议加强日常监护'}
                {assessment.overallRisk === 'high' && '老人当前风险较高，需要重点监护和及时干预'}
              </p>
            </div>
          </div>

          <div className="mt-5 bg-white/15 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/80">风险指数</span>
              <span className="text-sm font-bold">{assessment.totalScore}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${assessment.totalScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-xs text-white/60">
              <span>低风险 0-33</span>
              <span>中风险 34-66</span>
              <span>高风险 67-100</span>
            </div>
          </div>
        </div>

        <section className="animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-lg font-bold text-warm-800 mb-4 flex items-center gap-2">
            <Zap size={20} className="text-care-500" />
            风险因素分析
          </h2>
          <div className="space-y-3">
            {assessment.factors.map((factor) => {
              const IconComp = ICON_MAP[factor.icon] || Activity
              const colors = FACTOR_COLORS[factor.level]
              const pct = Math.round((factor.score / factor.maxScore) * 100)
              return (
                <div key={factor.key} className="bg-white rounded-xl p-5 shadow-sm border border-warm-200/60">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                      <IconComp className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-warm-800">{factor.label}</span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {factor.level === 'low' ? '低' : factor.level === 'medium' ? '中' : '高'}
                        </span>
                      </div>
                      <p className="text-xs text-warm-500 mb-3">{factor.description}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-warm-700 shrink-0">{factor.score}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h2 className="text-lg font-bold text-warm-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-health-500" />
            近7日健康趋势
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {miniChartData.map(({ type, data }) => (
              <div key={type} className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60">
                <p className="text-sm font-medium text-warm-700 mb-3">{miniChartLabels[type]}</p>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#A8A29E' }} tickLine={false} axisLine={false} />
                    <YAxis domain={miniChartDomains[type]} tick={{ fontSize: 10, fill: '#A8A29E' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke={miniChartColors[type]} strokeWidth={2} fill={miniChartColors[type]} fillOpacity={0.1} dot={{ r: 2, fill: miniChartColors[type] }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h2 className="text-lg font-bold text-warm-800 mb-4 flex items-center gap-2">
            <Bell size={20} className="text-care-500" />
            家属提醒策略
          </h2>
          <div className={`rounded-2xl bg-white shadow-sm border-2 overflow-hidden ${
            assessment.notificationStrategy.riskLevel === 'low' ? 'border-health-300' :
            assessment.notificationStrategy.riskLevel === 'medium' ? 'border-care-300' : 'border-danger-300'
          }`}>
            <div className={`px-6 py-4 ${
              assessment.notificationStrategy.riskLevel === 'low' ? 'bg-health-50' :
              assessment.notificationStrategy.riskLevel === 'medium' ? 'bg-care-50' : 'bg-danger-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${
                    assessment.notificationStrategy.riskLevel === 'low' ? 'text-health-700' :
                    assessment.notificationStrategy.riskLevel === 'medium' ? 'text-care-700' : 'text-danger-700'
                  }`}>
                    {assessment.notificationStrategy.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskConfig.bg} ${riskConfig.color}`}>
                    {riskConfig.label}
                  </span>
                </div>
                <Clock size={16} className="text-warm-400" />
              </div>
              <p className="text-sm text-warm-600 mt-1">{assessment.notificationStrategy.description}</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-3">通知渠道</p>
                <div className="flex flex-wrap gap-2">
                  {assessment.notificationStrategy.channels.map((ch) => {
                    const ChIcon = CHANNEL_ICONS[ch] || Bell
                    return (
                      <span key={ch} className="inline-flex items-center gap-1.5 bg-warm-100 rounded-full px-3 py-1.5 text-sm text-warm-700">
                        <ChIcon size={14} />
                        {ch}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-3">通知频率</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors(assessment.notificationStrategy.riskLevel)}`} />
                  <span className="text-sm font-medium text-warm-700">{assessment.notificationStrategy.frequency}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-warm-400 uppercase tracking-wide mb-3">触发事件</p>
                <div className="space-y-1.5">
                  {assessment.notificationStrategy.triggerEvents.map((evt) => (
                    <div key={evt} className="flex items-center gap-2 text-sm text-warm-600">
                      <ChevronRight size={14} className="text-warm-300" />
                      {evt}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl p-4 ${
                assessment.notificationStrategy.riskLevel === 'low' ? 'bg-health-50 border border-health-200' :
                assessment.notificationStrategy.riskLevel === 'medium' ? 'bg-care-50 border border-care-200' : 'bg-danger-50 border border-danger-200'
              }`}>
                <div className="flex items-start gap-2">
                  <Zap size={16} className={`mt-0.5 ${
                    assessment.notificationStrategy.riskLevel === 'low' ? 'text-health-500' :
                    assessment.notificationStrategy.riskLevel === 'medium' ? 'text-care-500' : 'text-danger-500'
                  }`} />
                  <div>
                    <p className={`text-sm font-semibold ${
                      assessment.notificationStrategy.riskLevel === 'low' ? 'text-health-700' :
                      assessment.notificationStrategy.riskLevel === 'medium' ? 'text-care-700' : 'text-danger-700'
                    }`}>
                      紧急处置方案
                    </p>
                    <p className="text-sm text-warm-600 mt-0.5">{assessment.notificationStrategy.emergencyAction}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-slide-up" style={{ animationDelay: '320ms' }}>
          <h2 className="text-lg font-bold text-warm-800 mb-4">快速跳转</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link
              to="/health"
              className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-health-50 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 text-health-500" />
              </div>
              <span className="text-xs font-medium text-warm-600">健康记录</span>
            </Link>
            <Link
              to="/alerts"
              className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-danger-500" />
              </div>
              <span className="text-xs font-medium text-warm-600">异常告警</span>
            </Link>
            <Link
              to="/contacts"
              className="bg-white rounded-xl p-4 shadow-sm border border-warm-200/60 flex flex-col items-center gap-2 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="w-10 h-10 rounded-xl bg-info-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-info-500" />
              </div>
              <span className="text-xs font-medium text-warm-600">家属联系</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function colors(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    low: 'bg-health-500',
    medium: 'bg-care-500',
    high: 'bg-danger-500',
  }
  return map[level]
}
