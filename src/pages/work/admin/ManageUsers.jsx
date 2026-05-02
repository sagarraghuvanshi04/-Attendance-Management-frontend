import { useState } from "react";
import { useGetAllUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from "../../../store/attendanceApi";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;
const EMPTY_FORM = { name: "", email: "", password: "", role: "EMPLOYEE", department: "", managerId: "", isActive: true };

export default function ManageUsers() {
  const { data, isLoading } = useGetAllUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const users = data?.users || [];
  const managers = users.filter(u => u.role === "MANAGER" || u.role === "ADMIN");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase()) ||
    (u.department || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...createForm };
      if (!payload.managerId) delete payload.managerId;
      await createUser(payload).unwrap();
      toast.success("User created successfully");
      setCreateForm(EMPTY_FORM);
      setShowCreate(false);
    } catch (err) { toast.error(err.data?.message || "Failed to create user"); }
  };

  const startEdit = (u) => {
    setEditing(u._id);
    setEditForm({ name: u.name, email: u.email, role: u.role, department: u.department || "", managerId: u.managerId?._id || "", isActive: u.isActive });
  };

  const saveEdit = async (id) => {
    try {
      const payload = { ...editForm };
      if (!payload.managerId) delete payload.managerId;
      await updateUser({ id, ...payload }).unwrap();
      toast.success("User updated");
      setEditing(null);
    } catch (err) { toast.error(err.data?.message || "Failed"); }
  };

  const del = async (id) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(id).unwrap();
      toast.success("User deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const roleColor = { ADMIN: "bg-red-100 text-red-700", MANAGER: "bg-purple-100 text-purple-700", EMPLOYEE: "bg-blue-100 text-blue-700" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Manage Users</h1>
        <button onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
          {showCreate ? "✕ Cancel" : "+ Add User"}
        </button>
      </div>

      {/* Create User Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl shadow p-6 border-l-4 border-indigo-500">
          <h2 className="font-semibold text-gray-700 mb-4">Create New User</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input required type="email" placeholder="Email" value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input required type="password" placeholder="Password" value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input placeholder="Department" value={createForm.department}
              onChange={e => setCreateForm(f => ({ ...f, department: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            <select value={createForm.managerId} onChange={e => setCreateForm(f => ({ ...f, managerId: e.target.value }))}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">No Manager Assigned</option>
              {managers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
            </select>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={creating}
                className="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60">
                {creating ? "Creating..." : "✅ Create User"}
              </button>
              <button type="button" onClick={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); }}
                className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, role or department..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} users</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Name", "Email", "Role", "Department", "Manager", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    {editing === u._id ? (
                      <>
                        <td className="px-4 py-2"><input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="border rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" /></td>
                        <td className="px-4 py-2"><input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="border rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" /></td>
                        <td className="px-4 py-2">
                          <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option>EMPLOYEE</option><option>MANAGER</option><option>ADMIN</option>
                          </select>
                        </td>
                        <td className="px-4 py-2"><input value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} className="border rounded-lg px-2 py-1.5 w-full text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" /></td>
                        <td className="px-4 py-2">
                          <select value={editForm.managerId} onChange={e => setEditForm(f => ({ ...f, managerId: e.target.value }))} className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option value="">None</option>
                            {managers.filter(m => m._id !== u._id).map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <select value={String(editForm.isActive)} onChange={e => setEditForm(f => ({ ...f, isActive: e.target.value === "true" }))} className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400">
                            <option value="true">Active</option><option value="false">Inactive</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-2">
                            <button onClick={() => saveEdit(u._id)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-700 font-medium">Save</button>
                            <button onClick={() => setEditing(null)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-300 font-medium">Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                              {u.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-700">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColor[u.role]}`}>{u.role}</span></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.department || "--"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.managerId?.name || "--"}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(u)} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs hover:bg-indigo-200 font-medium">Edit</button>
                            <button onClick={() => del(u._id)} className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs hover:bg-red-200 font-medium">Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {paginated.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-gray-400">No users found</td></tr>}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-xs text-gray-500">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 rounded-lg text-xs border hover:bg-gray-100 disabled:opacity-40">← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 rounded-lg text-xs border ${p === page ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-gray-100"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1 rounded-lg text-xs border hover:bg-gray-100 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
