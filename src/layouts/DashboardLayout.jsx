import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, FolderOpen, Upload, MessageSquare,
    Users, Settings, Menu, X, Sun, Moon, Bell,
    Search, LogOut, ChevronDown, FileText
} from 'lucide-react';

const sidebarItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Documents', path: '/documents', icon: FolderOpen },
    { label: 'Upload', path: '/documents', icon: Upload },
    { label: 'Chat Assistant', path: '/chat', icon: MessageSquare },
    { label: 'Teams', path: '/dashboard', icon: Users },
    { label: 'Settings', path: '/dashboard', icon: Settings },
];

export default function DashboardLayout() {
    const { isDark, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-600/30">
                    <FileText className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                        Mic<span className="text-gradient">co</span>
                    </span>
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
                            className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            {sidebarOpen && (
                <div className="p-4 mx-3 mb-4 rounded-xl bg-gradient-to-r from-primary-600/10 to-secondary-500/10 dark:from-primary-600/20 dark:to-secondary-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.name?.split(' ').map(n => n[0]).join('') || 'AJ'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {user?.name || 'Alex Johnson'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user?.role || 'Admin'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-72 h-full bg-white dark:bg-gray-900 shadow-2xl">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Top Bar */}
                <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between px-4 lg:px-8 h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => {
                                    if (window.innerWidth < 1024) setMobileOpen(true);
                                    else setSidebarOpen(!sidebarOpen);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>

                            <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 w-80">
                                <Search className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search documents..."
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
                                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold">
                                        {user?.name?.split(' ').map(n => n[0]).join('') || 'AJ'}
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 top-12 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 py-2 animate-fade-in">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
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
