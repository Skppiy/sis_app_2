import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Paper, Typography, Stack, Chip, IconButton, Collapse, List, ListItem, ListItemIcon, ListItemText, Badge, Dialog, DialogTitle, DialogContent, DialogActions, Button, alpha, useTheme, } from '@mui/material';
import { LocalHospital as MedicalIcon, DirectionsBus as TransportIcon, Restaurant as DietIcon, Psychology as CounselingIcon, School as AcademicIcon, Sports as SportsIcon, Accessibility as AccessibilityIcon, Warning as WarningIcon, Info as InfoIcon, CheckCircle as CheckCircleIcon, Person as PersonIcon, ExpandMore as ExpandMoreIcon, Edit as EditIcon, } from '@mui/icons-material';
import { format } from 'date-fns';
const SERVICE_CONFIG = {
    counseling: {
        icon: CounselingIcon,
        color: '#8b5cf6',
        label: 'Counseling',
    },
    academic_support: {
        icon: AcademicIcon,
        color: '#3b82f6',
        label: 'Academic Support',
    },
    speech_therapy: {
        icon: PersonIcon,
        color: '#10b981',
        label: 'Speech Therapy',
    },
    occupational_therapy: {
        icon: SportsIcon,
        color: '#f59e0b',
        label: 'Occupational Therapy',
    },
    physical_therapy: {
        icon: AccessibilityIcon,
        color: '#ef4444',
        label: 'Physical Therapy',
    },
    social_work: {
        icon: PersonIcon,
        color: '#06b6d4',
        label: 'Social Work',
    },
};
const TRANSPORT_CONFIG = {
    bus: { icon: TransportIcon, label: 'Bus Transport' },
    parent_pickup: { icon: PersonIcon, label: 'Parent Pickup' },
    walker: { icon: PersonIcon, label: 'Walker' },
    other: { icon: InfoIcon, label: 'Other' },
};
export const StudentServicesPanel = ({ servicesData, compact = false, onEdit, onViewDetails, }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    if (!servicesData) {
        return (_jsxs(Paper, { sx: {
                p: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                borderRadius: 2,
            }, children: [_jsx(InfoIcon, { sx: { color: theme.palette.info.main, mb: 1 } }), _jsx(Typography, { variant: "body2", color: "info.main", children: "No student services information available" })] }));
    }
    ;
    const { medical_info, transportation_info, dietary_info, services, last_updated, updated_by, } = servicesData;
    const activeServices = services.filter(s => s.is_active);
    const hasAlerts = (medical_info?.allergies.some(a => a.severity === 'severe')) ||
        (dietary_info?.allergies.length && dietary_info.allergies.length > 0) ||
        (medical_info?.emergency_procedures.length && medical_info.emergency_procedures.length > 0);
    // Compact display for student cards
    if (compact) {
        const servicesCount = activeServices.length;
        const hasTransport = !!transportation_info;
        const hasMedical = !!medical_info;
        const hasDietary = !!dietary_info;
        return (_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(Badge, { badgeContent: hasAlerts ? '!' : null, color: "error", variant: "dot", children: _jsx(MedicalIcon, { sx: { color: theme.palette.primary.main, fontSize: 16 } }) }), _jsx(Typography, { variant: "body2", fontWeight: 500, color: "primary.main", children: "Student Services" }), servicesCount > 0 && (_jsx(Chip, { label: `${servicesCount} Active`, size: "small", color: "success", sx: { fontSize: '0.7rem', height: 18 } }))] }), _jsxs(Stack, { spacing: 0.5, sx: { fontSize: '0.8rem' }, children: [hasMedical && (_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.5, children: [_jsx(MedicalIcon, { sx: { fontSize: 12, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: "Medical Info Available" }), hasAlerts && (_jsx(WarningIcon, { sx: { fontSize: 12, color: theme.palette.error.main } }))] })), hasTransport && (_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.5, children: [_jsx(TransportIcon, { sx: { fontSize: 12, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: TRANSPORT_CONFIG[transportation_info.method].label })] })), hasDietary && (_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.5, children: [_jsx(DietIcon, { sx: { fontSize: 12, color: theme.palette.text.secondary } }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Dietary: ", dietary_info.meal_plan.replace('_', ' ').toUpperCase()] })] }))] }), _jsx(Button, { size: "small", onClick: () => setDetailsDialogOpen(true), sx: { mt: 1, fontSize: '0.75rem' }, children: "View Services" })] }));
    }
    // Full display
    return (_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(Badge, { badgeContent: hasAlerts ? '!' : null, color: "error", variant: "dot", children: _jsx(MedicalIcon, { sx: { color: theme.palette.primary.main } }) }), _jsx(Typography, { variant: "h6", fontWeight: 600, children: "Student Services" }), activeServices.length > 0 && (_jsx(Chip, { label: `${activeServices.length} Active Service${activeServices.length > 1 ? 's' : ''}`, size: "small", color: "success" }))] }), _jsxs(Stack, { direction: "row", spacing: 1, children: [onEdit && (_jsx(IconButton, { size: "small", onClick: onEdit, children: _jsx(EditIcon, {}) })), _jsx(IconButton, { size: "small", onClick: () => setExpanded(!expanded), sx: {
                                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                }, children: _jsx(ExpandMoreIcon, {}) })] })] }), activeServices.length > 0 && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 1 }, children: "Active Services" }), _jsx(Stack, { spacing: 1, children: activeServices.map(service => {
                            const config = SERVICE_CONFIG[service.type];
                            const IconComponent = config.icon;
                            return (_jsx(Paper, { sx: {
                                    p: 2,
                                    borderLeft: `4px solid ${config.color}`,
                                    bgcolor: alpha(config.color, 0.05),
                                }, children: _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 2, children: [_jsx(IconComponent, { sx: { color: config.color } }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, children: config.label }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Provider: ", service.provider, " \u2022 ", service.frequency] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Started: ", format(new Date(service.start_date), 'MMM dd, yyyy')] })] }), _jsx(CheckCircleIcon, { sx: { color: theme.palette.success.main } })] }) }, service.id));
                        }) })] })), _jsxs(Stack, { direction: "row", spacing: 2, sx: { mb: 3 }, children: [medical_info && (_jsxs(Paper, { sx: {
                            p: 2,
                            flex: 1,
                            bgcolor: alpha(theme.palette.error.main, 0.05),
                            border: hasAlerts ? `1px solid ${theme.palette.error.main}` : '1px solid transparent',
                        }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(MedicalIcon, { sx: { color: theme.palette.error.main } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, children: "Medical" }), hasAlerts && _jsx(WarningIcon, { sx: { color: theme.palette.error.main, fontSize: 16 } })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [medical_info.conditions.length, " Condition", medical_info.conditions.length !== 1 ? 's' : '', " \u2022", ' ', medical_info.allergies.length, " Allerg", medical_info.allergies.length !== 1 ? 'ies' : 'y'] })] })), transportation_info && (_jsxs(Paper, { sx: { p: 2, flex: 1, bgcolor: alpha(theme.palette.info.main, 0.05) }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(TransportIcon, { sx: { color: theme.palette.info.main } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, children: "Transportation" })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [TRANSPORT_CONFIG[transportation_info.method].label, transportation_info.bus_route && ` • Route ${transportation_info.bus_route}`] })] })), dietary_info && (_jsxs(Paper, { sx: { p: 2, flex: 1, bgcolor: alpha(theme.palette.warning.main, 0.05) }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(DietIcon, { sx: { color: theme.palette.warning.main } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, children: "Dietary" })] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [dietary_info.meal_plan.replace('_', ' ').toUpperCase(), dietary_info.free_reduced_lunch && ' • Free/Reduced'] })] }))] }), _jsxs(Collapse, { in: expanded, children: [_jsxs(Stack, { spacing: 3, children: [medical_info && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 2 }, children: "Medical Information" }), medical_info.allergies.length > 0 && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Allergies" }), _jsx(Stack, { spacing: 0.5, children: medical_info.allergies.map((allergy, index) => (_jsx(Chip, { label: `${allergy.allergen} (${allergy.severity})`, size: "small", color: allergy.severity === 'severe' ? 'error' : allergy.severity === 'moderate' ? 'warning' : 'default', icon: allergy.severity === 'severe' ? _jsx(WarningIcon, {}) : undefined }, index))) })] })), medical_info.medications.length > 0 && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Medications" }), _jsx(List, { dense: true, children: medical_info.medications.map((med, index) => (_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(MedicalIcon, { sx: { fontSize: 16 } }) }), _jsx(ListItemText, { primary: `${med.name} - ${med.dosage}`, secondary: `${med.administration_time}${med.notes ? ` • ${med.notes}` : ''}` })] }, index))) })] }))] })), transportation_info && (_jsxs(Paper, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 2 }, children: "Transportation Information" }), _jsxs(Stack, { spacing: 2, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", children: "Method" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: TRANSPORT_CONFIG[transportation_info.method].label })] }), transportation_info.authorized_pickup_persons.length > 0 && (_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Authorized Pickup Persons" }), _jsx(List, { dense: true, children: transportation_info.authorized_pickup_persons.map((person, index) => (_jsxs(ListItem, { children: [_jsx(ListItemIcon, { children: _jsx(PersonIcon, { sx: { fontSize: 16 } }) }), _jsx(ListItemText, { primary: person.name, secondary: `${person.relationship} • ${person.phone}${person.id_required ? ' • ID Required' : ''}` })] }, index))) })] }))] })] }))] }), _jsx(Box, { sx: { mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }, children: _jsxs(Typography, { variant: "caption", color: "text.secondary", children: ["Last updated: ", format(new Date(last_updated), 'MMM dd, yyyy'), " by ", updated_by] }) })] }), _jsxs(Dialog, { open: detailsDialogOpen, onClose: () => setDetailsDialogOpen(false), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Complete Student Services Information" }), _jsx(DialogContent, { children: _jsx(StudentServicesPanel, { servicesData: servicesData, compact: false, onEdit: onEdit }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: () => setDetailsDialogOpen(false), children: "Close" }), onEdit && (_jsx(Button, { onClick: onEdit, variant: "contained", children: "Edit Services" }))] })] })] }));
};
export default StudentServicesPanel;
