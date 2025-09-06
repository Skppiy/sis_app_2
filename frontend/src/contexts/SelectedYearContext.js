import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
export const SelectedYearContext = createContext(undefined);
export function SelectedYearProvider({ children }) {
    const { user } = useAuth();
    const [selectedYear, setSelectedYearState] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    // DEBUG: Log user data
    console.log('SelectedYearProvider DEBUG:', { user });
    // Check if user has admin role - match backend logic
    const userRole = user?.role?.toLowerCase() || '';
    const isAdmin = userRole.includes('admin') ||
        userRole.includes('principal') ||
        userRole.includes('dean') ||
        userRole.includes('staff');
    // DEBUG: Log role checking
    console.log('Role check DEBUG:', {
        userRole,
        isAdmin,
        roleIncludes: {
            admin: userRole.includes('admin'),
            principal: userRole.includes('principal'),
            dean: userRole.includes('dean'),
            staff: userRole.includes('staff')
        }
    });
    // Load selected year from localStorage on mount
    useEffect(() => {
        if (isAdmin) {
            const savedYearId = localStorage.getItem('selectedAcademicYearId');
            if (savedYearId && availableYears.length > 0) {
                const savedYear = availableYears.find(year => year.id === savedYearId);
                if (savedYear) {
                    setSelectedYearState(savedYear);
                    return;
                }
            }
            // Default to active year if no saved selection
            const activeYear = availableYears.find(year => year.is_active);
            if (activeYear) {
                setSelectedYearState(activeYear);
            }
        }
    }, [isAdmin, availableYears]);
    const setSelectedYear = (year) => {
        setSelectedYearState(year);
        if (year) {
            localStorage.setItem('selectedAcademicYearId', year.id);
        }
        else {
            localStorage.removeItem('selectedAcademicYearId');
        }
    };
    return (_jsx(SelectedYearContext.Provider, { value: {
            selectedYear,
            setSelectedYear,
            availableYears,
            setAvailableYears,
            isAdmin,
        }, children: children }));
}
export function useSelectedYear() {
    const context = useContext(SelectedYearContext);
    if (context === undefined) {
        // More detailed error for debugging
        console.error('useSelectedYear called outside of SelectedYearProvider. Context is undefined.');
        throw new Error('useSelectedYear must be used within a SelectedYearProvider');
    }
    return context;
}
