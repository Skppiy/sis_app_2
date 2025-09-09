import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Box, Typography, Chip, Stack, Badge, Collapse, List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction, Button, Paper, alpha, useTheme, } from '@mui/material';
import { School as SchoolIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, ClassOutlined as ClassIcon, PersonOutline as StudentIcon, } from '@mui/icons-material';
import { format } from 'date-fns';
export const EnrollmentStatus = ({ studentId, enrollments = [], enrollmentCount, isExpanded, onToggleExpand, onWithdrawEnrollment, isLoading = false, academicYearName, studentGrade, }) => {
    const theme = useTheme();
    // Format date display
    const formatDate = (dateString) => {
        if (!dateString)
            return 'N/A';
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        }
        catch {
            return 'Invalid Date';
        }
    };
    // Get status color based on enrollment status
    const getStatusColor = (status) => {
        switch (status.toUpperCase()) {
            case 'ACTIVE':
                return theme.palette.success.main;
            case 'PENDING':
                return theme.palette.warning.main;
            case 'WITHDRAWN':
                return theme.palette.error.main;
            default:
                return theme.palette.text.secondary;
        }
    };
    return (_jsxs(Box, { children: [_jsx(Paper, { elevation: 0, sx: {
                    p: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.light, 0.16)} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                }, onClick: onToggleExpand, children: _jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', flex: 1 }, children: [_jsx(Badge, { badgeContent: enrollmentCount, color: "primary", sx: {
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.75rem',
                                            height: 20,
                                            minWidth: 20,
                                        },
                                    }, children: _jsx(SchoolIcon, { sx: {
                                            fontSize: 24,
                                            color: theme.palette.primary.main,
                                            mr: 2,
                                        } }) }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: theme.palette.primary.main, sx: { mb: 0.5 }, children: "Current Enrollments" }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [studentGrade && (_jsx(Chip, { label: `Grade ${studentGrade}`, size: "small", sx: {
                                                        bgcolor: theme.palette.primary.main,
                                                        color: 'white',
                                                        fontWeight: 500,
                                                        fontSize: '0.7rem',
                                                    } })), academicYearName && (_jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.8rem' }, children: ["\u2022 ", academicYearName] }))] })] })] }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(Chip, { label: enrollmentCount, size: "small", sx: {
                                        bgcolor: theme.palette.primary.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        minWidth: 36,
                                        fontSize: '0.75rem',
                                    } }), isExpanded ? (_jsx(ExpandLessIcon, { sx: { color: theme.palette.primary.main } })) : (_jsx(ExpandMoreIcon, { sx: { color: theme.palette.primary.main } }))] })] }) }), _jsx(Collapse, { in: isExpanded, timeout: 300, children: _jsx(Paper, { sx: {
                        mt: 1,
                        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }, children: isLoading ? (_jsx(Box, { sx: { p: 3, textAlign: 'center' }, children: _jsx(Typography, { color: "text.secondary", children: "Loading enrollments..." }) })) : enrollments.length === 0 ? (_jsxs(Box, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(StudentIcon, { sx: {
                                    fontSize: 48,
                                    color: theme.palette.text.disabled,
                                    mb: 1,
                                } }), _jsx(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 0.5 }, children: "No Active Enrollments" }), _jsx(Typography, { variant: "body2", color: "text.disabled", children: "This student is not currently enrolled in any classes" })] })) : (_jsx(List, { sx: { py: 0 }, children: enrollments.map((enrollment, index) => (_jsxs(React.Fragment, { children: [_jsxs(ListItem, { sx: {
                                        py: 2,
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.action.hover, 0.5),
                                        },
                                    }, children: [_jsx(ListItemIcon, { children: _jsx(ClassIcon, { sx: {
                                                    color: getStatusColor(enrollment.enrollment_status),
                                                } }) }), _jsx(ListItemText, { primary: _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsxs(Typography, { variant: "subtitle2", fontWeight: 500, children: ["Classroom ", enrollment.classroom_id] }), _jsx(Chip, { label: enrollment.enrollment_status, size: "small", sx: {
                                                            bgcolor: alpha(getStatusColor(enrollment.enrollment_status), 0.1),
                                                            color: getStatusColor(enrollment.enrollment_status),
                                                            fontWeight: 500,
                                                            fontSize: '0.7rem',
                                                        } }), enrollment.grade_level && (_jsx(Chip, { label: `Grade ${enrollment.grade_level}`, size: "small", variant: "outlined", sx: { fontSize: '0.7rem' } }))] }), secondary: _jsxs(Stack, { direction: "column", spacing: 0.5, sx: { mt: 1 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Enrolled: ", formatDate(enrollment.enrollment_date)] }), enrollment.withdrawal_date && (_jsxs(Typography, { variant: "body2", color: "error.main", children: ["Withdrawn: ", formatDate(enrollment.withdrawal_date)] })), enrollment.withdrawal_reason && (_jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.75rem' }, children: ["Reason: ", enrollment.withdrawal_reason] }))] }) }), onWithdrawEnrollment &&
                                            enrollment.enrollment_status === 'ACTIVE' && (_jsx(ListItemSecondaryAction, { children: _jsx(Button, { size: "small", color: "error", variant: "outlined", onClick: () => onWithdrawEnrollment(enrollment.id), sx: { fontSize: '0.75rem' }, children: "Withdraw" }) }))] }), index < enrollments.length - 1 && (_jsx(Box, { sx: {
                                        height: 1,
                                        bgcolor: alpha(theme.palette.divider, 0.12),
                                        mx: 2,
                                    } }))] }, enrollment.id))) })) }) })] }));
};
export default EnrollmentStatus;
