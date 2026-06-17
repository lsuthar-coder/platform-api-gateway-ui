import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { RefreshCw, ShieldCheck, ShieldOff, Ban } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUsers, updateRole, revokeSessions } from '../utils/api'
import { Confirm } from '../components/Confirm'
import { Modal } from '../components/Modal'

export default function UsersPage() {
  const user    = useSelector((s) => s.auth.user)
  const isAdmin = user?.role === 'admin'

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)

  // Role change
  const [roleTarget, setRoleTarget] = useState(null) // { id, email, currentRole }
  const [newRole,    setNewRole]    = useState('user')
  const [roleSaving, setRoleSaving] = useState(false)

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking,     setRevoking]     = useState(false)

  async function load() {
    setLoading(true)
    try { const { data } = await getUsers(); setUsers(data) }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleRoleChange(e) {
    e.preventDefault(); setRoleSaving(true)
    try {
      await updateRole(roleTarget.id, newRole)
      toast.success(`Role updated: ${roleTarget.email} is now ${newRole}`)
      setRoleTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update role') }
    finally { setRoleSaving(false) }
  }

  async function handleRevoke() {
    setRevoking(true)
    try {
      await revokeSessions(revokeTarget.id)
      toast.success(`Sessions revoked for ${revokeTarget.email}`)
      setRevokeTarget(null); load()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to revoke sessions') }
    finally { setRevoking(false) }
  }

  function fmt(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Users</h1>
          <p className="text-gray-500 text-sm mt-0.5">{users.length} registered accounts</p>
        </div>
        <button onClick={load} className="btn-ghost" disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-gray-800 bg-gray-800/30">
            <tr>
              <th className="th">Email</th>
              <th className="th">Role</th>
              <th className="th">Created</th>
              <th className="th">Last Login</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="td text-center text-gray-500 py-10">Loading…</td></tr>}
            {!loading && users.length === 0 && (
              <tr><td colSpan={5} className="td text-center text-gray-500 py-10">No users found</td></tr>
            )}
            {users.map((u, i) => (
              <motion.tr key={u.id}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }} className="tr"
              >
                <td className="td">
                  <span className="text-gray-200">{u.email}</span>
                  {u.id === user?.sub && (
                    <span className="ml-2 badge bg-indigo-500/15 text-indigo-400 text-xs">you</span>
                  )}
                </td>
                <td className="td">
                  <span className={`badge ${u.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-500/15 text-gray-400'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="td"><span className="text-gray-500 text-xs mono">{fmt(u.created_at)}</span></td>
                <td className="td"><span className="text-gray-500 text-xs mono">{fmt(u.last_login)}</span></td>
                <td className="td">
                  <div className="flex items-center gap-2 justify-end">
                    {/* Change Role */}
                    <button
                      className="btn-ghost py-1 px-2 text-xs"
                      disabled={!isAdmin}
                      title={!isAdmin ? 'Admin only' : 'Change role'}
                      onClick={() => { setRoleTarget(u); setNewRole(u.role === 'admin' ? 'user' : 'admin') }}
                    >
                      {u.role === 'admin' ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    {/* Revoke Sessions */}
                    <button
                      className="btn-warning py-1 px-2 text-xs"
                      disabled={!isAdmin}
                      title={!isAdmin ? 'Admin only' : 'Revoke all sessions'}
                      onClick={() => setRevokeTarget(u)}
                    >
                      <Ban size={13} />
                      Revoke
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Change Modal */}
      <Modal open={!!roleTarget} onClose={() => setRoleTarget(null)} title="Change Role" width="max-w-sm">
        <form onSubmit={handleRoleChange} className="space-y-4">
          <p className="text-sm text-gray-400">
            Change role for <span className="text-gray-200">{roleTarget?.email}</span>
          </p>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">New Role</label>
            <select className="select" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400">
            Role takes effect on next login or token refresh. Existing tokens keep the old role until they expire (15 min).
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setRoleTarget(null)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary" disabled={roleSaving}>
              {roleSaving ? 'Saving…' : 'Update Role'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Revoke Confirm */}
      <Confirm
        open={!!revokeTarget} onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke} loading={revoking}
        title="Revoke Sessions" confirmLabel="Revoke" variant="warning"
        message={`Revoke all active sessions for ${revokeTarget?.email}? They will be forced to log in again on all devices.`}
      />
    </div>
  )
}
