import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        try {
            const decoded = jwtDecode(token);
            const res = await api.get('/api/auth/user');
            setUser({
                id: res.data.id,
                name: res.data.name,
                email: res.data.email,
                role: res.data.role || decoded.role || 'user'
            });
        } catch (err) {
            console.error('Error loading user:', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const res = await api.post('/api/auth/login', { email, password });
        const { token: newToken, user: userData } = res.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);

        return res.data;
    };

    const register = async (name, email, password) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        const res = await api.post('/api/auth/register', { name, email, password });
        const { token: newToken, user: userData } = res.data;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(newToken);
        setUser(userData);

        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token && !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
