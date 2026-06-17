import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../utils/api'
import { Modal } from '../components/Modal'
import { Confirm } from '../components/Confirm'

const EMPTY_FORM = {
  path_prefix:       '',
  upstream_url:      '',
  rate_limit_per_min: 60,
  description:       '',
  flag_name:         '',
  canary_enabled:    false,
  upstream_b_url:    '',
  canary_percentage: 0,
}

export default function RoutesPage() {
  const user    = useSelector((s) => s.auth.user)
  const isAdmin = user?.role === 'admin'

  const [routes,  setRoutes]  = useState([])
  const [loading, setLoading] = useState(false)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Edit
  const [editTarget, setEditTarget] = useState(null)
  const [editForm,   setEditForm]   = useState({})
  const [editSaving, setEditSaving] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  async function load() {
    setLoading(true)
    try { const { data } = await getRoutes(); setRoutes(data) }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to load routes') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true)
    try {
      await createRoute(form)
      toast.success(`Route "${form.path_prefix}" created`)
      setCreateOpen(false); setForm(EMPTY_FORM); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create route') }
    finally { setSaving(false) }
  }

  async function handleEdit(e) {
    e.preventDefault(); setEditSaving(true)
    try {
      await updateRoute(editTarget.id, editForm)
      toast.success(`Route "${editTarget.path_prefix}" updated`)
      setEditTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update route') }
    finally { setEditSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRoute(deleteTarget.id)
      toast.success(`Route "${deleteTarget.path_prefix}" deleted`)
      setDeleteTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete route') }
    finally { setDeleting(false) }
  }

  function RouteForm({ values, onChange, onSubmit, onCancel, saving, submitLabel }) {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Path Prefix <span className="text-red-400">*</span></label>
            <input className="input mono" placeholder="/auth"
              value={values.path_prefix || ''} onChange={(e) => onChange({ ...values, path_prefix: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Rate Limit / min</label>
            <input type="number" className="input mono" placeholder="60"
              value={values.rate_limit_per_min || 60}
              onChange={(e) => onChange({ ...values, rate_limit_per_min: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Upstream URL <span className="text-red-400">*</span></label>
          <input className="input mono" placeholder="http://auth-service.platform.svc.cluster.local:5000/auth"
            value={values.upstream_url || ''} onChange={(e) => onChange({ ...values, upstream_url: e.target.value })} required />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Description</label>
          <input className="input" placeholder="Optional"
            value={values.description || ''} onChange={(e) => onChange({ ...values, description: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Feature Flag Name <span className="text-gray-600">(for canary via flags)</span></label>
          <input className="input mono" placeholder="optional-flag-name"
            value={values.flag_name || ''} onChange={(e) => onChange({ ...values, flag_name: e.target.value })} />
        </div>

        {/* Legacy canary */}
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
          <input type="checkbox" className="accent-indigo-500"
            checked={values.canary_enabled || false}
            onChange={(e) => onChange({ ...values, canary_enabled: e.target.checked })} />
          Enable legacy canary (percentage-based, 2 upstreams)
        </label>

        {values.canary_enabled && (
          <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-indigo-500/30">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Canary Upstream B URL</label>
              <input className="input mono" placeholder="http://service-v2:5000"
                value={values.upstream_b_url || ''}
                onChange={(e) => onChange({ ...values, upstream_b_url: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Canary % (0–100)</label>
              <input type="number" min="0" max="100" className="input mono"
                value={values.canary_percentage || 0}
                onChange={(e) => onChange({ ...values, canary_percentage: Number(e.target.value) })} />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Routes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{routes.length} routes — reloaded every 30s</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary"
            disabled={!isAdmin} title={!isAdmin ? 'Admin only' : ''}>
            <Plus size={14} /> Add Route
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-800 bg-gray-800/30">
            <tr>
              <th className="th">Path Prefix</th>
              <th className="th">Upstream URL</th>
              <th className="th">Rate Limit</th>
              <th className="th">Flag / Canary</th>
              <th className="th">Description</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="td text-center text-gray-500 py-10">Loading…</td></tr>}
            {!loading && routes.length === 0 && (
              <tr><td colSpan={6} className="td text-center text-gray-500 py-10">No routes configured</td></tr>
            )}
            {routes.map((r, i) => (
              <motion.tr key={r.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }} className="tr"
              >
                <td className="td"><span className="mono text-indigo-300 font-medium">{r.path_prefix}</span></td>
                <td className="td">
                  <span className="mono text-xs text-gray-400 break-all">{r.upstream_url}</span>
                </td>
                <td className="td"><span className="mono text-xs text-gray-400">{r.rate_limit_per_min}/min</span></td>
                <td className="td">
                  {r.flag_name && (
                    <span className="badge bg-purple-500/15 text-purple-400 mono">{r.flag_name}</span>
                  )}
                  {r.canary_enabled && (
                    <span className="badge bg-amber-500/15 text-amber-400">{r.canary_percentage}% canary</span>
                  )}
                  {!r.flag_name && !r.canary_enabled && (
                    <span className="text-gray-600 text-xs">static</span>
                  )}
                </td>
                <td className="td"><span className="text-gray-500 text-xs">{r.description || '—'}</span></td>
                <td className="td">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="btn-ghost py-1 px-2" disabled={!isAdmin}
                      title={!isAdmin ? 'Admin only' : 'Edit'}
                      onClick={() => { setEditTarget(r); setEditForm({ ...r }) }}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn-danger py-1 px-2" disabled={!isAdmin}
                      title={!isAdmin ? 'Admin only' : 'Delete'}
                      onClick={() => setDeleteTarget(r)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Route">
        <RouteForm values={form} onChange={setForm}
          onSubmit={handleCreate} onCancel={() => setCreateOpen(false)}
          saving={saving} submitLabel="Create Route" />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit: ${editTarget?.path_prefix}`}>
        <RouteForm values={editForm} onChange={setEditForm}
          onSubmit={handleEdit} onCancel={() => setEditTarget(null)}
          saving={editSaving} submitLabel="Save Changes" />
      </Modal>

      <Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Route"
        message={`Delete route "${deleteTarget?.path_prefix}"? The gateway will stop routing requests to this upstream.`} />
    </div>
  )
}
