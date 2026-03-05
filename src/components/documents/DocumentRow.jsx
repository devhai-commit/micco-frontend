import { File, Eye, Download, Share2, Trash2, MoreHorizontal } from 'lucide-react';
import { fileTypeIconMap, fileTypeColors, fileTypeBgColors } from './fileTypes';
import { getExt, formatBytes, formatDate, getInitials, avatarColor, categoryColors, getCategoryLabel } from '../../utils/formatters';

export default function DocumentRow({ doc, openMenu, onToggleMenu, onView, onDownload, onDelete }) {
    const ext = doc.type || getExt(doc.name);
    const Icon = fileTypeIconMap[ext] || File;
    const iconColor = fileTypeColors[ext] || 'text-gray-500';
    const bgColor = fileTypeBgColors[ext] || 'bg-gray-100 dark:bg-gray-800';
    const catLabel = getCategoryLabel(doc.category);
    const catColor = categoryColors[catLabel] || categoryColors['Other'];

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
            {/* Name */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[160px] lg:max-w-xs" title={doc.name}>
                        {doc.name}
                    </span>
                </div>
            </td>
            {/* Category */}
            <td className="px-6 py-4 hidden sm:table-cell">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${catColor}`}>
                    {catLabel}
                </span>
            </td>
            {/* Date Modified */}
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                {formatDate(doc.date || doc.created_at)}
            </td>
            {/* Size */}
            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                {formatBytes(doc.size)}
            </td>
            {/* Owner */}
            <td className="px-6 py-4 hidden lg:table-cell">
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full ${avatarColor(doc.owner)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {getInitials(doc.owner)}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{doc.owner || '—'}</span>
                </div>
            </td>
            {/* Actions — three-dot menu */}
            <td className="px-6 py-4 text-right relative">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleMenu(doc.id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
                {openMenu === doc.id && (
                    <div className="absolute right-6 top-12 z-20 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-1 animate-fade-in" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { onView(doc); onToggleMenu(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Eye className="w-4 h-4 text-gray-400" /> View
                        </button>
                        <button onClick={() => { onDownload(doc); onToggleMenu(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Download className="w-4 h-4 text-gray-400" /> Download
                        </button>
                        <button className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <Share2 className="w-4 h-4 text-gray-400" /> Share
                        </button>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                        <button onClick={() => { onDelete(doc.id); onToggleMenu(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
}
