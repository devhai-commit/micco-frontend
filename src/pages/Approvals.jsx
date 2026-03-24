import { useState, useEffect, useCallback } from 'react';
import {
    ClipboardCheck, FileText, BookOpen, Check, X,
    Clock, Globe, Lock, ChevronDown, Loader2, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/shared/Breadcrumb';

export default function Approvals() {
    const { authFetch } = useAuth();
    const [tab, setTab] = useState('documents');
    const [data, setData] = useState({ documents: [], knowledge: [] });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // id of item being acted on
    const [rejectModal, setRejectModal] = useState(null); // { id, type }
    const [rejectNote, setRejectNote] = useState('');
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchPending = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/approvals/pending');
            if (res.ok) setData(await res.json());
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [authFetch]);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const handleApprove = async (type, id) => {
        setActionLoading(`${type}-${id}`);
        try {
            const res = await authFetch(`/api/approvals/${type}/${id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            if (res.ok) {
                showToast('Đã phê duyệt thành công');
                fetchPending();
            } else {
                const err = await res.json();
                showToast(err.detail || 'Thao tác thất bại', 'error');
            }
        } catch { showToast('Có lỗi xảy ra', 'error'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        const { type, id } = rejectModal;
        setActionLoading(`${type}-${id}`);
        try {
            const res = await authFetch(`/api/approvals/${type}/${id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ note: rejectNote }),
            });
            if (res.ok) {
                showToast('Đã từ chối');
                setRejectModal(null);
                setRejectNote('');
                fetchPending();
            } else {
                const err = await res.json();
                showToast(err.detail || 'Thao tác thất bại', 'error');
            }
        } catch { showToast('Có lỗi xảy ra', 'error'); }
        finally { setActionLoading(null); }
    };

    const docCount = data.documents.length;
    const knCount = data.knowledge.length;
    const totalPending = docCount + knCount;

    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: 'Tổng quan', href: '/dashboard' },
                { label: 'Phê duyệt' },
            ]} />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[60] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium
                    ${toast.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                    {toast.type === 'error'
                        ? <X className="w-4 h-4 text-red-500" />
                        : <Check className="w-4 h-4 text-emerald-500" />
                    }
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="w-7 h-7 text-primary-600 dark:text-secondary-400" />
                        Phê duyệt nội dung
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Xem xét và phê duyệt tài liệu, tri thức trước khi đồng bộ AI
                    </p>
                </div>
                <button
                    onClick={fetchPending}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => setTab('documents')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        tab === 'documents'
                            ? 'border-primary-600 text-primary-600 dark:text-secondary-400 dark:border-secondary-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <FileText className="w-4 h-4" />
                    Tài liệu
                    {docCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            {docCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab('knowledge')}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        tab === 'knowledge'
                            ? 'border-primary-600 text-primary-600 dark:text-secondary-400 dark:border-secondary-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    Tri thức
                    {knCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                            {knCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : totalPending === 0 ? (
                <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Không có gì cần phê duyệt</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tất cả nội dung đã được xử lý</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Documents tab */}
                    {tab === 'documents' && (
                        data.documents.length === 0 ? (
                            <p className="text-center py-12 text-sm text-gray-400">Không có tài liệu chờ phê duyệt</p>
                        ) : (
                            data.documents.map(doc => (
                                <ApprovalCard
                                    key={doc.id}
                                    item={doc}
                                    type="documents"
                                    actionLoading={actionLoading}
                                    onApprove={() => handleApprove('documents', doc.id)}
                                    onReject={() => { setRejectModal({ type: 'documents', id: doc.id }); setRejectNote(''); }}
                                />
                            ))
                        )
                    )}
                    {/* Knowledge tab */}
                    {tab === 'knowledge' && (
                        data.knowledge.length === 0 ? (
                            <p className="text-center py-12 text-sm text-gray-400">Không có tri thức chờ phê duyệt</p>
                        ) : (
                            data.knowledge.map(entry => (
                                <ApprovalCard
                                    key={entry.id}
                                    item={entry}
                                    type="knowledge"
                                    actionLoading={actionLoading}
                                    onApprove={() => handleApprove('knowledge', entry.id)}
                                    onReject={() => { setRejectModal({ type: 'knowledge', id: entry.id }); setRejectNote(''); }}
                                />
                            ))
                        )
                    )}
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full mx-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Từ chối nội dung</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Nhập lý do từ chối (tuỳ chọn) để thông báo cho người tải lên.</p>
                        <textarea
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder="Lý do từ chối..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setRejectModal(null)}
                                className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!!actionLoading}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                Từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


function ApprovalCard({ item, type, actionLoading, onApprove, onReject }) {
    const [expanded, setExpanded] = useState(false);
    const isDoc = type === 'documents';
    const isLoading = actionLoading === `${type}-${item.id}`;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-4 flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDoc ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-primary-50 dark:bg-secondary-500/10'
                }`}>
                    {isDoc
                        ? <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        : <BookOpen className="w-5 h-5 text-primary-600 dark:text-secondary-400" />
                    }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {isDoc ? item.name : item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{item.owner}</span>
                                {item.department && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-600">·</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">{item.department}</span>
                                    </>
                                )}
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span className="text-xs text-gray-400">
                                    {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '—'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                    <Clock className="w-3 h-3" />
                                    Chờ phê duyệt
                                </span>
                                {item.visibility === 'public' ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                        <Globe className="w-3 h-3" /> Công khai
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                        <Lock className="w-3 h-3" /> Nội bộ
                                    </span>
                                )}
                                {isDoc && item.size && (
                                    <span className="text-xs text-gray-400">{item.size}</span>
                                )}
                            </div>
                            {/* Preview for knowledge */}
                            {!isDoc && item.content_text && (
                                <div className="mt-2">
                                    <p className={`text-xs text-gray-500 dark:text-gray-400 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
                                        {item.content_text}
                                    </p>
                                    {item.content_text.length > 120 && (
                                        <button
                                            onClick={() => setExpanded(!expanded)}
                                            className="text-xs text-primary-600 dark:text-secondary-400 mt-0.5 flex items-center gap-1"
                                        >
                                            {expanded ? 'Thu gọn' : 'Xem thêm'}
                                            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={onReject}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            >
                                <X className="w-3.5 h-3.5" />
                                Từ chối
                            </button>
                            <button
                                onClick={onApprove}
                                disabled={isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                {isLoading
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Check className="w-3.5 h-3.5" />
                                }
                                Phê duyệt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
