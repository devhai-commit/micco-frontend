import { useState, useEffect } from 'react';
import { FileText, HardDrive, Upload, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumb from '../components/shared/Breadcrumb';
import DashboardStatCard from '../components/dashboard/DashboardStatCard';
import UploadsChart from '../components/dashboard/UploadsChart';
import StorageChart from '../components/dashboard/StorageChart';
import RecentDocumentsTable from '../components/dashboard/RecentDocumentsTable';

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
        { label: 'Tổng tệp', value: stats.totalFiles, icon: FileText, color: 'from-primary-600 to-secondary-500', suffix: '', prefix: '', change: '+8%' },
        { label: 'Dung lượng dùng', value: storageNum, icon: HardDrive, color: 'from-secondary-500 to-secondary-600', suffix: ` ${storageSuffix}`, prefix: '', change: '+5%' },
        { label: 'Tải lên gần đây', value: stats.recentUploads, icon: Upload, color: 'from-accent-500 to-accent-600', suffix: '', prefix: '', change: '+12%' },
        { label: 'Thành viên', value: stats.teamMembers, icon: Users, color: 'from-amber-500 to-amber-600', suffix: '', prefix: '', change: '+3%' },
    ];

    return (
        <div className="space-y-8">
            <Breadcrumb items={[{ label: 'Tổng quan' }]} />

            {/* Page Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Chào mừng trở lại! Đây là tổng quan không gian làm việc của bạn.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <DashboardStatCard key={stat.label} {...stat} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-4">
                <UploadsChart data={uploadsData} />
                <StorageChart data={storageData} />
            </div>

            {/* Recent Documents */}
            <RecentDocumentsTable docs={recentDocs} />
        </div>
    );
}
