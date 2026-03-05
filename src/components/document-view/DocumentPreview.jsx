// src/components/document-view/DocumentPreview.jsx
import { Eye, File } from 'lucide-react';
import { fileTypeIconMap, fileTypeColors } from '../documents/fileTypes';

// ── helpers ────────────────────────────────────────────────────────────────────
const categoryLabels = {
    'Tài liệu': 'Document', 'Hợp đồng': 'Contract', 'Báo cáo': 'Report',
    'Biên bản': 'Minutes', 'Quy trình': 'Process', 'Khác': 'Other',
    Report: 'Report', Spreadsheet: 'Spreadsheet',
    'Technical Document': 'Technical Document', Media: 'Media', Archive: 'Archive',
};

function getCategoryLabel(cat) { return categoryLabels[cat] || cat || 'Other'; }

function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExt(name = '') {
    return name.includes('.') ? name.split('.').pop().toUpperCase() : 'FILE';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

// ── DocumentPreview ────────────────────────────────────────────────────────────
function DocumentPreview({ doc, previewUrl }) {
    const ext = doc?.type || getExt(doc?.name);
    const catLabel = getCategoryLabel(doc?.category);

    if (ext === 'PDF' && previewUrl) {
        return (
            <iframe src={previewUrl} title={doc.name} className="w-full h-full rounded border-0" />
        );
    }
    if ((ext === 'PNG' || ext === 'JPG') && previewUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center p-10">
                <img src={previewUrl} alt={doc.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
            </div>
        );
    }

    // Rich simulated document placeholder
    return (
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 shadow-2xl min-h-full p-12 rounded-lg relative">
            {/* Colored top accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-600 dark:bg-primary-500 rounded-t-lg" />
            <div className="flex flex-col gap-8 pt-2">
                {/* Document header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-primary-700 dark:text-primary-400 uppercase tracking-tight">
                            {catLabel}
                        </h2>
                        <p className="text-slate-400 dark:text-slate-500 font-medium text-sm mt-0.5">
                            {doc?.name}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{ext}</p>
                        <p className="text-xs text-slate-400">{formatDate(doc?.created_at || doc?.date)}</p>
                    </div>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800" />
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'File Size', value: formatBytes(doc?.size), sub: ext + ' format' },
                        { label: 'Category',  value: catLabel,               sub: 'Document type' },
                        { label: 'Owner',     value: doc?.owner || '—',      sub: 'Uploaded by'   },
                    ].map((s) => (
                        <div key={s.label} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                            <p className="text-base font-bold text-primary-700 dark:text-primary-400 mt-1 truncate">{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>
                {/* Body */}
                <div className="space-y-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Document Overview</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                        This document is stored securely in Enterprise Docs. Use the action buttons above to
                        download, share, or manage this file. The AI assistant can answer questions about its contents.
                    </p>
                    <div className="space-y-2 pt-2">
                        {[100, 90, 95, 75].map((w, i) => (
                            <div key={i} className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" style={{ width: `${w}%` }} />
                        ))}
                    </div>
                    <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 mt-4">
                        <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                            <Eye className="w-8 h-8" />
                            <p className="text-xs font-medium">Preview not available for {ext} files</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {[85, 70, 90].map((w, i) => (
                            <div key={i} className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" style={{ width: `${w}%` }} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DocumentPreview;
