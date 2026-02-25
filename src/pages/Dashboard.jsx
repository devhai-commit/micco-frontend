import { useState, useEffect, useRef } from 'react';
import { FileText, HardDrive, Upload, Users, TrendingUp, Clock, Eye, Download, Trash2 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';

function AnimatedCounter({ target, suffix = '', prefix = '' }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const num = typeof target === 'string' ? parseFloat(target) : target;
        if (isNaN(num)) { setCount(0); return; }
        const duration = 2000;
        const steps = 60;
        const stepTime = duration / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += num / steps;
            if (current >= num) {
                setCount(num);
                clearInterval(timer);
            } else {
                setCount(Math.round(current * 10) / 10);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [target]);

    const display = typeof target === 'string' && target.includes('.')
        ? count.toFixed(1)
        : Math.round(count).toLocaleString();

    return <span>{prefix}{display}{suffix}</span>;
}

export default function Dashboard() {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState({ totalFiles: 0, storageUsed: '0 KB', recentUploads: 0, teamMembers: 0 });
    const [uploadsData, setUploadsData] = useState([]);
    const [storageData, setStorageData] = useState([]);
    const [recentDocs, setRecentDocs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, uploadsRes, storageRes, docsRes] = await Promise.all([
                authFetch('/api/dashboard/stats'),
                authFetch('/api/dashboard/uploads-over-time'),
                authFetch('/api/dashboard/storage-by-type'),
                authFetch('/api/documents'),
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (uploadsRes.ok) setUploadsData(await uploadsRes.json());
            if (storageRes.ok) setStorageData(await storageRes.json());
            if (docsRes.ok) {
                const docs = await docsRes.json();
                setRecentDocs(docs.slice(0, 5));
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Parse storage value for AnimatedCounter
    const storageNum = parseFloat(stats.storageUsed) || 0;
    const storageSuffix = stats.storageUsed.replace(/[\d.]/g, '').trim() || 'KB';

    const statCards = [
        { label: 'Total Files', value: stats.totalFiles, icon: FileText, color: 'from-primary-600 to-secondary-500', suffix: '', prefix: '' },
        { label: 'Storage Used', value: storageNum, icon: HardDrive, color: 'from-secondary-500 to-secondary-600', suffix: ` ${storageSuffix}`, prefix: '' },
        { label: 'Recent Uploads', value: stats.recentUploads, icon: Upload, color: 'from-accent-500 to-accent-600', suffix: '', prefix: '' },
        { label: 'Team Members', value: stats.teamMembers, icon: Users, color: 'from-amber-500 to-amber-600', suffix: '', prefix: '' },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Welcome back! Here's an overview of your workspace.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 card-hover">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <TrendingUp className="w-4 h-4 text-accent-500" />
                            </div>
                            <p className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">
                                <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Uploads Over Time */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Uploads Over Time</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={uploadsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                                <YAxis stroke="#94A3B8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="uploads"
                                    stroke="#4F46E5"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 7, fill: '#4F46E5' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Storage by Type */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Storage by Type</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={storageData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                                <XAxis dataKey="type" stroke="#94A3B8" fontSize={12} />
                                <YAxis stroke="#94A3B8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1E293B',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#fff',
                                        fontSize: '13px',
                                    }}
                                    formatter={(value) => [`${value} GB`, 'Size']}
                                />
                                <Bar dataKey="size" radius={[8, 8, 0, 0]}>
                                    {storageData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Documents</h3>
                    <button className="text-sm text-primary-600 dark:text-secondary-400 hover:underline font-medium">
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Size</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentDocs.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] lg:max-w-none">
                                                {doc.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 hidden sm:table-cell">
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-600/10 text-primary-600 dark:bg-primary-600/20 dark:text-primary-400">
                                            {doc.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">{doc.size}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {doc.date}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800 dark:hover:text-secondary-400 transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-gray-800 transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-gray-800 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
