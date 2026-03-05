import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Upload, X, File,
    ChevronDown, CheckCircle2,
    ChevronLeft, ChevronRight, Trash2, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fileTypeIconMap, fileTypeColors, fileTypeBgColors, thumbnailBg } from '../components/documents/fileTypes';
import DocumentsToolbar from '../components/documents/DocumentsToolbar';
import DocumentCard from '../components/documents/DocumentCard';
import DocumentRow from '../components/documents/DocumentRow';
import UploadZone from '../components/documents/UploadZone';
import Breadcrumb from '../components/shared/Breadcrumb';
import { formatBytes, getExt, timeAgo } from '../utils/formatters';

const categories = ['All', 'Tài liệu', 'Hợp đồng', 'Báo cáo', 'Biên bản', 'Quy trình', 'Khác'];
const ROWS_PER_PAGE = 5;


export default function Documents() {
    const { authFetch } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [view, setView] = useState('table');
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dragActive, setDragActive] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState('Tài liệu');
    const [uploadTags, setUploadTags] = useState('');
    const [stagedFiles, setStagedFiles] = useState([]);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [openMenu, setOpenMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { fetchDocuments(); }, [typeFilter, categoryFilter]);
    useEffect(() => { setCurrentPage(1); }, [search, typeFilter, categoryFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = () => setOpenMenu(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const fetchDocuments = async () => {
        try {
            const params = new URLSearchParams();
            if (typeFilter !== 'All') params.append('type', typeFilter);
            if (categoryFilter !== 'All') params.append('category', categoryFilter);
            const qs = params.toString();
            const res = await authFetch(`/api/documents${qs ? '?' + qs : ''}`);
            if (res.ok) setDocuments(await res.json());
        } catch (err) { console.error('Failed to fetch documents:', err); }
    };

    const filteredDocs = documents.filter((doc) =>
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        (doc.tags && doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
    );

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredDocs.length / ROWS_PER_PAGE));
    const pageDocs = filteredDocs.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    // Recent docs: last 4 by date
    const recentDocs = [...documents]
        .sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))
        .slice(0, 4);

    const handleDrag = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else setDragActive(false);
    }, []);

    const stageFiles = (fileList) => {
        if (!fileList?.length) return;
        setStagedFiles(prev => [...prev, ...Array.from(fileList)]);
        setUploadSuccess(false);
    };

    const removeStagedFile = (index) => setStagedFiles(prev => prev.filter((_, i) => i !== index));

    const handleUpload = async () => {
        if (!stagedFiles.length) return;
        setUploading(true); setUploadSuccess(false);
        try {
            const formData = new FormData();
            for (const file of stagedFiles) formData.append('files', file);
            formData.append('category', uploadCategory);
            if (uploadTags.trim()) formData.append('tags', uploadTags.trim());
            const res = await authFetch('/api/documents/upload', { method: 'POST', body: formData });
            if (res.ok) {
                await fetchDocuments();
                setUploadSuccess(true);
                setStagedFiles([]);
                setTimeout(() => { setShowUpload(false); setUploadCategory('Tài liệu'); setUploadTags(''); setUploadSuccess(false); }, 1500);
            } else { const err = await res.json(); alert(err.detail || 'Upload failed'); }
        } catch (err) { console.error('Upload error:', err); alert('Upload failed. Please try again.'); }
        finally { setUploading(false); }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault(); setDragActive(false);
        stageFiles(e.dataTransfer?.files);
    }, []);

    const handleFileInput = (e) => { stageFiles(e.target.files); e.target.value = ''; };

    const closeUploadPanel = () => {
        setShowUpload(false); setStagedFiles([]); setUploadCategory('Tài liệu'); setUploadTags(''); setUploadSuccess(false);
    };

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (res.ok) setDocuments(prev => prev.filter(d => d.id !== id));
            else { const err = await res.json(); alert(err.detail || 'Delete failed'); }
        } catch (err) { console.error('Delete failed:', err); }
        setDeleteTarget(null);
    };

    const handleDownload = async (doc) => {
        try {
            const res = await authFetch(`/api/documents/${doc.id}/download`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = doc.name; a.click();
                window.URL.revokeObjectURL(url);
            } else { const err = await res.json(); alert(err.detail || 'Download failed'); }
        } catch (err) { console.error('Download failed:', err); }
    };

    const totalStagedSize = stagedFiles.reduce((sum, f) => sum + f.size, 0);

    return (
        <div className="space-y-6">
            <Breadcrumb items={[
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Documents' },
            ]} />

            {/* ══════════════ Most Recent Documents ══════════════ */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Most Recent Documents</h2>
                    <button className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                        View All
                    </button>
                </div>

                {recentDocs.length === 0 ? (
                    <div className="flex gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex-1 min-w-0 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 h-40 flex items-center justify-center">
                                <File className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {recentDocs.map((doc) => {
                            const ext = doc.type || getExt(doc.name);
                            const Icon = fileTypeIconMap[ext] || File;
                            const iconColor = fileTypeColors[ext] || 'text-gray-400';
                            const bgGrad = thumbnailBg[ext] || 'from-gray-50 to-gray-100 border-gray-200';
                            return (
                                <div key={doc.id} className="group cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                                    {/* Thumbnail */}
                                    <div className={`relative rounded-xl border bg-gradient-to-br ${bgGrad} h-36 flex items-center justify-center overflow-hidden mb-2 transition-shadow group-hover:shadow-md`}>
                                        <div className="flex flex-col items-center gap-2">
                                            <Icon className={`w-10 h-10 ${iconColor} opacity-60`} />
                                            <span className={`text-xs font-bold ${iconColor} opacity-80`}>{ext}</span>
                                        </div>
                                        {/* File type badge top-right */}
                                        <div className={`absolute top-2 right-2 w-6 h-6 rounded-md ${fileTypeBgColors[ext] || 'bg-gray-100'} flex items-center justify-center`}>
                                            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                        </div>
                                    </div>
                                    {/* Info */}
                                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate" title={doc.name}>{doc.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Modified {timeAgo(doc.date || doc.created_at)}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ══════════════ All Documents ══════════════ */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">

                {/* Table Header Bar */}
                <DocumentsToolbar
                    search={search}
                    onSearchChange={setSearch}
                    view={view}
                    onViewChange={setView}
                    onUploadClick={() => setShowUpload(!showUpload)}
                />

                {/* ─── Upload Panel ─── */}
                {showUpload && (
                    <div className="border-b border-gray-100 dark:border-gray-800">
                        <div className="px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary-600/10 flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-primary-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Upload Documents</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Drag & drop or click to select files</p>
                                </div>
                            </div>
                            <button onClick={closeUploadPanel} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {uploadSuccess ? (
                            <div className="px-6 py-4 bg-green-50 dark:bg-green-500/10 flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-green-700 dark:text-green-300">Files uploaded successfully!</p>
                            </div>
                        ) : (
                            <div className="p-6 space-y-5">
                                <UploadZone
                                    isDragging={dragActive}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onFilesSelected={stageFiles}
                                />

                                {stagedFiles.length > 0 && (
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Selected Files <span className="text-xs font-normal text-gray-400">({stagedFiles.length} • {formatBytes(totalStagedSize)})</span>
                                            </h4>
                                            <button onClick={() => setStagedFiles([])} className="text-xs text-red-500 hover:text-red-600 font-medium">Clear all</button>
                                        </div>
                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                            {stagedFiles.map((file, index) => {
                                                const ext = getExt(file.name);
                                                const Icon = fileTypeIconMap[ext] || File;
                                                return (
                                                    <div key={`${file.name}-${index}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 group">
                                                        <div className={`w-10 h-10 rounded-xl ${fileTypeBgColors[ext] || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                                                            <Icon className={`w-5 h-5 ${fileTypeColors[ext] || 'text-gray-500'}`} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                                                            <p className="text-xs text-gray-400">{formatBytes(file.size)} • {ext}</p>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); removeStagedFile(index); }} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Document Information</h4>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                            <div className="relative">
                                                <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="input-field !pr-10 w-full text-sm appearance-none cursor-pointer">
                                                    {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</label>
                                            <input type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} placeholder="e.g. finance, Q1, report" className="input-field w-full text-sm" />
                                            <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button onClick={closeUploadPanel} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                                    <button onClick={handleUpload} disabled={!stagedFiles.length || uploading} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload {stagedFiles.length > 0 ? `${stagedFiles.length} File${stagedFiles.length !== 1 ? 's' : ''}` : ''}</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Table View ─── */}
                {view === 'table' && (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Date Modified</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Owner</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {pageDocs.length === 0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="px-6 py-14 text-center">
                                                <Search className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No documents found</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {pageDocs.map((doc) => (
                                    <DocumentRow
                                        key={doc.id}
                                        doc={doc}
                                        openMenu={openMenu}
                                        onToggleMenu={(id) => setOpenMenu(openMenu === id ? null : id)}
                                        onView={(d) => navigate(`/documents/${d.id}`)}
                                        onDownload={handleDownload}
                                        onDelete={(id) => setDeleteTarget(id)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ─── Grid View ─── */}
                {view === 'grid' && (
                    <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredDocs.length === 0 && (
                            <div className="col-span-full py-14 text-center">
                                <Search className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No documents found</p>
                            </div>
                        )}
                        {filteredDocs.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onView={(d) => navigate(`/documents/${d.id}`)}
                                onDownload={handleDownload}
                                onDelete={(id) => setDeleteTarget(id)}
                            />
                        ))}
                    </div>
                )}

                {/* ─── Pagination ─── */}
                {filteredDocs.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {Math.min((currentPage - 1) * ROWS_PER_PAGE + 1, filteredDocs.length)} to{' '}
                            {Math.min(currentPage * ROWS_PER_PAGE, filteredDocs.length)} of {filteredDocs.length} documents
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce((acc, p, idx, arr) => {
                                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) =>
                                    p === '...' ? (
                                        <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                                currentPage === p
                                                    ? 'bg-primary-600 text-white'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )
                            }
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                            <span className="ml-2 text-sm text-gray-400 hidden sm:inline">
                                Page {currentPage} of {totalPages}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Delete Modal ─── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-200 dark:border-gray-800 animate-fade-in">
                        <div className="w-10 h-10 rounded-md bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white text-center mb-2">Delete Document</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">Are you sure you want to delete this document? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteTarget)} className="flex-1 px-4 py-2 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
