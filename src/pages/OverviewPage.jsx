import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle, XCircle, Route, Key, Database, Zap } from 'lucide-react'
import { getHealth } from '../utils/api'

function StatCard({ icon: Icon, label, value, color = 'text-indigo-400' }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className={`${color} opacity-80`}><Icon size={18} /></div>
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-semibold mono ${color}`}>{value ?? '…'}</p>
    </div>
  )
}

export default function OverviewPage() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try { const { data: d } = await getHealth(); setData(d) }
    catch { setData(null) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const ok = data?.status === 'ok'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">API Gateway health and status</p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 rounded-xl px-5 py-4 mb-6 border
          ${ok
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}
      >
        {ok ? <CheckCircle size={18} /> : <XCircle size={18} />}
        <div>
          <p className="font-medium">{ok ? 'Gateway is healthy' : 'Gateway is not responding'}</p>
          {data?.timestamp && (
            <p className="text-xs opacity-70 mono mt-0.5">
              Last checked: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-4">
        <StatCard icon={Route}    label="Routes Loaded"  value={data?.routes_loaded}
          color={data?.routes_loaded > 0 ? 'text-indigo-400' : 'text-red-400'} />
        <StatCard icon={Key}      label="JWT Key"
          value={data?.jwt_key_loaded ? 'loaded' : 'missing'}
          color={data?.jwt_key_loaded ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard icon={Database} label="Redis"
          value={data?.redis || '—'}
          color={data?.redis === 'ok' ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard icon={Zap}      label="Status"
          value={data?.status || '—'}
          color={ok ? 'text-emerald-400' : 'text-red-400'} />
      </div>

      {/* Raw response */}
      {data && (
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">Raw health response</p>
          <pre className="text-xs mono text-gray-400 leading-relaxed">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
