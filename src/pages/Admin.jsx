import { useState, useEffect, useRef } from 'react';
import {
    Users, HardDrive, Zap,
    Plus,
    CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/admin/StatCard';
import UserModal from '../components/admin/UserModal';
import UsersTable, { PAGE_SIZE } from '../components/admin/UsersTable';
import ConfirmDeleteModal from '../components/shared/ConfirmDeleteModal';
import Breadcrumb from '../components/shared/Breadcrumb';

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
                showToast(isEdit ? `Cập nhật ${form.name} thành công` : `Thêm ${form.name} thành công`);
            } else {
                const err = await res.json();
                showToast(err.detail || 'Thao tác thất bại', 'error');
            }
        } catch { showToast('Có lỗi xảy ra', 'error'); }
    };

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
            if (res.ok || res.status === 204) {
                setDeleteUser(null);
                await fetchUsers();
                await fetchStats();
                showToast('Xóa người dùng thành công');
            } else {
                const err = await res.json();
                showToast(err.detail || 'Xóa thất bại', 'error');
            }
        } catch { showToast('Xóa thất bại', 'error'); }
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
        { icon: Users, label: 'Tổng người dùng', value: stats.totalUsers?.toLocaleString(), change: stats.totalUsersChange, positive: true },
        { icon: HardDrive, label: 'Dung lượng dùng', value: stats.storageUsed, change: stats.storageChange, positive: true },
        { icon: Zap, label: 'Phiên hoạt động', value: stats.activeSessions, change: stats.activeSessionsChange, positive: false },
    ] : [];

    return (
        <div className="space-y-8">

            {/* ── Breadcrumb ─────────────────────────────────────────────── */}
            <Breadcrumb items={[
                { label: 'Tổng quan', href: '/dashboard' },
                { label: 'Quản trị' },
            ]} />

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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Tổng quan hệ thống</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Quản lý người dùng, vai trò và hoạt động hệ thống</p>
                </div>
                <button
                    onClick={() => { setEditUser(null); setAddModal(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm người dùng mới
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
            <UsersTable
                users={users}
                total={total}
                page={page}
                totalPages={totalPages}
                search={search}
                roleFilter={roleFilter}
                openMenu={openMenu}
                currentUserId={currentUser?.id}
                onSearchChange={setSearch}
                onRoleFilterChange={setRoleFilter}
                onExport={handleExport}
                onPageChange={setPage}
                onOpenMenu={setOpenMenu}
                onEdit={(u) => { setEditUser(u); setAddModal(true); }}
                onDelete={setDeleteUser}
                isActive={isActive}
            />

            {/* ── Modals ─────────────────────────────────────────────────── */}
            <UserModal
                open={addModal || !!editUser}
                onClose={() => { setAddModal(false); setEditUser(null); }}
                onSave={handleSave}
                editUser={editUser}
            />
            {deleteUser && (
                <ConfirmDeleteModal
                    title="Xóa người dùng"
                    description={
                        <>
                            Bạn có chắc chắn muốn xóa{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">"{deleteUser.name}"</span>?
                            {' '}Hành động này không thể hoàn tác.
                        </>
                    }
                    onClose={() => setDeleteUser(null)}
                    onConfirm={() => handleDelete(deleteUser.id)}
                />
            )}
        </div>
    );
}
