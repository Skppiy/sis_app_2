import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
export const CrudModal = ({ title, open, onClose, onSubmit, children }) => {
    return (_jsxs(Dialog, { open: open, onClose: onClose, fullWidth: true, maxWidth: "sm", children: [_jsx(DialogTitle, { children: title }), _jsx(DialogContent, { dividers: true, children: children ?? _jsx("em", { children: "Form fields go here" }) }), _jsxs(DialogActions, { children: [_jsx(Button, { onClick: onClose, children: "Cancel" }), _jsx(Button, { variant: "contained", onClick: onSubmit, children: "Save" })] })] }));
};
