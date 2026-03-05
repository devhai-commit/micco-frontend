import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trash2, Eye, CheckCircle2, Copy, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/shared/Breadcrumb';
import DocumentActionBar from '../components/document-view/DocumentActionBar';
import DocumentPreview from '../components/document-view/DocumentPreview';
import DocumentInfoSidebar from '../components/document-view/DocumentInfoSidebar';

import { getExt, getCategoryLabel } from '../utils/formatters';

// ── Main ───────────────────────────────────────────────────────────────────────
export default function DocumentView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [shareModal, setShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const previewUrlRef = useRef(null);
    const setPreview = (url) => {
        previewUrlRef.current = url;
        setPreviewUrl(url);
    };

    useEffect(() => {
        fetchDoc();
        return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
    }, [id]);

    const fetchDoc = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`/api/documents/${id}`);
            if (!res.ok) { navigate('/documents'); return; }
            const data = await res.json();
            setDoc(data);
            const ext = data.type || getExt(data.name);
            if (['PDF', 'PNG', 'JPG'].includes(ext)) fetchPreview(data.id, ext);
        } catch { navigate('/documents'); }
        finally { setLoading(false); }
    };

    const fetchPreview = async (docId, ext) => {
        try {
            const res = await authFetch(`/api/documents/${docId}/download`);
            if (!res.ok) return;
            const blob = await res.blob();
            const mime = ext === 'PDF' ? 'application/pdf' : `image/${ext.toLowerCase()}`;
            setPreview(URL.createObjectURL(new Blob([blob], { type: mime })));
        } catch { /* no preview */ }
    };

    const handleDownload = async () => {
        try {
            const res = await authFetch(`/api/documents/${doc.id}/download`);
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = doc.name; a.click();
            URL.revokeObjectURL(url);
        } catch { /* silent */ }
    };

    const handleDelete = async () => {
        try {
            const res = await authFetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
            if (res.ok) navigate('/documents');
        } catch { /* silent */ }
        setDeleteModal(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <>
            <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents', href: '/documents' }, { label: '…' }]} />
            <div className="-mx-4 lg:-mx-8 -mt-4 lg:-mt-8 flex items-center justify-center" style={{ height: 'calc(100vh - 4rem)' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading document…</p>
                </div>
            </div>
            </>
        );
    }

    const ext = doc?.type || getExt(doc?.name);
    const catLabel = getCategoryLabel(doc?.category);
    const tags = Array.isArray(doc?.tags)
        ? doc.tags
        : (doc?.tags ? String(doc.tags).split(',').map(t => t.trim()).filter(Boolean) : []);

    const versions = [
        { label: 'V 2.1', note: 'Current', user: doc?.owner || 'You', time: doc?.date || doc?.created_at, current: true },
        { label: 'V 2.0', user: doc?.owner || 'System', time: doc?.created_at, current: false },
        { label: 'V 1.0', user: 'System', time: doc?.created_at, current: false },
    ];
    const activity = [
        { icon: <Eye className="w-4 h-4" />, bg: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400', user: doc?.owner || 'You', action: 'uploaded this document', time: doc?.created_at },
        { icon: <Info className="w-4 h-4" />, bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400', user: 'System', action: 'indexed document for AI search', time: doc?.created_at },
    ];

    return (
        // Break out of layout padding for full-bleed layout
        <div className="-mx-4 lg:-mx-8 -mt-4 lg:-mt-8 flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="px-8 pt-3">
                <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documents', href: '/documents' }, { label: doc?.name || '…' }]} />
            </div>

            <DocumentActionBar
                doc={doc}
                catLabel={catLabel}
                ext={ext}
                previewUrl={previewUrl}
                onDownload={handleDownload}
                onShareClick={() => setShareModal(true)}
                onDeleteClick={() => setDeleteModal(true)}
            />

            {/* ── Main body ─────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Preview pane */}
                <div className="flex-1 p-8 bg-slate-200 dark:bg-slate-950 overflow-y-auto">
                    <DocumentPreview doc={doc} previewUrl={previewUrl} />
                </div>

                <DocumentInfoSidebar
                    doc={doc}
                    versions={versions}
                    activity={activity}
                    tags={tags}
                    ext={ext}
                    catLabel={catLabel}
                />
            </div>

            {/* ── Status footer ──────────────────────────────────────── */}
            <footer className="shrink-0 h-8 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> All changes saved
                    </span>
                    {doc?.id && <span>ID: DOC-{String(doc.id).padStart(4, '0')}</span>}
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleCopyLink} className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">Enterprise Docs</span>
                </div>
            </footer>

            {/* ── Delete modal ─────────────────────────────────────── */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-1">Delete Document</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-200">"{doc?.name}"</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Share modal ──────────────────────────────────────── */}
            {shareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShareModal(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Document</h3>
                            <button onClick={() => setShareModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">✕</button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Document Link</label>
                            <div className="flex gap-2">
                                <input readOnly value={window.location.href}
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 outline-none" />
                                <button onClick={handleCopyLink}
                                    className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors flex items-center gap-1.5">
                                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
                            Share with anyone in your organization who has access.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
