import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import KnowledgeCard from '../components/knowledge/KnowledgeCard';
import KnowledgeForm from '../components/knowledge/KnowledgeForm';
import {
    BookOpen, Plus, Search, Filter, ChevronLeft, ChevronRight,
    Loader2, X, Lock, Globe, Edit, Trash2,
} from 'lucide-react';

const CATEGORIES = ['Tất cả', 'Chung', 'Quy trình', 'Hướng dẫn', 'Tiêu chuẩn', 'Quy định', 'Kinh nghiệm', 'Vật tư', 'Nhà cung cấp', 'An toàn', 'Kỹ thuật'];

export default function Knowledge() {
    const { authFetch } = useAuth();

    const [entries, setEntries] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Tất cả');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [saving, setSaving] = useState(false);

    // View state
    const [viewEntry, setViewEntry] = useState(null);

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);

    const pageSize = 12;

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, page_size: pageSize });
            if (search) params.set('search', search);
            if (category !== 'Tất cả') params.set('category', category);

            const res = await authFetch(`/api/knowledge?${params}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data.items);
                setTotal(data.total);
            }
        } catch (err) {
            console.error('Failed to fetch knowledge:', err);
        } finally {
            setLoading(false);
        }
    }, [authFetch, page, search, category]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, category]);

    const handleSave = async (data) => {
        setSaving(true);
        try {
            const url = editEntry ? `/api/knowledge/${editEntry.id}` : '/api/knowledge';
            const method = editEntry ? 'PUT' : 'POST';
            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setShowForm(false);
                setEditEntry(null);
                fetchEntries();
            }
        } catch (err) {
            console.error('Failed to save knowledge:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await authFetch(`/api/knowledge/${deleteTarget.id}`, { method: 'DELETE' });
            if (res.ok) {
                setDeleteTarget(null);
                fetchEntries();
            }
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-7 h-7 text-primary-600 dark:text-secondary-400" />
                        Tri thức
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Quản lý cơ sở tri thức — nhập liệu bằng tay, tự động đồng bộ AI
                    </p>
                </div>
                <button
                    onClick={() => { setEditEntry(null); setShowForm(true); }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Thêm tri thức
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-3.5 py-2 max-w-md">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tri thức..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300 w-full placeholder-gray-400"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                                category === c
                                    ? 'bg-primary-600 text-white dark:bg-secondary-500'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats bar */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {total} tri thức{search || category !== 'Tất cả' ? ' (đã lọc)' : ''}
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-20">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {search || category !== 'Tất cả' ? 'Không tìm thấy kết quả' : 'Chưa có tri thức nào'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {search || category !== 'Tất cả'
                            ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                            : 'Bắt đầu bằng cách thêm tri thức đầu tiên của bạn'}
                    </p>
                    {!search && category === 'Tất cả' && (
                        <button
                            onClick={() => { setEditEntry(null); setShowForm(true); }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm tri thức đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {entries.map((entry) => (
                        <KnowledgeCard
                            key={entry.id}
                            entry={entry}
                            onEdit={(e) => { setEditEntry(e); setShowForm(true); }}
                            onDelete={(e) => setDeleteTarget(e)}
                            onView={(e) => setViewEntry(e)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showForm && (
                <KnowledgeForm
                    entry={editEntry}
                    saving={saving}
                    onSave={handleSave}
                    onClose={() => { setShowForm(false); setEditEntry(null); }}
                />
            )}

            {/* View Modal */}
            {viewEntry && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
                    <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 mx-4">
                        {/* Header */}
                        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-secondary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <BookOpen className="w-5 h-5 text-primary-600 dark:text-secondary-400" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                                        {viewEntry.title}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{viewEntry.category}</span>
                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{viewEntry.owner}</span>
                                        {viewEntry.department && (
                                            <>
                                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{viewEntry.department}</span>
                                            </>
                                        )}
                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(viewEntry.created_at).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        {viewEntry.visibility === 'public' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                <Globe className="w-3 h-3" /> Công khai
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                                <Lock className="w-3 h-3" /> Nội bộ
                                            </span>
                                        )}
                                        {viewEntry.tags?.map((tag) => (
                                            <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                                <button
                                    onClick={() => { setViewEntry(null); setEditEntry(viewEntry); setShowForm(true); }}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-600 dark:hover:text-secondary-400 transition-colors"
                                    title="Chỉnh sửa"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setDeleteTarget(viewEntry); setViewEntry(null); }}
                                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Xóa"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewEntry(null)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        {/* Content */}
                        <div
                            className="p-6 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: viewEntry.content_html }}
                        />
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Xác nhận xóa</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                            Bạn có chắc muốn xóa <strong>"{deleteTarget.title}"</strong>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
