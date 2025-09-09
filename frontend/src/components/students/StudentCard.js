import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, Box, Typography, Avatar, Stack, Chip, IconButton, Tooltip, Divider, alpha, useTheme, } from '@mui/material';
import { Email as EmailIcon, Cake as CakeIcon, School as SchoolIcon, Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon, } from '@mui/icons-material';
import { format } from 'date-fns';
import { GRADE_LEVELS } from '@/schemas/students';
export const StudentCard = ({ student, onEdit, onDelete, onEnroll, onExpandEnrollments, isExpanded, enrollmentCount = 0, }) => {
    const theme = useTheme();
    // Generate initials for avatar
    const getInitials = (firstName, lastName) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };
    // Get grade level label
    const getGradeLabel = (gradeValue) => {
        const grade = GRADE_LEVELS.find(g => g.value === gradeValue);
        return grade ? grade.label : gradeValue;
    };
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
    return (_jsx(Card, { sx: {
            position: 'relative',
            backgroundColor: '#ffffff',
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
                borderColor: theme.palette.primary.main,
                '& .action-buttons': {
                    opacity: 1,
                    transform: 'translateX(0)',
                },
                '& .student-avatar': {
                    transform: 'scale(1.1)',
                    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
            },
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            },
        }, children: _jsxs(CardContent, { sx: { p: 3, '&:last-child': { pb: 3 } }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'flex-start', mb: 2 }, children: [_jsx(Avatar, { className: "student-avatar", sx: {
                                width: 56,
                                height: 56,
                                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                mr: 2,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            }, children: getInitials(student.first_name, student.last_name) }), _jsxs(Box, { sx: { flex: 1, minWidth: 0 }, children: [_jsxs(Typography, { variant: "h6", sx: {
                                        fontWeight: 600,
                                        color: theme.palette.text.primary,
                                        mb: 0.5,
                                        fontSize: '1.1rem',
                                    }, children: [student.first_name, " ", student.last_name] }), _jsxs(Stack, { direction: "row", spacing: 1, sx: { mb: 1 }, children: [_jsx(Chip, { label: getGradeLabel(student.current_grade_level), size: "small", sx: {
                                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                                color: 'white',
                                                fontWeight: 500,
                                                fontSize: '0.75rem',
                                            } }), _jsx(Chip, { label: student.is_active ? 'Active' : 'Inactive', size: "small", color: student.is_active ? 'success' : 'default', variant: student.is_active ? 'filled' : 'outlined' })] }), student.student_id && (_jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: ["ID: ", student.student_id] }))] }), _jsxs(Stack, { direction: "row", spacing: 0.5, className: "action-buttons", sx: {
                                opacity: 0,
                                transform: 'translateX(20px)',
                                transition: 'all 0.3s ease',
                            }, children: [_jsx(Tooltip, { title: "Enroll in Class", placement: "top", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                            e.stopPropagation();
                                            onEnroll(student);
                                        }, sx: {
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.primary.main, 0.2),
                                                transform: 'scale(1.1)',
                                            },
                                        }, children: _jsx(PersonAddIcon, { sx: { fontSize: 18 } }) }) }), _jsx(Tooltip, { title: "Edit Student", placement: "top", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                            e.stopPropagation();
                                            onEdit(student);
                                        }, sx: {
                                            bgcolor: alpha(theme.palette.info.main, 0.1),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.info.main, 0.2),
                                                transform: 'scale(1.1)',
                                            },
                                        }, children: _jsx(EditIcon, { sx: { fontSize: 18 } }) }) }), _jsx(Tooltip, { title: "Delete Student", placement: "top", children: _jsx(IconButton, { size: "small", onClick: (e) => {
                                            e.stopPropagation();
                                            onDelete(student);
                                        }, sx: {
                                            bgcolor: alpha(theme.palette.error.main, 0.1),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.error.main, 0.2),
                                                transform: 'scale(1.1)',
                                            },
                                        }, children: _jsx(DeleteIcon, { sx: { fontSize: 18 } }) }) })] })] }), _jsx(Divider, { sx: { my: 2, opacity: 0.6 } }), _jsxs(Stack, { spacing: 1.5, children: [student.email && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(EmailIcon, { sx: {
                                        fontSize: 16,
                                        mr: 1.5,
                                        color: theme.palette.text.secondary
                                    } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: student.email })] })), student.date_of_birth && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(CakeIcon, { sx: {
                                        fontSize: 16,
                                        mr: 1.5,
                                        color: theme.palette.text.secondary
                                    } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: ["Born: ", formatDate(student.date_of_birth)] })] })), student.entry_date && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(SchoolIcon, { sx: {
                                        fontSize: 16,
                                        mr: 1.5,
                                        color: theme.palette.text.secondary
                                    } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { fontSize: '0.85rem' }, children: ["Enrolled: ", formatDate(student.entry_date)] })] }))] }), _jsx(Box, { sx: {
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'scale(1.01)',
                        },
                    }, onClick: () => onExpandEnrollments(student.id), children: _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(SchoolIcon, { sx: {
                                            fontSize: 18,
                                            mr: 1,
                                            color: theme.palette.primary.main
                                        } }), _jsx(Typography, { variant: "body2", fontWeight: 500, color: theme.palette.primary.main, children: "Current Enrollments" })] }), _jsx(Chip, { label: enrollmentCount, size: "small", sx: {
                                    bgcolor: theme.palette.primary.main,
                                    color: 'white',
                                    fontWeight: 600,
                                    minWidth: 32,
                                } })] }) })] }) }));
};
export default StudentCard;
