import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, RotateCcw, CheckCircle, AlertTriangle, MinusCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCircuit, resetCircuit } from '../utils/api'
import { Confirm } from '../components/Confirm'

const STATE_CONFIG = {
  CLOSED:    { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle,   label: 'CLOSED'    },
  HALF_OPEN: { color: 'text-amber-400',   bg: 'bg-amber-500/15',   icon: AlertTriangle,  label: 'HALF_OPEN' },
  OPEN:      { color: 'text-red-400',     bg: 'bg-red-500/15',     icon: MinusCircle,    label: 'OPEN'      },
}

function StateExplainer() {
  return (
    <div className="card p-5 mb-6">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Circuit Breaker States</p>
      <div className="grid grid-cols-3 gap-4">
        {[
          { state: 'CLOSED',    desc: 'Normal — all requests pass through to upstream.' },
          { state: 'HALF_OPEN', desc: 'Probing — one request allowed through to test if upstream recovered.' },
          { state: 'OPEN',      desc: 'Tripped — all requests fail fast with 503. No upstream calls made.' },
        ].map(({ state, desc }) => {
          const cfg = STATE_CONFIG[state]
          const Icon = cfg.icon
          return (
            <div key={state} className={`rounded-lg p-4 ${cfg.bg} border border-current border-opacity-20`}>
              <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                <Icon size={14} />
                <span className="mono text-xs font-medium">{cfg.label}</span>
              </div>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CircuitPage() {
  const [circuits, setCircuits] = useState([])
  const [loading,  setLoading]  = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [resetting,   setResetting]   = useState(false)

  async function load() {
    setLoading(true)
    try { const { data } = await getCircuit(); setCircuits(data) }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to load circuit states') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // Auto-refresh every 10s
  useEffect(() => {
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [])

  async function handleReset() {
    setResetting(true)
    try {
      const { data } = await resetCircuit(resetTarget.route)
      toast.success(`${resetTarget.route} reset to CLOSED`)
      setResetTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to reset circuit') }
    finally { setResetting(false) }
  }

  const openCount     = circuits.filter((c) => c.state === 'OPEN').length
  const halfOpenCount = circuits.filter((c) => c.state === 'HALF_OPEN').length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Circuit Breakers</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {openCount > 0
              ? <span className="text-red-400">{openCount} circuit{openCount > 1 ? 's' : ''} OPEN</span>
              : halfOpenCount > 0
                ? <span className="text-amber-400">{halfOpenCount} probing</span>
                : <span className="text-emerald-400">All circuits healthy</span>
            }
            {' — auto-refreshes every 10s'}
          </p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <StateExplainer />

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-800 bg-gray-800/30">
            <tr>
              <th className="th">Route</th>
              <th className="th">State</th>
              <th className="th">Failures</th>
              <th className="th">Tripped At</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && circuits.length === 0 && (
              <tr><td colSpan={5} className="td text-center text-gray-500 py-10">Loading…</td></tr>
            )}
            {!loading && circuits.length === 0 && (
              <tr><td colSpan={5} className="td text-center text-gray-500 py-10">No routes configured</td></tr>
            )}
            {circuits.map((c, i) => {
              const cfg  = STATE_CONFIG[c.state] || STATE_CONFIG.CLOSED
              const Icon = cfg.icon
              const isOpen = c.state !== 'CLOSED'

              return (
                <motion.tr key={c.route}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }} className="tr"
                >
                  <td className="td">
                    <span className="mono text-indigo-300 font-medium">{c.route}</span>
                  </td>
                  <td className="td">
                    <span className={`badge ${cfg.bg} ${cfg.color} flex items-center gap-1.5 w-fit mono`}>
                      <Icon size={11} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="td">
                    <span className={`mono text-sm ${c.failures > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                      {c.failures}
                    </span>
                  </td>
                  <td className="td">
                    {c.tripped_at ? (
                      <span className="mono text-xs text-amber-400">
                        {new Date(c.tripped_at).toLocaleTimeString()}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="td text-right">
                    <button
                      className="btn-warning py-1 px-2 text-xs"
                      disabled={!isOpen}
                      title={isOpen ? 'Reset to CLOSED' : 'Already CLOSED'}
                      onClick={() => setResetTarget(c)}
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Confirm
        open={!!resetTarget} onClose={() => setResetTarget(null)}
        onConfirm={handleReset} loading={resetting}
        title="Reset Circuit Breaker"
        confirmLabel="Reset to CLOSED" variant="warning"
        message={`Manually reset "${resetTarget?.route}" from ${resetTarget?.state} to CLOSED? Only do this if you've confirmed the upstream is healthy.`}
      />
    </div>
  )
}
