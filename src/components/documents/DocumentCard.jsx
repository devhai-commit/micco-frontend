import { File, Download, Trash2 } from 'lucide-react';
import { fileTypeIconMap, fileTypeColors, thumbnailBg } from './fileTypes';
import { getExt, formatBytes, getInitials, avatarColor, categoryColors, getCategoryLabel } from '../../utils/formatters';

export default function DocumentCard({ doc, onView, onDownload, onDelete }) {
    const ext = doc.type || getExt(doc.name);
    const Icon = fileTypeIconMap[ext] || File;
    const iconColor = fileTypeColors[ext] || 'text-gray-500';
    const bgGrad = thumbnailBg[ext] || 'from-gray-50 to-gray-100 border-gray-200';
    const catLabel = getCategoryLabel(doc.category);
    const catColor = categoryColors[catLabel] || categoryColors['Other'];

    return (
        <div
            className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onView(doc)}
        >
            <div className={`h-32 bg-gradient-to-br ${bgGrad} flex items-center justify-center relative`}>
                <Icon className={`w-10 h-10 ${iconColor} opacity-60`} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onDownload(doc); }}
                        className="p-1.5 rounded-lg bg-white/80 text-gray-600 hover:text-primary-600"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
                        className="p-1.5 rounded-lg bg-white/80 text-gray-600 hover:text-red-500"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <div className="p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1" title={doc.name}>{doc.name}</p>
                <div className="flex items-center justify-between mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${catColor}`}>{catLabel}</span>
                    <span className="text-xs text-gray-400">{formatBytes(doc.size)}</span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                    <div className={`w-5 h-5 rounded-full ${avatarColor(doc.owner)} flex items-center justify-center text-white text-xs font-semibold`}>
                        {getInitials(doc.owner)}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{doc.owner || '—'}</span>
                </div>
            </div>
        </div>
    );
}
