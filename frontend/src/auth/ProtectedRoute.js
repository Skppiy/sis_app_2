import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useAuth } from '@auth/AuthContext';
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) {
        window.location.href = '/login';
        return null;
    }
    return _jsx(_Fragment, { children: children });
};
