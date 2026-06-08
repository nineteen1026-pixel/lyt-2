import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'
import type { HealthMetricType, HealthRecord } from '@/types'
import { healthRecords } from '@/data/mockData'

const TABS: { key: HealthMetricType; label: string; unit: string }[] = [
  { key: 'bloodPressure', label: '血压', unit: 'mmHg' },
  { key: 'heartRate', label: '心率', unit: 'bpm' },
  { key: 'bloodSugar', label: '血糖', unit: 'mmol/L' },
  { key: 'temperature', label: '体温', unit: '°C' },
]

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${m}/${d}`
}

function getStatus(record: HealthRecord): 'normal' | 'high' | 'low' {
  if (record.type === 'bloodPressure') {
    if ((record.systolic ?? 0) > 140 || (record.diastolic ?? 0) > 90) return 'high'
    if ((record.systolic ?? 0) < 90 || (record.diastolic ?? 0) < 60) return 'low'
    return 'normal'
  }
  if (record.type === 'heartRate') {
    if (record.value > 100) return 'high'
    if (record.value < 60) return 'low'
    return 'normal'
  }
  if (record.type === 'bloodSugar') {
    if (record.value > 6.1) return 'high'
    if (record.value < 3.9) return 'low'
    return 'normal'
  }
  if (record.type === 'temperature') {
    if (record.value > 37.3) return 'high'
    if (record.value < 36.0) return 'low'
    return 'normal'
  }
  return 'normal'
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  normal: { label: '正常', cls: 'bg-health-100 text-health-600' },
  high: { label: '偏高', cls: 'bg-danger-100 text-danger-600' },
  low: { label: '偏低', cls: 'bg-info-100 text-info-500' },
}

function formatValue(record: HealthRecord): string {
  if (record.type === 'bloodPressure') {
    return `${record.systolic}/${record.diastolic} ${record.unit}`
  }
  return `${record.value} ${record.unit}`
}

export default function Health() {
  const [activeTab, setActiveTab] = useState<HealthMetricType>('bloodPressure')

  const chartData = useMemo(() => {
    const filtered = healthRecords
      .filter(r => r.type === activeTab)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)

    return filtered.map(r => ({
      date: formatDate(r.date),
      value: r.value,
      systolic: r.systolic,
      diastolic: r.diastolic,
    }))
  }, [activeTab])

  const tableData = useMemo(() => {
    return healthRecords
      .filter(r => r.type === activeTab)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
      .slice(0, 10)
  }, [activeTab])

  const referenceLines = useMemo(() => {
    switch (activeTab) {
      case 'bloodPressure':
        return [
          { y: 140, label: '收缩压上限 140', stroke: '#EF4444', strokeDasharray: '6 4' },
          { y: 90, label: '舒张压上限 90', stroke: '#F97316', strokeDasharray: '6 4' },
        ]
      case 'heartRate':
        return [
          { y: 100, label: '上限 100', stroke: '#EF4444', strokeDasharray: '6 4' },
        ]
      case 'bloodSugar':
        return [
          { y: 6.1, label: '上限 6.1', stroke: '#EF4444', strokeDasharray: '6 4' },
          { y: 3.9, label: '下限 3.9', stroke: '#3B82F6', strokeDasharray: '6 4' },
        ]
      case 'temperature':
        return [
          { y: 37.3, label: '上限 37.3', stroke: '#EF4444', strokeDasharray: '6 4' },
          { y: 36.0, label: '下限 36.0', stroke: '#3B82F6', strokeDasharray: '6 4' },
        ]
    }
  }, [activeTab])

  const currentUnit = TABS.find(t => t.key === activeTab)!.unit

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-warm-900">健康记录</h1>
        <p className="mt-1 text-sm text-warm-500">查看老人近期健康数据趋势</p>
      </div>

      <div className="flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-care-500 text-white shadow-md shadow-care-500/30'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-slide-up rounded-2xl bg-white p-6 shadow-sm">
        <ResponsiveContainer width="100%" height={320}>
          {activeTab === 'bloodPressure' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSystolic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDiastolic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} />
              <YAxis tick={{ fontSize: 12, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} domain={[60, 160]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(value: number, name: string) => [`${value} mmHg`, name]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" formatter={(value: string) => <span className="text-xs text-warm-700">{value}</span>} />
              {referenceLines.map((ref, i) => (
                <ReferenceLine key={i} y={ref.y} label={{ value: ref.label, position: 'right', fontSize: 11, fill: ref.stroke }} stroke={ref.stroke} strokeDasharray={ref.strokeDasharray} />
              ))}
              <Area type="monotone" dataKey="systolic" name="收缩压" stroke="#F97316" strokeWidth={2.5} fill="url(#gradSystolic)" dot={{ r: 3, fill: '#F97316', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#F97316' }} />
              <Area type="monotone" dataKey="diastolic" name="舒张压" stroke="#4ADE80" strokeWidth={2.5} fill="url(#gradDiastolic)" dot={{ r: 3, fill: '#4ADE80', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4ADE80' }} />
            </AreaChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} />
              <YAxis tick={{ fontSize: 12, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E7E5E4' }} domain={activeTab === 'temperature' ? [35.5, 38] : activeTab === 'bloodSugar' ? [3, 8] : [50, 120]} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                formatter={(value: number) => [`${value} ${currentUnit}`]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" formatter={(value: string) => <span className="text-xs text-warm-700">{value}</span>} />
              {referenceLines.map((ref, i) => (
                <ReferenceLine key={i} y={ref.y} label={{ value: ref.label, position: 'right', fontSize: 11, fill: ref.stroke }} stroke={ref.stroke} strokeDasharray={ref.strokeDasharray} />
              ))}
              <Area type="monotone" dataKey="value" name={TABS.find(t => t.key === activeTab)!.label} stroke="#FB923C" strokeWidth={2.5} fill="url(#gradPrimary)" dot={{ r: 3, fill: '#FB923C', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#FB923C' }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="animate-slide-up rounded-2xl bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-warm-100">
          <h2 className="text-base font-semibold text-warm-800">历史记录</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-warm-100 text-warm-600">
              <th className="px-6 py-3 text-left font-medium">日期</th>
              <th className="px-6 py-3 text-left font-medium">时间</th>
              <th className="px-6 py-3 text-left font-medium">数值</th>
              <th className="px-6 py-3 text-left font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((record, idx) => {
              const status = getStatus(record)
              const statusInfo = STATUS_MAP[status]
              return (
                <tr key={record.id} className={idx % 2 === 0 ? 'bg-warm-50' : 'bg-warm-100'}>
                  <td className="px-6 py-3 text-warm-800">{record.date}</td>
                  <td className="px-6 py-3 text-warm-600">{record.time}</td>
                  <td className="px-6 py-3 text-warm-800 font-medium">{formatValue(record)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${statusInfo.cls}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
