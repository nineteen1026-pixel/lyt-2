import type { RiskLevel, RiskFactor, RiskAssessment, FamilyNotificationStrategy, HealthRecord, Alert, Medication } from '@/types'

function scoreToLevel(score: number): RiskLevel {
  if (score <= 33) return 'low'
  if (score <= 66) return 'medium'
  return 'high'
}

function assessBloodPressure(records: HealthRecord[]): RiskFactor {
  const recent = records
    .filter(r => r.type === 'bloodPressure')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, 14)

  if (recent.length === 0) {
    return { key: 'bloodPressure', label: '血压趋势', score: 0, maxScore: 100, level: 'low', description: '暂无血压数据', icon: 'Activity' }
  }

  let abnormalCount = 0
  let highSystolicCount = 0
  let trendDirection = 0

  for (let i = 0; i < recent.length; i++) {
    const r = recent[i]
    const isHigh = (r.systolic ?? 0) > 140 || (r.diastolic ?? 0) > 90
    const isLow = (r.systolic ?? 0) < 90 || (r.diastolic ?? 0) < 60
    if (isHigh || isLow) abnormalCount++
    if ((r.systolic ?? 0) > 150) highSystolicCount++

    if (i > 0) {
      const prev = recent[i - 1]
      trendDirection += ((r.systolic ?? 0) - (prev.systolic ?? 0))
    }
  }

  const abnormalRate = abnormalCount / recent.length
  const severeRate = highSystolicCount / recent.length
  const trendingUp = trendDirection > 20
  const trendingDown = trendDirection < -20

  let score = 0
  score += abnormalRate * 45
  score += severeRate * 30
  if (trendingUp) score += 15
  if (trendingDown) score += 5
  score = Math.min(100, Math.round(score))

  const level = scoreToLevel(score)
  let description = ''
  if (level === 'low') description = '近期血压指标正常，趋势平稳'
  else if (level === 'medium') description = `近${recent.length}次测量中${abnormalCount}次偏高，需持续关注`
  else description = `近${recent.length}次测量中${abnormalCount}次异常，${trendingUp ? '呈上升趋势' : '需立即干预'}`

  return { key: 'bloodPressure', label: '血压趋势', score, maxScore: 100, level, description, icon: 'Activity' }
}

function assessHeartRate(records: HealthRecord[]): RiskFactor {
  const recent = records
    .filter(r => r.type === 'heartRate')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, 14)

  if (recent.length === 0) {
    return { key: 'heartRate', label: '心率趋势', score: 0, maxScore: 100, level: 'low', description: '暂无心率数据', icon: 'HeartPulse' }
  }

  let abnormalCount = 0
  const values = recent.map(r => r.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  const stdDev = Math.sqrt(variance)

  for (const r of recent) {
    if (r.value > 100 || r.value < 60) abnormalCount++
  }

  const abnormalRate = abnormalCount / recent.length
  const volatilityRisk = Math.min(stdDev / 15, 1) * 30

  let score = 0
  score += abnormalRate * 50
  score += volatilityRisk
  score = Math.min(100, Math.round(score))

  const level = scoreToLevel(score)
  let description = ''
  if (level === 'low') description = '心率正常且波动较小'
  else if (level === 'medium') description = `心率偶有异常，波动标准差${stdDev.toFixed(1)}bpm`
  else description = `心率频繁异常，波动较大（标准差${stdDev.toFixed(1)}bpm）`

  return { key: 'heartRate', label: '心率趋势', score, maxScore: 100, level, description, icon: 'HeartPulse' }
}

function assessBloodSugar(records: HealthRecord[]): RiskFactor {
  const recent = records
    .filter(r => r.type === 'bloodSugar')
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
    .slice(0, 14)

  if (recent.length === 0) {
    return { key: 'bloodSugar', label: '血糖趋势', score: 0, maxScore: 100, level: 'low', description: '暂无血糖数据', icon: 'Droplets' }
  }

  let abnormalCount = 0
  const values = recent.map(r => r.value)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  let trendDirection = 0
  for (let i = 1; i < recent.length; i++) {
    trendDirection += recent[i].value - recent[i - 1].value
  }

  for (const r of recent) {
    if (r.value > 6.1 || r.value < 3.9) abnormalCount++
  }

  const abnormalRate = abnormalCount / recent.length
  const avgDeviation = Math.abs(avg - 5.0) / 2.0

  let score = 0
  score += abnormalRate * 50
  score += Math.min(avgDeviation, 1) * 30
  if (trendDirection > 2) score += 15
  score = Math.min(100, Math.round(score))

  const level = scoreToLevel(score)
  let description = ''
  if (level === 'low') description = '血糖控制良好，趋势平稳'
  else if (level === 'medium') description = `血糖偶有波动，均值${avg.toFixed(1)}mmol/L`
  else description = `血糖控制不佳，均值${avg.toFixed(1)}mmol/L，${trendDirection > 0 ? '呈上升趋势' : '波动明显'}`

  return { key: 'bloodSugar', label: '血糖趋势', score, maxScore: 100, level, description, icon: 'Droplets' }
}

function assessAlertSeverity(alerts: Alert[]): RiskFactor {
  const unresolved = alerts.filter(a => !a.resolved)
  const recent7Days = new Date()
  recent7Days.setDate(recent7Days.getDate() - 7)
  const recentAlerts = alerts.filter(a => new Date(a.time.replace(' ', 'T')) >= recent7Days)

  const urgentCount = recentAlerts.filter(a => a.level === 'urgent').length
  const warningCount = recentAlerts.filter(a => a.level === 'warning').length
  const unresolvedUrgent = unresolved.filter(a => a.level === 'urgent').length

  let score = 0
  score += Math.min(urgentCount * 25, 60)
  score += Math.min(warningCount * 10, 25)
  score += Math.min(unresolvedUrgent * 10, 15)
  score = Math.min(100, Math.round(score))

  const level = scoreToLevel(score)
  let description = ''
  if (level === 'low') description = '近7日无严重告警'
  else if (level === 'medium') description = `近7日有${warningCount}条警告，${urgentCount}条紧急告警`
  else description = `近7日有${urgentCount}条紧急告警，${unresolvedUrgent}条未处理`

  return { key: 'alertSeverity', label: '告警等级', score, maxScore: 100, level, description, icon: 'AlertTriangle' }
}

function assessMedicationCompliance(medications: Medication[]): RiskFactor {
  const now = new Date()
  const past7Days: Medication[] = []

  for (let i = 1; i <= 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    past7Days.push(...medications.filter(m => m.date === dateStr))
  }

  if (past7Days.length === 0) {
    return { key: 'medicationCompliance', label: '用药依从性', score: 0, maxScore: 100, level: 'low', description: '暂无用药记录', icon: 'Pill' }
  }

  const total = past7Days.length
  const missed = past7Days.filter(m => m.status === 'missed').length
  const missedRate = missed / total

  let consecutiveMissed = 0
  let maxConsecutive = 0
  const sorted = [...past7Days].sort((a, b) => `${a.date}${a.scheduledTime}`.localeCompare(`${b.date}${b.scheduledTime}`))
  for (const m of sorted) {
    if (m.status === 'missed') {
      consecutiveMissed++
      maxConsecutive = Math.max(maxConsecutive, consecutiveMissed)
    } else {
      consecutiveMissed = 0
    }
  }

  let score = 0
  score += missedRate * 60
  score += Math.min(maxConsecutive * 8, 30)
  if (missedRate > 0.15) score += 10
  score = Math.min(100, Math.round(score))

  const level = scoreToLevel(score)
  const complianceRate = ((1 - missedRate) * 100).toFixed(0)
  let description = ''
  if (level === 'low') description = `7日用药依从率${complianceRate}%，按时服药良好`
  else if (level === 'medium') description = `7日用药依从率${complianceRate}%，有${missed}次漏服`
  else description = `7日用药依从率仅${complianceRate}%，漏服${missed}次，最长连续漏服${maxConsecutive}次`

  return { key: 'medicationCompliance', label: '用药依从性', score, maxScore: 100, level, description, icon: 'Pill' }
}

const NOTIFICATION_STRATEGIES: Record<RiskLevel, FamilyNotificationStrategy> = {
  low: {
    riskLevel: 'low',
    label: '常规关注',
    description: '老人当前状态良好，建议保持定期关注',
    channels: ['微信推送', '短信通知'],
    frequency: '每周摘要',
    triggerEvents: ['紧急告警事件'],
    emergencyAction: '电话通知紧急联系人',
  },
  medium: {
    riskLevel: 'medium',
    label: '加强关注',
    description: '老人存在部分风险因素，需加强监护与沟通',
    channels: ['微信推送', '短信通知', '电话确认'],
    frequency: '每日摘要',
    triggerEvents: ['警告及以上告警', '用药漏服', '指标持续异常'],
    emergencyAction: '立即电话通知紧急联系人，30分钟未回应则联系社区',
  },
  high: {
    riskLevel: 'high',
    label: '重点监护',
    description: '老人风险较高，需密切监控并及时干预',
    channels: ['微信推送', '短信通知', '电话确认', '视频通话'],
    frequency: '实时推送',
    triggerEvents: ['所有告警事件', '指标轻微异常', '用药延迟', '行为异常'],
    emergencyAction: '立即电话通知所有紧急联系人，同时联系社区和120，启动应急预案',
  },
}

export function assessRisk(
  elderlyId: string,
  healthRecords: HealthRecord[],
  alerts: Alert[],
  medications: Medication[],
): RiskAssessment {
  const factors: RiskFactor[] = [
    assessBloodPressure(healthRecords),
    assessHeartRate(healthRecords),
    assessBloodSugar(healthRecords),
    assessAlertSeverity(alerts),
    assessMedicationCompliance(medications),
  ]

  const weights = [0.25, 0.20, 0.20, 0.20, 0.15]
  const totalScore = Math.round(
    factors.reduce((sum, f, i) => sum + f.score * weights[i], 0)
  )

  const overallRisk = scoreToLevel(totalScore)
  const notificationStrategy = NOTIFICATION_STRATEGIES[overallRisk]

  return {
    elderlyId,
    overallRisk,
    totalScore,
    maxTotalScore: 100,
    factors,
    notificationStrategy,
    assessedAt: new Date().toISOString(),
  }
}

export function getRiskLevelConfig(level: RiskLevel) {
  const configs: Record<RiskLevel, { label: string; color: string; bg: string; border: string; ring: string; gradient: string; icon: string }> = {
    low: {
      label: '低风险',
      color: 'text-health-600',
      bg: 'bg-health-100',
      border: 'border-health-300',
      ring: 'ring-health-400',
      gradient: 'from-health-400 to-health-600',
      icon: 'ShieldCheck',
    },
    medium: {
      label: '中风险',
      color: 'text-care-600',
      bg: 'bg-care-100',
      border: 'border-care-300',
      ring: 'ring-care-400',
      gradient: 'from-care-400 to-care-600',
      icon: 'AlertCircle',
    },
    high: {
      label: '高风险',
      color: 'text-danger-600',
      bg: 'bg-danger-100',
      border: 'border-danger-300',
      ring: 'ring-danger-400',
      gradient: 'from-danger-400 to-danger-600',
      icon: 'AlertTriangle',
    },
  }
  return configs[level]
}

export { scoreToLevel }
