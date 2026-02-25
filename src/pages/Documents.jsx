import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Upload, Search, LayoutGrid, List, Filter, X, Eye, Download,
    Share2, Trash2, FileText, FileSpreadsheet, FileImage, File,
    FileArchive, ChevronDown, Plus, Clock, Tag, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fileTypeIconMap = {
    PDF: FileText,
    DOCX: FileText,
    XLSX: FileSpreadsheet,
    PPTX: FileText,
    PNG: FileImage,
    JPG: FileImage,
    MD: File,
    ZIP: FileArchive,
};

const fileTypeColors = {
    PDF: 'text-red-500',
    DOCX: 'text-blue-500',
    XLSX: 'text-green-500',
    PPTX: 'text-orange-500',
    PNG: 'text-purple-500',
    JPG: 'text-purple-500',
    MD: 'text-gray-500',
    ZIP: 'text-yellow-600',
};

const fileTypes = ['All', 'PDF', 'DOCX', 'XLSX', 'PPTX', 'PNG', 'MD', 'ZIP'];
const categories = ['All', 'Tài liệu', 'Hợp đồng', 'Báo cáo', 'Biên bản', 'Quy trình', 'Khác'];

export default function Documents() {
    const { authFetch } = useAuth();
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
    const fileInput = useRef(null);

    // Fetch documents from API
    useEffect(() => {
        fetchDocuments();
    }, [typeFilter, categoryFilter]);

    const fetchDocuments = async () => {
        try {
            const params = new URLSearchParams();
            if (typeFilter && typeFilter !== 'All') params.append('type', typeFilter);
            if (categoryFilter && categoryFilter !== 'All') params.append('category', categoryFilter);
            const qs = params.toString();
            const res = await authFetch(`/api/documents${qs ? '?' + qs : ''}`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    const filteredDocs = documents.filter((doc) => {
        const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase()) ||
            (doc.tags && doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase())));
        return matchesSearch;
    });

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
        else if (e.type === 'dragleave') setDragActive(false);
    }, []);

    const handleFiles = async (files) => {
        if (!files || files.length === 0) return;
        setUploading(true);

        try {
            const formData = new FormData();
            for (const file of files) {
                formData.append('files', file);
            }
            // Send category and tags as form fields
            formData.append('category', uploadCategory);
            if (uploadTags.trim()) {
                formData.append('tags', uploadTags.trim());
            }

            const res = await authFetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchDocuments();
                setShowUpload(false);
                setUploadCategory('Tài liệu');
                setUploadTags('');
            } else {
                const err = await res.json();
                alert(err.detail || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragActive(false);
        const files = e.dataTransfer?.files;
        if (files) handleFiles(files);
    }, [uploadCategory, uploadTags]);

    const handleFileInput = (e) => {
        const files = e.target.files;
        if (files) handleFiles(files);
    };

    const handleDelete = async (id) => {
        try {
            const res = await authFetch(`/api/documents/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setDocuments(prev => prev.filter(d => d.id !== id));
            } else {
                const err = await res.json();
                alert(err.detail || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
        setDeleteTarget(null);
    };

    const handleDownload = async (doc) => {
        try {
            const res = await authFetch(`/api/documents/${doc.id}/download`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.name;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                const err = await res.json();
                alert(err.detail || 'Download failed');
            }
        } catch (err) {
            console.error('Download failed:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{filteredDocs.length} documents found</p>
                </div>
                <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="btn-primary flex items-center gap-2 w-fit"
                >
                    <Plus className="w-4 h-4" />
                    Upload Files
                </button>
            </div>

            {/* Upload Zone */}
            {showUpload && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Upload options bar */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</label>
                            <div className="relative">
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    className="input-field !py-2 !pr-8 !w-auto text-sm appearance-none cursor-pointer"
                                >
                                    {categories.filter(c => c !== 'All').map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</label>
                            <input
                                type="text"
                                value={uploadTags}
                                onChange={(e) => setUploadTags(e.target.value)}
                                placeholder="e.g. finance, Q1, report"
                                className="input-field !py-2 text-sm flex-1"
                            />
                        </div>
                        <button
                            onClick={() => setShowUpload(false)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-auto"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Drop zone */}
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        className={`p-12 text-center transition-all duration-300 ${dragActive
                            ? 'bg-primary-600/5 dark:bg-primary-600/10'
                            : ''
                            }`}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                            <Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
                        </div>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            {uploading ? 'Uploading...' : dragActive ? 'Drop files here' : 'Drag & drop files here'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                        <button
                            onClick={() => fileInput.current?.click()}
                            className="btn-secondary text-sm"
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Browse Files'}
                        </button>
                        <input ref={fileInput} type="file" multiple className="hidden" onChange={handleFileInput} />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                            Supports PDF, DOCX, XLSX, PPTX, PNG, JPG, MD, ZIP — Max 50MB per file
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search documents by name or tag..."
                        className="input-field !pl-11"
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* Type filter */}
                    <div className="relative">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="input-field !pr-10 !w-auto appearance-none cursor-pointer"
                        >
                            {fileTypes.map(type => (
                                <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Category filter */}
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="input-field !pr-10 !w-auto appearance-none cursor-pointer"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setView('table')}
                            className={`p-2.5 transition-colors ${view === 'table'
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-900'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setView('grid')}
                            className={`p-2.5 transition-colors ${view === 'grid'
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-900'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table View */}
            {view === 'table' && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Size</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Tags</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredDocs.map((doc) => {
                                    const Icon = fileTypeIconMap[doc.type] || File;
                                    const colorClass = fileTypeColors[doc.type] || 'text-gray-500';
                                    return (
                                        <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Icon className={`w-5 h-5 ${colorClass} flex-shrink-0`} />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] lg:max-w-xs">
                                                        {doc.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 ${colorClass}`}>
                                                    {doc.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden md:table-cell">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary-100 dark:bg-secondary-500/20 text-secondary-700 dark:text-secondary-300">
                                                    {doc.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{doc.size}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">{doc.owner}</td>
                                            <td className="px-6 py-4 hidden lg:table-cell">
                                                {doc.department && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-300">
                                                        <Building2 className="w-3 h-3" />
                                                        {doc.department}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 hidden xl:table-cell">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {(doc.tags || []).slice(0, 2).map(tag => (
                                                        <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-primary-600/10 text-primary-600 dark:bg-primary-600/20 dark:text-primary-400 font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {doc.date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button title="View" className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800 dark:hover:text-secondary-400 transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button title="Download" onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-gray-800 transition-colors">
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button title="Share" className="p-1.5 rounded-lg text-gray-400 hover:text-secondary-500 hover:bg-secondary-50 dark:hover:bg-gray-800 transition-colors">
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                    <button title="Delete" onClick={() => setDeleteTarget(doc.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredDocs.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No documents found</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            )}

            {/* Grid View */}
            {view === 'grid' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocs.map((doc) => {
                        const Icon = fileTypeIconMap[doc.type] || File;
                        const colorClass = fileTypeColors[doc.type] || 'text-gray-500';
                        return (
                            <div key={doc.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${colorClass}`} />
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button title="Download" onClick={() => handleDownload(doc)} className="p-1.5 rounded-lg text-gray-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-gray-800 transition-colors">
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button title="Delete" onClick={() => setDeleteTarget(doc.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                                    {doc.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {doc.size} • {doc.date}
                                </p>
                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <span className="px-2 py-0.5 rounded-md text-xs bg-secondary-100 dark:bg-secondary-500/20 text-secondary-700 dark:text-secondary-300 font-medium">
                                        {doc.category}
                                    </span>
                                    {doc.department && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-accent-100 dark:bg-accent-500/20 text-accent-700 dark:text-accent-300 font-medium">
                                            <Building2 className="w-2.5 h-2.5" />
                                            {doc.department}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {(doc.tags || []).slice(0, 2).map(tag => (
                                        <span key={tag} className="px-2 py-0.5 rounded-md text-xs bg-primary-600/10 text-primary-600 dark:bg-primary-600/20 dark:text-primary-400 font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-100 dark:border-gray-800 animate-fade-in">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Document</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                            Are you sure you want to delete this document? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteTarget)}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
