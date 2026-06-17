import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { RefreshCw, TrendingUp, AlertTriangle, Clock, Activity } from 'lucide-react'
import { getMetrics } from '../utils/api'

// Distinct colors for each route line
const ROUTE_COLORS = [
  '#6366f1', // indigo
  '#34d399', // emerald
  '#f59e0b', // amber
  '#f87171', // red
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#fb923c', // orange
  '#4ade80', // green
]

function StatCard({ icon: Icon, label, value, sub, color = 'text-indigo-400' }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={`${color} opacity-80`} />
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-semibold mono ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="mono text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="mono">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function MetricsPage() {
  const [raw,       setRaw]       = useState({})       // raw API response
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState('requests') // requests | latency | errors
  const [autoRefresh, setAutoRefresh] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await getMetrics()
      setRaw(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [autoRefresh])

  // ── Derived data ───────────────────────────────────────────────────────────

  const routes = Object.keys(raw)

  // Build merged timeline: all minutes from all routes, unified
  // Result: [{ minute: "05:34", "/auth": 4, "/flags": 0, ... }, ...]
  function buildTimeline(field) {
    const minuteMap = {}
    routes.forEach((route) => {
      ;(raw[route] || []).forEach((row) => {
        if (!minuteMap[row.minute]) minuteMap[row.minute] = { minute: row.minute }
        minuteMap[row.minute][route] = field === 'avg_latency_ms'
          ? row.avg_latency_ms
          : row[field]
      })
    })
    return Object.values(minuteMap).sort((a, b) => a.minute.localeCompare(b.minute))
  }

  const requestTimeline = buildTimeline('requests')
  const latencyTimeline = buildTimeline('avg_latency_ms')
  const errorTimeline   = buildTimeline('errors')

  // Summary stats across all routes last 60 minutes
  const totals = routes.reduce((acc, route) => {
    const rows = raw[route] || []
    acc.requests += rows.reduce((s, r) => s + r.requests, 0)
    acc.errors   += rows.reduce((s, r) => s + r.errors, 0)
    const activeRows = rows.filter((r) => r.requests > 0)
    if (activeRows.length) {
      acc.avgLatency += activeRows.reduce((s, r) => s + r.avg_latency_ms, 0) / activeRows.length
      acc.latencyCount++
    }
    return acc
  }, { requests: 0, errors: 0, avgLatency: 0, latencyCount: 0 })

  const avgLatency = totals.latencyCount
    ? Math.round(totals.avgLatency / totals.latencyCount)
    : 0
  const errorRate = totals.requests
    ? ((totals.errors / totals.requests) * 100).toFixed(1)
    : '0.0'

  // Per-route summary table
  const routeSummary = routes.map((route, i) => {
    const rows        = raw[route] || []
    const totalReqs   = rows.reduce((s, r) => s + r.requests, 0)
    const totalErrs   = rows.reduce((s, r) => s + r.errors, 0)
    const activeRows  = rows.filter((r) => r.requests > 0)
    const avgMs       = activeRows.length
      ? Math.round(activeRows.reduce((s, r) => s + r.avg_latency_ms, 0) / activeRows.length)
      : 0
    return { route, totalReqs, totalErrs, avgMs, color: ROUTE_COLORS[i % ROUTE_COLORS.length] }
  })

  const currentTimeline =
    activeTab === 'requests' ? requestTimeline
    : activeTab === 'latency' ? latencyTimeline
    : errorTimeline

  const yLabel =
    activeTab === 'requests' ? 'requests/min'
    : activeTab === 'latency' ? 'avg ms'
    : 'errors/min'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Metrics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Per-route request stats — last 60 minutes</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <div
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative
                ${autoRefresh ? 'bg-indigo-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform
                ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            auto 30s
          </label>
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <StatCard icon={TrendingUp} label="Total Requests"  value={totals.requests.toLocaleString()} sub="last 60 min" color="text-indigo-400" />
        <StatCard icon={AlertTriangle} label="Total Errors" value={totals.errors.toLocaleString()}   sub={`${errorRate}% error rate`} color={totals.errors > 0 ? 'text-red-400' : 'text-emerald-400'} />
        <StatCard icon={Clock}       label="Avg Latency"    value={`${avgLatency}ms`}                sub="across active routes" color="text-amber-400" />
        <StatCard icon={Activity}    label="Routes"         value={routes.length}                    sub="being tracked" color="text-purple-400" />
      </div>

      {/* Chart */}
      <div className="card p-5 mb-6">
        {/* Chart tabs */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {[
              { key: 'requests', label: 'Requests/min' },
              { key: 'latency',  label: 'Avg Latency'  },
              { key: 'errors',   label: 'Errors/min'   },
            ].map(({ key, label }) => (
              <button key={key}
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                  ${activeTab === key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mono">{yLabel}</p>
        </div>

        {routes.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
            {loading ? 'Loading…' : 'No metrics data'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={currentTimeline} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="minute"
                tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#9ca3af', paddingTop: '12px' }}
              />
              {routes.map((route, i) => (
                <Line
                  key={route}
                  type="monotone"
                  dataKey={route}
                  stroke={ROUTE_COLORS[i % ROUTE_COLORS.length]}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per-route summary table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-300">Route Summary</h2>
          <p className="text-xs text-gray-600 mt-0.5">Totals across last 60 minutes</p>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-800 bg-gray-800/30">
            <tr>
              <th className="th">Route</th>
              <th className="th">Total Requests</th>
              <th className="th">Total Errors</th>
              <th className="th">Error Rate</th>
              <th className="th">Avg Latency</th>
            </tr>
          </thead>
          <tbody>
            {routeSummary.length === 0 && (
              <tr><td colSpan={5} className="td text-center text-gray-500 py-10">
                {loading ? 'Loading…' : 'No data'}
              </td></tr>
            )}
            {routeSummary.map((r, i) => (
              <motion.tr key={r.route}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }} className="tr"
              >
                <td className="td">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                    <span className="mono font-medium" style={{ color: r.color }}>{r.route}</span>
                  </div>
                </td>
                <td className="td"><span className="mono text-gray-300">{r.totalReqs.toLocaleString()}</span></td>
                <td className="td">
                  <span className={`mono ${r.totalErrs > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {r.totalErrs.toLocaleString()}
                  </span>
                </td>
                <td className="td">
                  {r.totalReqs > 0 ? (
                    <span className={`badge mono ${
                      (r.totalErrs / r.totalReqs) > 0.05
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {((r.totalErrs / r.totalReqs) * 100).toFixed(1)}%
                    </span>
                  ) : <span className="text-gray-600 text-xs">—</span>}
                </td>
                <td className="td">
                  <span className={`mono text-sm ${r.avgMs > 500 ? 'text-amber-400' : r.avgMs > 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                    {r.avgMs > 0 ? `${r.avgMs}ms` : '—'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
