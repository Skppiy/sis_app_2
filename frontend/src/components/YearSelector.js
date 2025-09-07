import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useContext } from 'react';
import { FormControl, Select, MenuItem, Box, Typography, CircularProgress, } from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { SelectedYearContext } from '@/contexts/SelectedYearContext';
import { useYears } from '@/features/academics/hooks/useYears';
export function YearSelector() {
    // Check if we have the context available
    const context = useContext(SelectedYearContext);
    // If no context, don't render
    if (!context) {
        console.log('YearSelector: No context available, not rendering');
        return null;
    }
    const { selectedYear, setSelectedYear, setAvailableYears, isAdmin } = context;
    const { data: academicYears = [], isLoading } = useYears();
    // DEBUG: Log values
    console.log('YearSelector DEBUG:', {
        isAdmin,
        selectedYear,
        academicYears,
        isLoading
    });
    // Update available years when data loads
    useEffect(() => {
        if (academicYears.length > 0) {
            setAvailableYears(academicYears);
        }
    }, [academicYears, setAvailableYears]);
    // DEBUG: Always show something for debugging
    if (!isAdmin) {
        console.log('YearSelector: Not showing because isAdmin =', isAdmin);
        // Temporarily show debug info instead of returning null
        return (_jsxs(Box, { sx: { color: 'white', mr: 2, fontSize: '0.8rem' }, children: ["DEBUG: Not Admin (Role: ", JSON.stringify(context), ")"] }));
    }
    if (isLoading) {
        return (_jsx(Box, { sx: { display: 'flex', alignItems: 'center', color: 'white', mr: 2 }, children: _jsx(CircularProgress, { size: 20, color: "inherit" }) }));
    }
    return (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', mr: 2, minWidth: 200 }, children: [_jsx(CalendarIcon, { sx: { color: 'white', mr: 1 } }), _jsx(FormControl, { size: "small", sx: { minWidth: 160 }, children: _jsxs(Select, { value: selectedYear?.id || '', onChange: (e) => {
                        const yearId = e.target.value;
                        const year = academicYears.find(y => y.id === yearId);
                        setSelectedYear(year || null);
                    }, displayEmpty: true, sx: {
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'white',
                        },
                        '& .MuiSelect-icon': {
                            color: 'white',
                        },
                    }, children: [_jsx(MenuItem, { value: "", disabled: true, children: _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Select Academic Year" }) }), academicYears.map((year) => (_jsx(MenuItem, { value: year.id, children: _jsx(Box, { children: _jsxs(Typography, { variant: "body2", fontWeight: year.is_active ? 'bold' : 'normal', children: [year.name, year.is_active && (_jsx(Typography, { component: "span", variant: "caption", sx: { ml: 1, color: 'success.main', fontWeight: 'bold' }, children: "(Active)" }))] }) }) }, year.id)))] }) })] }));
}
