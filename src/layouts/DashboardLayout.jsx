import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/logo.png';
import {
    LayoutDashboard, FolderOpen, Upload, MessageSquare, BookOpen, Building2,
    X, Sun, Moon, Bell,
    Search, LogOut, ChevronDown, FileText,
    ChevronLeft, ChevronRight, ShieldCheck, ClipboardCheck
} from 'lucide-react';

const sidebarItems = [
    { label: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard, desc: 'Thống kê & tổng hợp' },
    { label: 'Tài liệu', path: '/documents', icon: FolderOpen, desc: 'Tất cả tệp của bạn' },
    { label: 'Tri thức', path: '/knowledge', icon: BookOpen, desc: 'Cơ sở tri thức' },
    { label: 'Trợ lý AI', path: '/chat', icon: MessageSquare, desc: 'Trò chuyện với tài liệu' },
];

export default function DashboardLayout() {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout, authFetch } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (user?.role !== 'Admin' && user?.role !== 'Trưởng phòng') return;
        authFetch('/api/approvals/count')
            .then(r => r.ok ? r.json() : null)
            .then(data => data && setPendingCount(data.count || 0))
            .catch(() => { });
    }, [user?.role]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const SidebarContent = ({ showCloseButton = false }) => (
        <div className="flex flex-col h-full relative">
            {/* Logo & Brand */}
            <div className={`px-6 py-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md  flex items-center justify-center shadow-md">
                        <img src={Logo} alt="Micco" className="w-10 h-10" />
                    </div>
                    {sidebarOpen && (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                Micco
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Nền tảng quản lý tri thức
                            </span>
                        </div>
                    )}
                </div>
                {showCloseButton && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200
                                ${sidebarOpen ? 'justify-start' : 'justify-center'}
                                ${isActive
                                    ? 'bg-primary-600 text-white dark:bg-secondary-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-secondary-400'
                                }
                            `}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && (
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium leading-tight">{item.label}</span>
                                    <span className={`text-xs leading-tight truncate ${isActive ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>{item.desc}</span>
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Approvals Link — visible to Admin & Trưởng phòng */}
            {(user?.role === 'Admin' || user?.role === 'Trưởng phòng') && (
                <div className="px-3 pb-2">
                    <Link
                        to="/approvals"
                        onClick={() => setMobileOpen(false)}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200
                            ${sidebarOpen ? 'justify-start' : 'justify-center'}
                            ${location.pathname === '/approvals'
                                ? 'bg-primary-600 text-white dark:bg-secondary-500'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-secondary-400'
                            }
                        `}
                    >
                        <ClipboardCheck className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && (
                            <span className="text-sm font-medium flex-1">Phê duyệt</span>
                        )}
                        {pendingCount > 0 && (
                            <span className="ml-auto min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                                {pendingCount}
                            </span>
                        )}
                    </Link>
                </div>
            )}

            {/* Admin Links */}
            {user?.role === 'Admin' && (
                <div className="px-3 pb-2 space-y-1">
                    <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200
                            ${sidebarOpen ? 'justify-start' : 'justify-center'}
                            ${location.pathname === '/admin'
                                ? 'bg-primary-600 text-white dark:bg-secondary-500'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-secondary-400'
                            }
                        `}
                    >
                        <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm font-medium">Quản trị</span>}
                    </Link>
                    <Link
                        to="/departments"
                        onClick={() => setMobileOpen(false)}
                        className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200
                            ${sidebarOpen ? 'justify-start' : 'justify-center'}
                            ${location.pathname === '/departments'
                                ? 'bg-primary-600 text-white dark:bg-secondary-500'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-gray-800 dark:hover:text-secondary-400'
                            }
                        `}
                    >
                        <Building2 className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm font-medium">Phòng ban</span>}
                    </Link>
                </div>
            )}

            {/* Upload Button */}
            <div className="px-4 pb-6">
                <Link
                    to="/documents"
                    className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-md transition-all duration-200
                        bg-primary-600 hover:bg-primary-700 text-white
                        ${sidebarOpen ? 'justify-center' : 'justify-center'}
                    `}
                >
                    <Upload className="w-5 h-5" />
                    {sidebarOpen && <span className="text-sm font-semibold">Tải lên ngay</span>}
                </Link>
            </div>

            {/* Toggle Button (Desktop only) */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`
                    hidden lg:flex absolute -right-3 top-20 w-6 h-6 
                    bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700
                    rounded-full items-center justify-center
                    text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white
                    shadow-md transition-all duration-200 hover:scale-110
                `}
            >
                {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex">
            {/* Desktop Sidebar */}
            <aside
                className={`
                    hidden lg:flex flex-col fixed top-0 left-0 h-screen 
                    bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
                    z-30 transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'w-64' : 'w-20'}
                `}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileOpen(false)}
                    />
                    <aside className="relative w-72 h-full bg-white dark:bg-gray-900 shadow-2xl animate-slide-in">
                        <SidebarContent showCloseButton={true} />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Top Bar */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between px-4 lg:px-8 h-16">
                        <div className="flex items-center gap-4 flex-1">
                            {/* <button
                                onClick={() => {
                                    if (window.innerWidth < 1024) setMobileOpen(true);
                                    else setSidebarOpen(!sidebarOpen);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button> */}
                            <div className="hidden sm:flex flex-1 items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-md px-3.5 py-2 max-w-md">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tài liệu..."
                                    className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300 w-full placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                                aria-label="Toggle dark mode"
                            >
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                            </button>

                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                                        {user?.name?.split(' ').map(n => n[0]).join('') || 'AJ'}
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 top-12 w-44 bg-white dark:bg-gray-900 rounded-md shadow-lg border border-gray-200 dark:border-gray-800 py-1 animate-fade-in">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
