import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Chip, Tooltip, Stack, Typography, IconButton, Badge, alpha, useTheme, } from '@mui/material';
import { Accessible as AccessibleIcon, Visibility as VisualIcon, Hearing as HearingIcon, Psychology as CognitiveIcon, FamilyRestroom as BehavioralIcon, LocalHospital as MedicalIcon, MenuBook as LearningIcon, Warning as WarningIcon, } from '@mui/icons-material';
const SPECIAL_NEED_CONFIG = {
    physical: {
        icon: AccessibleIcon,
        color: '#3b82f6', // blue
        bgColor: '#eff6ff',
        label: 'Physical',
    },
    visual: {
        icon: VisualIcon,
        color: '#8b5cf6', // purple
        bgColor: '#f3e8ff',
        label: 'Visual',
    },
    hearing: {
        icon: HearingIcon,
        color: '#10b981', // green
        bgColor: '#ecfdf5',
        label: 'Hearing',
    },
    cognitive: {
        icon: CognitiveIcon,
        color: '#f59e0b', // amber
        bgColor: '#fffbeb',
        label: 'Cognitive',
    },
    behavioral: {
        icon: BehavioralIcon,
        color: '#ef4444', // red
        bgColor: '#fef2f2',
        label: 'Behavioral',
    },
    medical: {
        icon: MedicalIcon,
        color: '#06b6d4', // cyan
        bgColor: '#ecfeff',
        label: 'Medical',
    },
    learning: {
        icon: LearningIcon,
        color: '#84cc16', // lime
        bgColor: '#f7fee7',
        label: 'Learning',
    },
};
const SEVERITY_CONFIG = {
    mild: { color: '#10b981', label: 'Mild' },
    moderate: { color: '#f59e0b', label: 'Moderate' },
    severe: { color: '#ef4444', label: 'Severe' },
};
export const SpecialNeedsIndicator = ({ accommodations, compact = false, showDetails = false, onClick, }) => {
    const theme = useTheme();
    if (!accommodations || accommodations.special_needs.length === 0) {
        return null;
    }
    const { special_needs, has_iep, has_504_plan, medical_alert } = accommodations;
    const totalNeeds = special_needs.length;
    const hasCriticalAlert = medical_alert || special_needs.some(need => need.severity === 'severe');
    // Compact display for card headers
    if (compact) {
        return (_jsx(Tooltip, { title: _jsxs(Box, { sx: { p: 1 }, children: [_jsx(Typography, { variant: "subtitle2", sx: { mb: 1 }, children: "Special Needs & Accommodations" }), special_needs.map((need) => {
                        const config = SPECIAL_NEED_CONFIG[need.type];
                        return (_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 0.5 }, children: [_jsx(config.icon, { sx: { fontSize: 14, color: config.color } }), _jsxs(Typography, { variant: "body2", children: [config.label, " (", SEVERITY_CONFIG[need.severity].label, ")"] })] }, need.id));
                    }), has_iep && (_jsx(Chip, { label: "Active IEP", size: "small", color: "primary", sx: { mt: 1, mr: 0.5 } })), has_504_plan && (_jsx(Chip, { label: "504 Plan", size: "small", color: "secondary", sx: { mt: 1 } }))] }), placement: "top", children: _jsx(Box, { sx: { cursor: onClick ? 'pointer' : 'default' }, onClick: onClick, children: _jsx(Badge, { badgeContent: totalNeeds, color: hasCriticalAlert ? 'error' : 'primary', overlap: "circular", sx: {
                        '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: 16,
                            minWidth: 16,
                        },
                    }, children: _jsx(IconButton, { size: "small", sx: {
                            bgcolor: alpha('#3b82f6', 0.1),
                            color: '#3b82f6',
                            '&:hover': {
                                bgcolor: alpha('#3b82f6', 0.2),
                                transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                        }, children: _jsx(AccessibleIcon, { sx: { fontSize: 16 } }) }) }) }) }));
    }
    // Detailed display for expanded views
    return (_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", sx: { mb: 2 }, children: [_jsx(AccessibleIcon, { sx: { color: theme.palette.primary.main } }), _jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: "Special Needs & Accommodations" }), hasCriticalAlert && (_jsx(WarningIcon, { sx: { color: theme.palette.error.main, fontSize: 18 } }))] }), (has_iep || has_504_plan) && (_jsxs(Stack, { direction: "row", spacing: 1, sx: { mb: 2 }, children: [has_iep && (_jsx(Chip, { label: "Active IEP", size: "small", sx: {
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            fontWeight: 600,
                        } })), has_504_plan && (_jsx(Chip, { label: "504 Plan", size: "small", sx: {
                            bgcolor: theme.palette.secondary.main,
                            color: 'white',
                            fontWeight: 600,
                        } }))] })), _jsx(Stack, { spacing: 1.5, children: special_needs.map((need) => {
                    const config = SPECIAL_NEED_CONFIG[need.type];
                    const severityConfig = SEVERITY_CONFIG[need.severity];
                    const IconComponent = config.icon;
                    return (_jsx(Box, { sx: {
                            p: 2,
                            borderRadius: 2,
                            bgcolor: config.bgColor,
                            border: `1px solid ${alpha(config.color, 0.2)}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 12px ${alpha(config.color, 0.15)}`,
                            },
                        }, children: _jsxs(Stack, { direction: "row", alignItems: "flex-start", spacing: 2, children: [_jsx(Box, { sx: {
                                        p: 1,
                                        borderRadius: 1,
                                        bgcolor: alpha(config.color, 0.1),
                                        color: config.color,
                                    }, children: _jsx(IconComponent, { sx: { fontSize: 20 } }) }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 0.5 }, children: [_jsx(Typography, { variant: "subtitle2", fontWeight: 600, children: config.label }), _jsx(Chip, { label: severityConfig.label, size: "small", sx: {
                                                        bgcolor: alpha(severityConfig.color, 0.1),
                                                        color: severityConfig.color,
                                                        fontWeight: 500,
                                                        fontSize: '0.7rem',
                                                    } })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 1 }, children: need.description }), need.accommodations.length > 0 && (_jsxs(Box, { children: [_jsx(Typography, { variant: "caption", fontWeight: 500, sx: { mb: 0.5, display: 'block' }, children: "Accommodations:" }), _jsx(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", children: need.accommodations.map((accommodation, index) => (_jsx(Chip, { label: accommodation, size: "small", variant: "outlined", sx: {
                                                            fontSize: '0.65rem',
                                                            height: 20,
                                                            borderColor: alpha(config.color, 0.3),
                                                            color: config.color,
                                                        } }, index))) })] }))] })] }) }, need.id));
                }) }), medical_alert && (_jsxs(Box, { sx: {
                    mt: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.error.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(MedicalIcon, { sx: { color: theme.palette.error.main } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 600, color: "error.main", children: "Medical Alert" })] }), _jsx(Typography, { variant: "body2", sx: { mt: 1 }, children: medical_alert })] }))] }));
};
export default SpecialNeedsIndicator;
