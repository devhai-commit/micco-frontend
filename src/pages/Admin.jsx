import { useState, useEffect, useRef } from 'react';
import {
    Users, HardDrive, Zap,
    Search, Filter, Download, Plus, MoreVertical,
    ChevronLeft, ChevronRight, Trash2, Edit3,
    Shield, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/admin/StatCard';
import UserModal, { ROLES } from '../components/admin/UserModal';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';

// ── helpers ────────────────────────────────────────────────────────────────────
function getInitials(name = '') {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}
const avatarPalette = [
    'bg-primary-600', 'bg-emerald-500', 'bg-violet-500',
    'bg-orange-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500',
];
function avatarBg(name = '') {
    let h = 0; for (const c of name) h += c.charCodeAt(0);
    return avatarPalette[h % avatarPalette.length];
}
function timeAgo(dateStr) {
    if (!dateStr) return '—';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
    if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ROLE_COLORS = {
    Admin: 'bg-primary-600/10 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300',
    Editor: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    Viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    Member: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};
const PAGE_SIZE = 10;

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Admin() {
    const { authFetch, user: currentUser } = useAuth();

    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [openMenu, setOpenMenu] = useState(null);
    const [addModal, setAddModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [toast, setToast] = useState(null);
    const searchDebounce = useRef(null);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => {
        clearTimeout(searchDebounce.current);
        searchDebounce.current = setTimeout(() => { setPage(1); fetchUsers(1); }, 350);
        return () => clearTimeout(searchDebounce.current);
    }, [search, roleFilter]);

    useEffect(() => { fetchUsers(page); }, [page]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchStats = async () => {
        try {
            const res = await authFetch('/api/admin/stats');
            if (res.ok) setStats(await res.json());
        } catch { /* silent */ }
    };

    const fetchUsers = async (p = page) => {
        try {
            const params = new URLSearchParams({ page: p, page_size: PAGE_SIZE });
            if (search) params.append('search', search);
            if (roleFilter !== 'All') params.append('role', roleFilter);
            const res = await authFetch(`/api/admin/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
                setTotal(data.total);
            }
        } catch { /* silent */ }
    };

    const handleSave = async (form) => {
        try {
            const isEdit = !!editUser;
            const url = isEdit ? `/api/admin/users/${editUser.id}` : '/api/admin/users';
            const method = isEdit ? 'PUT' : 'POST';
            const payload = { ...form };
            if (isEdit && !payload.password) delete payload.password;

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setAddModal(false);
                setEditUser(null);
                await fetchUsers();
                await fetchStats();
                showToast(isEdit ? `${form.name} updated successfully` : `${form.name} added successfully`);
            } else {
                const err = await res.json();
                showToast(err.detail || 'Operation failed', 'error');
            }
        } catch { showToast('Something went wrong', 'error'); }
    };

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok || res.status === 204) {
                setDeleteUser(null);
                await fetchUsers();
                await fetchStats();
                showToast('User removed successfully');
            } else {
                const err = await res.json();
                showToast(err.detail || 'Delete failed', 'error');
            }
        } catch { showToast('Delete failed', 'error'); }
    };

    const handleExport = () => {
        const rows = [['Name', 'Email', 'Role', 'Created'], ...users.map(u => [u.name, u.email, u.role, u.created_at])];
        const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    // Close menu on outside click
    useEffect(() => {
        const h = () => setOpenMenu(null);
        document.addEventListener('click', h);
        return () => document.removeEventListener('click', h);
    }, []);

    // Derived user status (based on recency of creation as approximation)
    const isActive = (u) => {
        if (!u.created_at) return false;
        return (Date.now() - new Date(u.created_at)) < 30 * 24 * 3600 * 1000;
    };

    const statCards = stats ? [
        { icon: Users, label: 'Total Users', value: stats.totalUsers?.toLocaleString(), change: stats.totalUsersChange, positive: true },
        { icon: HardDrive, label: 'Storage Used', value: stats.storageUsed, change: stats.storageChange, positive: true },
        { icon: Zap, label: 'Active Sessions', value: stats.activeSessions, change: stats.activeSessionsChange, positive: false },
    ] : [];

    const startRow = (page - 1) * PAGE_SIZE + 1;
    const endRow = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="space-y-8">

            {/* ── Toast ──────────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all
                    ${toast.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}>
                    {toast.type === 'error'
                        ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                        : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    }
                    {toast.msg}
                </div>
            )}

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage users, roles, and system activity</p>
                </div>
                <button
                    onClick={() => { setEditUser(null); setAddModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add New User
                </button>
            </div>

            {/* ── Stat Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map(s => (
                    <StatCard key={s.label} {...s} />
                ))}
                {!stats && [0, 1, 2].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse">
                        <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4" />
                        <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
                        <div className="h-8 w-20 bg-slate-100 dark:bg-slate-800 rounded" />
                    </div>
                ))}
            </div>

            {/* ── User Management Table ───────────────────────────────────── */}
            <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

                {/* Table toolbar */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">User Management</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Search */}
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search users..."
                                className="pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary-600/30 focus:border-primary-600 w-48 transition-all"
                            />
                        </div>
                        {/* Role filter */}
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="py-1.5 pl-3 pr-8 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-primary-600/30 cursor-pointer appearance-none"
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
                        </select>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm font-medium px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        >
                            <Download className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-14 text-center">
                                        <Users className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No users found</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            )}
                            {users.map((u) => {
                                const active = isActive(u);
                                const isSelf = u.id === currentUser?.id;
                                return (
                                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        {/* Name */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full ${isSelf ? 'bg-primary-600' : avatarBg(u.name)} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                                                    {getInitials(u.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {u.name}
                                                        {isSelf && <span className="ml-2 text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase">(you)</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role] || ROLE_COLORS.Member}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-semibold ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        {/* Joined */}
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                            {timeAgo(u.created_at)}
                                        </td>
                                        {/* Actions */}
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}
                                                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-1 rounded"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                            {openMenu === u.id && (
                                                <div className="absolute right-6 top-10 z-20 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1 text-left" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => { setEditUser(u); setAddModal(true); setOpenMenu(null); }}
                                                        className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4 text-slate-400" /> Edit
                                                    </button>
                                                    {!isSelf && (
                                                        <>
                                                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                                            <button
                                                                onClick={() => { setDeleteUser(u); setOpenMenu(null); }}
                                                                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Remove
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {total > 0 ? `Showing ${startRow} to ${endRow} of ${total.toLocaleString()} results` : 'No results'}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" /> Previous
                        </button>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let p;
                            if (totalPages <= 5) p = i + 1;
                            else if (page <= 3) p = i + 1;
                            else if (page >= totalPages - 2) p = totalPages - 4 + i;
                            else p = page - 2 + i;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w-8 h-8 rounded-lg border text-sm font-medium transition-colors ${
                                        page === p
                                            ? 'bg-primary-600 border-primary-600 text-white'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Modals ─────────────────────────────────────────────────── */}
            <UserModal
                open={addModal || !!editUser}
                onClose={() => { setAddModal(false); setEditUser(null); }}
                onSave={handleSave}
                editUser={editUser}
            />
            {deleteUser && (
                <ConfirmDeleteModal
                    title="Delete User"
                    description={
                        <>
                            Are you sure you want to remove{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">"{deleteUser.name}"</span>?
                            {' '}This action cannot be undone.
                        </>
                    }
                    onClose={() => setDeleteUser(null)}
                    onConfirm={() => handleDelete(deleteUser.id)}
                />
            )}
        </div>
    );
}
