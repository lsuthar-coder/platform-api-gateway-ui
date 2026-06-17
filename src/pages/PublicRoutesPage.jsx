import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Plus, Trash2, RefreshCw, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPublicRoutes, createPublicRoute, deletePublicRoute } from '../utils/api'
import { Modal } from '../components/Modal'
import { Confirm } from '../components/Confirm'

const EMPTY_FORM = { path: '', match_type: 'prefix', description: '', is_system: false }

export default function PublicRoutesPage() {
  const user    = useSelector((s) => s.auth.user)
  const isAdmin = user?.role === 'admin'

  const [routes,  setRoutes]  = useState([])
  const [loading, setLoading] = useState(false)

  // Create
  const [createOpen, setCreateOpen] = useState(false)
  const [form,   setForm]   = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting,     setDeleting]     = useState(false)

  async function load() {
    setLoading(true)
    try { const { data } = await getPublicRoutes(); setRoutes(data) }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to load public routes') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true)
    try {
      await createPublicRoute(form)
      toast.success(`Public route "${form.path}" created`)
      setCreateOpen(false); setForm(EMPTY_FORM); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create public route') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePublicRoute(deleteTarget.id)
      toast.success(`Public route "${deleteTarget.path}" deleted`)
      setDeleteTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete public route') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Public Routes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Paths that bypass JWT authentication</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setCreateOpen(true)} className="btn-primary"
            disabled={!isAdmin} title={!isAdmin ? 'Admin only' : ''}>
            <Plus size={14} /> Add Public Route
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-5 text-sm text-amber-300">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p>Public routes bypass JWT verification. Any request to these paths is forwarded without a token check. Use carefully — only add paths that are genuinely public (e.g. login, register, health).</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-800 bg-gray-800/30">
            <tr>
              <th className="th">Path</th>
              <th className="th">Match Type</th>
              <th className="th">System</th>
              <th className="th">Description</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="td text-center text-gray-500 py-10">Loading…</td></tr>}
            {!loading && routes.length === 0 && (
              <tr><td colSpan={5} className="td text-center text-gray-500 py-10">No public routes</td></tr>
            )}
            {routes.map((r, i) => (
              <motion.tr key={r.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }} className="tr"
              >
                <td className="td"><span className="mono text-amber-300 font-medium">{r.path}</span></td>
                <td className="td">
                  <span className={`badge ${r.match_type === 'exact' ? 'bg-blue-500/15 text-blue-400' : 'bg-purple-500/15 text-purple-400'} mono`}>
                    {r.match_type}
                  </span>
                </td>
                <td className="td">
                  {r.is_system
                    ? <span className="badge bg-gray-500/15 text-gray-400">system</span>
                    : <span className="text-gray-600 text-xs">—</span>
                  }
                </td>
                <td className="td"><span className="text-gray-500 text-xs">{r.description || '—'}</span></td>
                <td className="td">
                  <div className="flex justify-end">
                    <button className="btn-danger py-1 px-2"
                      disabled={!isAdmin || r.is_system}
                      title={r.is_system ? 'System routes cannot be deleted' : !isAdmin ? 'Admin only' : 'Delete'}
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

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Public Route" width="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Path <span className="text-red-400">*</span></label>
            <input className="input mono" placeholder="/auth/login"
              value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} required />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Match Type</label>
            <select className="select" value={form.match_type}
              onChange={(e) => setForm({ ...form, match_type: e.target.value })}>
              <option value="exact">exact — only this exact path</option>
              <option value="prefix">prefix — this path and all sub-paths</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Description</label>
            <input className="input" placeholder="Optional"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
            Requests to this path will skip JWT verification and be forwarded directly.
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add Public Route'}
            </button>
          </div>
        </form>
      </Modal>

      <Confirm open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Public Route"
        message={`Delete public route "${deleteTarget?.path}"? Requests to this path will require JWT authentication again.`} />
    </div>
  )
}
