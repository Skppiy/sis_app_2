import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
// Use your env configuration
import { env } from '@/config/env';
const API_BASE_URL = env.apiBase;
// Context
const AuthContext = createContext(undefined);
// Provider Component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [activeSchool, setActiveSchool] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // Check for existing token on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
            setToken(savedToken);
            // Validate token with backend
            fetchUserProfile(savedToken);
        }
        else {
            setIsLoading(false);
        }
    }, []);
    // Fetch user profile with token
    const fetchUserProfile = async (authToken) => {
        try {
            // Use /auth/context instead of /auth/me to get full context including school info
            const response = await fetch(`${API_BASE_URL}/auth/context`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const result = await response.json();
                // Backend returns { user: { ... }, roles: [...], schools: [...] }
                // Extract school_id from roles (use first active role's school_id)
                let schoolId = '';
                if (result.roles && result.roles.length > 0) {
                    const roles = result.roles;
                    const activeRole = roles.find(r => r.is_active) || roles[0];
                    schoolId = activeRole.school_id;
                }
                // Extract role from roles array (use first active role)
                let userRole = 'student';
                if (result.roles && result.roles.length > 0) {
                    const roles = result.roles;
                    const activeRole = roles.find(r => r.is_active) || roles[0];
                    // Map backend role to frontend role
                    if (activeRole.role.toLowerCase().includes('admin') ||
                        activeRole.role.toLowerCase().includes('principal') ||
                        activeRole.role.toLowerCase().includes('staff')) {
                        userRole = 'admin';
                    }
                    else if (activeRole.role.toLowerCase().includes('teacher')) {
                        userRole = 'teacher';
                    }
                }
                // Create user object with school_id
                const userWithSchool = {
                    id: result.user.id,
                    email: result.user.email,
                    first_name: result.user.first_name,
                    last_name: result.user.last_name,
                    role: userRole,
                    school_id: schoolId
                };
                setUser(userWithSchool);
                // Fetch and set active school if we have a school_id
                if (schoolId) {
                    try {
                        const schoolResponse = await fetch(`${API_BASE_URL}/schools/${schoolId}`, {
                            headers: {
                                'Authorization': `Bearer ${authToken}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        if (schoolResponse.ok) {
                            const schoolData = await schoolResponse.json();
                            setActiveSchool({
                                id: schoolData.id,
                                name: schoolData.name,
                                code: schoolData.code || schoolData.name.substring(0, 3).toUpperCase()
                            });
                        }
                    }
                    catch (error) {
                        console.error('Error fetching school details:', error);
                        // Set a basic school object with just the ID if fetch fails
                        setActiveSchool({
                            id: schoolId,
                            name: 'School',
                            code: 'SCH'
                        });
                    }
                }
            }
            else {
                // Token invalid, clear it
                localStorage.removeItem('token');
                setToken(null);
            }
        }
        catch (error) {
            console.error('Error fetching user profile:', error);
            localStorage.removeItem('token');
            setToken(null);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Login function - FIXED for form data
    const login = async (email, password) => {
        setIsLoading(true);
        try {
            // Create form data as expected by OAuth2PasswordRequestForm
            const formData = new FormData();
            formData.append('username', email); // OAuth2 expects 'username' not 'email'
            formData.append('password', password);
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                body: formData, // Send as form data, not JSON
                // Don't set Content-Type header - let browser set it for FormData
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || 'Login failed');
            }
            const data = await response.json();
            const authToken = data.access_token;
            if (!authToken) {
                throw new Error('No token received from server');
            }
            // Save token
            localStorage.setItem('token', authToken);
            setToken(authToken);
            // Fetch user profile after successful login
            await fetchUserProfile(authToken);
        }
        catch (error) {
            setIsLoading(false);
            throw error;
        }
    };
    // Logout function
    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setActiveSchool(null);
        window.location.href = '/login';
    };
    const isAuthenticated = !!token && !!user;
    const value = {
        user,
        activeSchool,
        isAuthenticated,
        isLoading,
        login,
        logout,
        token,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
// Hook to use auth context - Named export for HMR compatibility
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
