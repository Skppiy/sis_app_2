import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Paper, Stack, Typography, Button, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, Chip, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, Fade, alpha, useTheme, } from '@mui/material';
import { Close as CloseIcon, MoreVert as MoreVertIcon, PersonAdd as PersonAddIcon, Delete as DeleteIcon, FileDownload as ExportIcon, Print as PrintIcon, Email as EmailIcon, Sms as SmsIcon, Assignment as ReportIcon, CheckCircle as CheckCircleIcon, PersonOff as InactivateIcon, PersonAddAlt as ActivateIcon, } from '@mui/icons-material';
export const BulkOperationsToolbar = ({ selectedStudents, totalStudents, onClearSelection, onSelectAll, onBulkEnroll, onBulkActivate, onBulkInactivate, onBulkDelete, onBulkExport, onBulkEmail, onBulkSms, onBulkReport, availableClassrooms = [], }) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState('');
    const [reportType, setReportType] = useState('');
    const [exportFormat, setExportFormat] = useState('csv');
    const selectedCount = selectedStudents.length;
    const isAllSelected = selectedCount === totalStudents && totalStudents > 0;
    const activeCount = selectedStudents.filter(s => s.is_active).length;
    const inactiveCount = selectedStudents.filter(s => !s.is_active).length;
    if (selectedCount === 0) {
        return null;
    }
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleBulkEnroll = () => {
        if (selectedClassroom) {
            onBulkEnroll?.(selectedStudents.map(s => s.id), selectedClassroom);
            setEnrollDialogOpen(false);
            setSelectedClassroom('');
        }
    };
    const handleBulkDelete = () => {
        onBulkDelete?.(selectedStudents.map(s => s.id));
        setDeleteDialogOpen(false);
    };
    const handleBulkReport = () => {
        if (reportType) {
            onBulkReport?.(selectedStudents.map(s => s.id), reportType);
            setReportDialogOpen(false);
            setReportType('');
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Fade, { in: selectedCount > 0, children: _jsx(Paper, { elevation: 4, sx: {
                        position: 'fixed',
                        bottom: 24,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 1300,
                        p: 2,
                        minWidth: 600,
                        maxWidth: '90vw',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: `0 12px 36px ${alpha(theme.palette.primary.main, 0.4)}`,
                        border: `1px solid ${alpha('#fff', 0.2)}`,
                    }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 3, children: [_jsx(Box, { sx: { flex: 1 }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(CheckCircleIcon, { sx: { fontSize: 24 } }), _jsxs(Box, { children: [_jsxs(Typography, { variant: "h6", fontWeight: 600, children: [selectedCount, " Student", selectedCount > 1 ? 's' : '', " Selected"] }), _jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [_jsxs(Typography, { variant: "body2", sx: { opacity: 0.9 }, children: [activeCount, " Active \u2022 ", inactiveCount, " Inactive"] }), !isAllSelected && (_jsxs(_Fragment, { children: [_jsx(Typography, { variant: "body2", sx: { opacity: 0.7 }, children: "\u2022" }), _jsxs(Button, { size: "small", onClick: onSelectAll, sx: {
                                                                        color: 'white',
                                                                        textDecoration: 'underline',
                                                                        fontSize: '0.75rem',
                                                                        minWidth: 'auto',
                                                                        p: 0,
                                                                    }, children: ["Select All (", totalStudents, ")"] })] }))] })] })] }) }), _jsxs(Stack, { direction: "row", spacing: 1, children: [onBulkEnroll && availableClassrooms.length > 0 && (_jsx(Button, { variant: "contained", startIcon: _jsx(PersonAddIcon, {}), onClick: () => setEnrollDialogOpen(true), sx: {
                                            bgcolor: alpha('#fff', 0.2),
                                            color: 'white',
                                            '&:hover': {
                                                bgcolor: alpha('#fff', 0.3),
                                            },
                                        }, children: "Enroll" })), inactiveCount > 0 && onBulkActivate && (_jsx(Button, { variant: "contained", startIcon: _jsx(ActivateIcon, {}), onClick: () => onBulkActivate(selectedStudents.filter(s => !s.is_active).map(s => s.id)), sx: {
                                            bgcolor: alpha(theme.palette.success.main, 0.8),
                                            '&:hover': {
                                                bgcolor: theme.palette.success.main,
                                            },
                                        }, children: "Activate" })), activeCount > 0 && onBulkInactivate && (_jsx(Button, { variant: "contained", startIcon: _jsx(InactivateIcon, {}), onClick: () => onBulkInactivate(selectedStudents.filter(s => s.is_active).map(s => s.id)), sx: {
                                            bgcolor: alpha(theme.palette.warning.main, 0.8),
                                            '&:hover': {
                                                bgcolor: theme.palette.warning.main,
                                            },
                                        }, children: "Inactivate" })), _jsx(IconButton, { onClick: handleMenuOpen, sx: {
                                            color: 'white',
                                            bgcolor: alpha('#fff', 0.1),
                                            '&:hover': {
                                                bgcolor: alpha('#fff', 0.2),
                                            },
                                        }, children: _jsx(MoreVertIcon, {}) }), _jsx(IconButton, { onClick: onClearSelection, sx: {
                                            color: 'white',
                                            bgcolor: alpha(theme.palette.error.main, 0.3),
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.error.main, 0.5),
                                            },
                                        }, children: _jsx(CloseIcon, {}) })] })] }) }) }), _jsxs(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleMenuClose, PaperProps: {
                    elevation: 8,
                    sx: { mt: 1, minWidth: 220 },
                }, children: [onBulkEmail && (_jsxs(MenuItem, { onClick: () => { onBulkEmail(selectedStudents.map(s => s.id)); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(EmailIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Email Contacts" })] })), onBulkSms && (_jsxs(MenuItem, { onClick: () => { onBulkSms(selectedStudents.map(s => s.id)); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(SmsIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Send SMS" })] })), _jsx(Divider, {}), onBulkExport && (_jsxs(_Fragment, { children: [_jsxs(MenuItem, { onClick: () => { onBulkExport(selectedStudents.map(s => s.id), 'csv'); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(ExportIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Export CSV" })] }), _jsxs(MenuItem, { onClick: () => { onBulkExport(selectedStudents.map(s => s.id), 'pdf'); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(PrintIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Export PDF" })] })] })), onBulkReport && (_jsxs(MenuItem, { onClick: () => { setReportDialogOpen(true); handleMenuClose(); }, children: [_jsx(ListItemIcon, { children: _jsx(ReportIcon, { fontSize: "small" }) }), _jsx(ListItemText, { children: "Generate Report" })] })), _jsx(Divider, {}), onBulkDelete && (_jsxs(MenuItem, { onClick: () => { setDeleteDialogOpen(true); handleMenuClose(); }, sx: { color: theme.palette.error.main }, children: [_jsx(ListItemIcon, { children: _jsx(DeleteIcon, { fontSize: "small", color: "error" }) }), _jsx(ListItemText, { children: "Delete Selected" })] }))] }), _jsxs(Dialog, { open: enrollDialogOpen, onClose: () => setEnrollDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Enroll Selected Students" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 3, sx: { mt: 1 }, children: [_jsxs(Alert, { severity: "info", children: ["You are about to enroll ", selectedCount, " student", selectedCount > 1 ? 's' : '', " in a classroom."] }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Select Classroom" }), _jsx(Select, { value: selectedClassroom, onChange: (e) => setSelectedClassroom(e.target.value), label: "Select Classroom", children: availableClassrooms.map((classroom) => (_jsx(MenuItem, { value: classroom.id, children: _jsxs(Stack, { children: [_jsx(Typography, { variant: "body1", children: classroom.name }), classroom.subject && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: classroom.subject.name }))] }) }, classroom.id))) })] }), _jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Students to be enrolled:" }), _jsxs(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", useFlexGap: true, children: [selectedStudents.slice(0, 5).map((student) => (_jsx(Chip, { label: `${student.first_name} ${student.last_name}`, size: "small", color: "primary", variant: "outlined" }, student.id))), selectedStudents.length > 5 && (_jsx(Chip, { label: `+${selectedStudents.length - 5} more`, size: "small", color: "primary" }))] })] })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setEnrollDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleBulkEnroll, variant: "contained", disabled: !selectedClassroom, startIcon: _jsx(PersonAddIcon, {}), children: "Enroll Students" })] })] }), _jsxs(Dialog, { open: deleteDialogOpen, onClose: () => setDeleteDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Delete Selected Students" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Alert, { severity: "error", children: ["This will permanently delete ", selectedCount, " student", selectedCount > 1 ? 's' : '', " and all their enrollments. This action cannot be undone."] }), _jsx(Typography, { variant: "body2", children: "Students to be deleted:" }), _jsx(Stack, { spacing: 1, sx: { maxHeight: 200, overflowY: 'auto' }, children: selectedStudents.map((student) => (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsxs(Typography, { variant: "body2", children: [student.first_name, " ", student.last_name, " (", student.current_grade_level, ")"] }), student.student_id && (_jsx(Chip, { label: student.student_id, size: "small", variant: "outlined" }))] }, student.id))) })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDeleteDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleBulkDelete, color: "error", variant: "contained", startIcon: _jsx(DeleteIcon, {}), children: "Delete Students" })] })] }), _jsxs(Dialog, { open: reportDialogOpen, onClose: () => setReportDialogOpen(false), maxWidth: "sm", fullWidth: true, children: [_jsx(DialogTitle, { children: "Generate Report" }), _jsx(DialogContent, { children: _jsxs(Stack, { spacing: 3, sx: { mt: 1 }, children: [_jsxs(Alert, { severity: "info", children: ["Generate a report for ", selectedCount, " selected student", selectedCount > 1 ? 's' : '', "."] }), _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Report Type" }), _jsxs(Select, { value: reportType, onChange: (e) => setReportType(e.target.value), label: "Report Type", children: [_jsx(MenuItem, { value: "contact_list", children: "Contact List" }), _jsx(MenuItem, { value: "enrollment_summary", children: "Enrollment Summary" }), _jsx(MenuItem, { value: "grade_roster", children: "Grade Level Roster" }), _jsx(MenuItem, { value: "emergency_contacts", children: "Emergency Contacts" }), _jsx(MenuItem, { value: "special_needs", children: "Special Needs Summary" }), _jsx(MenuItem, { value: "attendance_report", children: "Attendance Report" })] })] })] }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setReportDialogOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleBulkReport, variant: "contained", disabled: !reportType, startIcon: _jsx(ReportIcon, {}), children: "Generate Report" })] })] })] }));
};
export default BulkOperationsToolbar;
