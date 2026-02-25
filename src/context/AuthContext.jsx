import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const API_BASE = '/api';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('docvault_token'));
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Auto-login on mount if token exists
    useEffect(() => {
        if (token) {
            fetchUser(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async (accessToken) => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setIsAuthenticated(true);
            } else {
                // Token expired or invalid
                localStorage.removeItem('docvault_token');
                setToken(null);
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (err) {
            console.error('Auth check failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Login failed');
            }

            const data = await res.json();
            localStorage.setItem('docvault_token', data.access_token);
            setToken(data.access_token);
            await fetchUser(data.access_token);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const register = async (name, email, password) => {
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Registration failed');
            }

            const data = await res.json();
            localStorage.setItem('docvault_token', data.access_token);
            setToken(data.access_token);
            await fetchUser(data.access_token);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        localStorage.removeItem('docvault_token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    // Helper for authenticated API calls
    // Reads token from localStorage directly to avoid React state race conditions
    const authFetch = async (url, options = {}) => {
        const currentToken = localStorage.getItem('docvault_token');
        const headers = {
            ...options.headers,
            Authorization: `Bearer ${currentToken}`,
        };
        return fetch(url, { ...options, headers });
    };

    return (
        <AuthContext.Provider value={{
            user, isAuthenticated, loading, token,
            login, register, logout, authFetch
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
