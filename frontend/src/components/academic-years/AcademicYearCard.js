import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, Box, Typography, Stack, Chip, IconButton, Tooltip, LinearProgress, alpha, useTheme, } from '@mui/material';
import { CalendarToday as CalendarIcon, School as SchoolIcon, TrendingUp as TrendingUpIcon, CheckCircle as ActiveIcon, RadioButtonUnchecked as InactiveIcon, Edit as EditIcon, Delete as DeleteIcon, Groups as StudentsIcon, Class as ClassroomsIcon, StarBorder as StarIcon, } from '@mui/icons-material';
import { format, differenceInDays, parseISO, isWithinInterval } from 'date-fns';
export const AcademicYearCard = ({ academicYear, onEdit, onDelete, studentCount = 0, classroomCount = 0, enrollmentCount = 0, }) => {
    const theme = useTheme();
    // Calculate academic year progress
    const startDate = parseISO(academicYear.start_date);
    const endDate = parseISO(academicYear.end_date);
    const currentDate = new Date();
    const totalDays = differenceInDays(endDate, startDate);
    const daysPassed = Math.max(0, differenceInDays(currentDate, startDate));
    const progressPercentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
    const isCurrentlyActive = isWithinInterval(currentDate, { start: startDate, end: endDate });
    const hasEnded = currentDate > endDate;
    const hasStarted = currentDate >= startDate;
    // Determine status
    const getStatus = () => {
        if (academicYear.is_active)
            return 'active';
        if (hasEnded)
            return 'completed';
        if (!hasStarted)
            return 'upcoming';
        return 'inactive';
    };
    const status = getStatus();
    // Status configuration
    const statusConfig = {
        active: {
            color: theme.palette.success.main,
            bgColor: alpha(theme.palette.success.main, 0.1),
            label: 'Active',
            icon: ActiveIcon,
        },
        completed: {
            color: theme.palette.info.main,
            bgColor: alpha(theme.palette.info.main, 0.1),
            label: 'Completed',
            icon: ActiveIcon,
        },
        upcoming: {
            color: theme.palette.warning.main,
            bgColor: alpha(theme.palette.warning.main, 0.1),
            label: 'Upcoming',
            icon: CalendarIcon,
        },
        inactive: {
            color: theme.palette.text.secondary,
            bgColor: alpha(theme.palette.text.secondary, 0.1),
            label: 'Inactive',
            icon: InactiveIcon,
        },
    };
    const currentStatus = statusConfig[status];
    return (_jsx(Card, { sx: {
            position: 'relative',
            height: '100%',
            minHeight: 320,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: academicYear.is_active
                ? `2px solid ${alpha(theme.palette.primary.main, 0.4)}`
                : `2px solid ${alpha(theme.palette.grey[400], 0.3)}`,
            borderRadius: 3,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            '&:hover': {
                transform: 'translateY(-6px)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                borderColor: academicYear.is_active ? theme.palette.primary.main : theme.palette.grey[500],
                '& .action-buttons': {
                    opacity: 1,
                    transform: 'translateX(0)',
                },
                '& .year-icon': {
                    transform: 'scale(1.1) rotate(5deg)',
                    boxShadow: `0 8px 24px ${alpha(currentStatus.color, 0.4)}`,
                },
            },
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: academicYear.is_active
                    ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
                    : `linear-gradient(90deg, ${theme.palette.grey[400]}, ${theme.palette.grey[300]})`,
            },
        }, children: _jsxs(CardContent, { sx: { p: 3, flex: 1, display: 'flex', flexDirection: 'column' }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'flex-start', mb: 2 }, children: [_jsx(Box, { className: "year-icon", sx: {
                                width: 56,
                                height: 56,
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${currentStatus.color}, ${alpha(currentStatus.color, 0.8)})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: `0 4px 16px ${alpha(currentStatus.color, 0.3)}`,
                            }, children: _jsx(SchoolIcon, { sx: { fontSize: 28, color: 'white' } }) }), _jsx(Box, { sx: { flex: 1, minWidth: 0 }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(Chip, { icon: React.createElement(currentStatus.icon, { sx: { fontSize: '16px !important' } }), label: currentStatus.label, size: "small", sx: {
                                            bgcolor: currentStatus.color,
                                            color: 'white',
                                            fontWeight: 600,
                                            '& .MuiChip-icon': {
                                                color: 'white',
                                            },
                                        } }), academicYear.is_active && (_jsx(Chip, { icon: _jsx(StarIcon, { sx: { fontSize: '14px !important' } }), label: "Current", size: "small", color: "primary", sx: { fontSize: '0.7rem' } }))] }) }), _jsxs(Stack, { direction: "row", spacing: 0.5, className: "action-buttons", sx: {
                                opacity: 0,
                                transform: 'translateX(20px)',
                                transition: 'all 0.3s ease',
                            }, children: [_jsx(Tooltip, { title: "Edit Academic Year", placement: "top", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                            e.stopPropagation();
                                            onEdit(academicYear);
                                        }, sx: {
                                            bgcolor: alpha(theme.palette.info.main, 0.1),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.info.main, 0.2),
                                                transform: 'scale(1.1)',
                                            },
                                        }, children: _jsx(EditIcon, { sx: { fontSize: 18 } }) }) }), _jsx(Tooltip, { title: "Delete Academic Year", placement: "top", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                            e.stopPropagation();
                                            onDelete(academicYear);
                                        }, sx: {
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.error.main, 0.2),
                                                transform: 'scale(1.1)',
                                            },
                                        }, children: _jsx(DeleteIcon, { sx: { fontSize: 18 } }) }) })] })] }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "h6", sx: {
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                mb: 1,
                                fontSize: '1.3rem',
                                lineHeight: 1.2,
                            }, children: academicYear.name }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, sx: { mb: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CalendarIcon, { sx: { fontSize: 16, mr: 1, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: format(startDate, 'MMM dd, yyyy') })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u2192" }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CalendarIcon, { sx: { fontSize: 16, mr: 1, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: format(endDate, 'MMM dd, yyyy') })] })] }), isCurrentlyActive && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mb: 1 }, children: [_jsx(Typography, { variant: "body2", fontWeight: 500, children: "Academic Year Progress" }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [Math.round(progressPercentage), "% Complete"] })] }), _jsx(LinearProgress, { variant: "determinate", value: progressPercentage, sx: {
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 3,
                                            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                                        },
                                    } })] }))] }), _jsx(Box, { sx: {
                        mt: 'auto',
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(currentStatus.color, 0.08),
                        border: `1px solid ${alpha(currentStatus.color, 0.15)}`,
                    }, children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(StudentsIcon, { sx: {
                                                    fontSize: 16,
                                                    mr: 1,
                                                    color: currentStatus.color
                                                } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: "Students" })] }), _jsx(Typography, { variant: "body2", fontWeight: 600, color: currentStatus.color, children: studentCount.toLocaleString() })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(ClassroomsIcon, { sx: {
                                                    fontSize: 16,
                                                    mr: 1,
                                                    color: currentStatus.color
                                                } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: "Classrooms" })] }), _jsx(Typography, { variant: "body2", fontWeight: 600, color: currentStatus.color, children: classroomCount.toLocaleString() })] }), enrollmentCount > 0 && (_jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(TrendingUpIcon, { sx: {
                                                    fontSize: 16,
                                                    mr: 1,
                                                    color: currentStatus.color
                                                } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: "Enrollments" })] }), _jsx(Typography, { variant: "body2", fontWeight: 600, color: currentStatus.color, children: enrollmentCount.toLocaleString() })] })), _jsx(Box, { sx: { pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }, children: _jsx(Stack, { direction: "row", justifyContent: "center", alignItems: "center", children: _jsxs(Typography, { variant: "caption", color: "text.secondary", sx: { fontWeight: 500, textAlign: 'center' }, children: [totalDays, " days \u2022 ", Math.round(totalDays / 30), " months"] }) }) })] }) })] }) }));
};
export default AcademicYearCard;
