import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IconButton, Tooltip, Stack, Button, ButtonGroup, alpha, useTheme, } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon, Visibility as ViewIcon, MoreVert as MoreIcon, } from '@mui/icons-material';
export const ActionButtons = ({ onEdit, onDelete, onEnroll, onView, variant = 'icons', size = 'small', disabled = false, className, }) => {
    const theme = useTheme();
    const buttonSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
    const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;
    if (variant === 'buttons') {
        return (_jsxs(ButtonGroup, { variant: "outlined", size: size, className: className, sx: {
                '& .MuiButton-root': {
                    minWidth: 'auto',
                    px: 1.5,
                },
            }, children: [onView && (_jsx(Button, { onClick: onView, disabled: disabled, startIcon: _jsx(ViewIcon, { sx: { fontSize: iconSize } }), children: "View" })), onEnroll && (_jsx(Button, { onClick: onEnroll, disabled: disabled, startIcon: _jsx(PersonAddIcon, { sx: { fontSize: iconSize } }), color: "primary", children: "Enroll" })), onEdit && (_jsx(Button, { onClick: onEdit, disabled: disabled, startIcon: _jsx(EditIcon, { sx: { fontSize: iconSize } }), color: "info", children: "Edit" })), onDelete && (_jsx(Button, { onClick: onDelete, disabled: disabled, startIcon: _jsx(DeleteIcon, { sx: { fontSize: iconSize } }), color: "error", children: "Delete" }))] }));
    }
    if (variant === 'compact') {
        return (_jsx(Stack, { direction: "row", spacing: 0.5, className: className, children: (onView || onEnroll || onEdit || onDelete) && (_jsx(Tooltip, { title: "More actions", children: _jsx(IconButton, { size: size, disabled: disabled, sx: {
                        width: buttonSize,
                        height: buttonSize,
                        bgcolor: alpha(theme.palette.action.hover, 0.8),
                        '&:hover': {
                            bgcolor: alpha(theme.palette.action.hover, 1),
                        },
                    }, children: _jsx(MoreIcon, { sx: { fontSize: iconSize } }) }) })) }));
    }
    // Default 'icons' variant
    return (_jsxs(Stack, { direction: "row", spacing: 0.5, className: className, children: [onView && (_jsx(Tooltip, { title: "View Details", placement: "top", children: _jsx(IconButton, { size: size, onClick: onView, disabled: disabled, sx: {
                        width: buttonSize,
                        height: buttonSize,
                        bgcolor: alpha(theme.palette.action.active, 0.08),
                        '&:hover': {
                            bgcolor: alpha(theme.palette.action.active, 0.12),
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                    }, children: _jsx(ViewIcon, { sx: { fontSize: iconSize } }) }) })), onEnroll && (_jsx(Tooltip, { title: "Enroll in Class", placement: "top", children: _jsx(IconButton, { size: size, onClick: onEnroll, disabled: disabled, sx: {
                        width: buttonSize,
                        height: buttonSize,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                    }, children: _jsx(PersonAddIcon, { sx: { fontSize: iconSize } }) }) })), onEdit && (_jsx(Tooltip, { title: "Edit Student", placement: "top", children: _jsx(IconButton, { size: size, onClick: onEdit, disabled: disabled, sx: {
                        width: buttonSize,
                        height: buttonSize,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.info.main, 0.2),
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                    }, children: _jsx(EditIcon, { sx: { fontSize: iconSize } }) }) })), onDelete && (_jsx(Tooltip, { title: "Delete Student", placement: "top", children: _jsx(IconButton, { size: size, onClick: onDelete, disabled: disabled, sx: {
                        width: buttonSize,
                        height: buttonSize,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main,
                        '&:hover': {
                            bgcolor: alpha(theme.palette.error.main, 0.2),
                            transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease',
                    }, children: _jsx(DeleteIcon, { sx: { fontSize: iconSize } }) }) }))] }));
};
export default ActionButtons;
