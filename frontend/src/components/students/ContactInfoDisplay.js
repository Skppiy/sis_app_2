import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Typography, Stack, IconButton, Collapse, Chip, Avatar, Dialog, DialogTitle, DialogContent, Button, alpha, useTheme, } from '@mui/material';
import { Person as PersonIcon, Email as EmailIcon, Phone as PhoneIcon, Business as BusinessIcon, Emergency as EmergencyIcon, ContactMail as ContactIcon, ExpandMore as ExpandMoreIcon, LocationOn as LocationIcon, LocalHospital as MedicalIcon, DirectionsBus as TransportIcon, Restaurant as DietIcon, } from '@mui/icons-material';
const getRelationshipIcon = (relationship) => {
    const rel = relationship.toLowerCase();
    if (rel.includes('parent') || rel.includes('mother') || rel.includes('father')) {
        return PersonIcon;
    }
    if (rel.includes('guardian')) {
        return BusinessIcon;
    }
    if (rel.includes('emergency')) {
        return EmergencyIcon;
    }
    return ContactIcon;
};
const getContactTypeColor = (type, theme) => {
    switch (type) {
        case 'primary':
            return theme.palette.primary.main;
        case 'secondary':
            return theme.palette.secondary.main;
        case 'emergency':
            return theme.palette.error.main;
        default:
            return theme.palette.text.secondary;
    }
};
export const ContactInfoDisplay = ({ contactInfo, compact = false, showActions = false, onEdit, onCall, onEmail, }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    if (!contactInfo || contactInfo.contacts.length === 0) {
        return (_jsxs(Box, { sx: {
                p: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                borderRadius: 2,
            }, children: [_jsx(ContactIcon, { sx: { color: theme.palette.warning.main, mb: 1 } }), _jsx(Typography, { variant: "body2", color: "warning.main", children: "No contact information available" })] }));
    }
    const { contacts, medical_contacts = [], dietary_restrictions = [], medical_conditions = [], allergies = [] } = contactInfo;
    const primaryContacts = contacts.filter(c => c.is_primary_contact);
    const emergencyContacts = contacts.filter(c => c.is_emergency_contact);
    const hasSpecialNeeds = dietary_restrictions.length > 0 || medical_conditions.length > 0 || allergies.length > 0;
    // Compact display for student cards
    if (compact) {
        const primaryContact = primaryContacts[0];
        const emergencyContact = emergencyContacts[0];
        return (_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(ContactIcon, { sx: { color: theme.palette.primary.main, fontSize: 16 } }), _jsx(Typography, { variant: "body2", fontWeight: 500, color: "primary.main", children: "Contact Information" }), hasSpecialNeeds && (_jsx(Chip, { label: "Special Needs", size: "small", color: "warning", sx: { fontSize: '0.7rem', height: 18 } }))] }), primaryContact && (_jsxs(Stack, { spacing: 0.5, children: [_jsxs(Typography, { variant: "body2", fontWeight: 500, children: [primaryContact.first_name, " ", primaryContact.last_name] }), _jsxs(Typography, { variant: "caption", color: "text.secondary", children: [primaryContact.relationship, " \u2022 Primary"] }), primaryContact.phone_primary && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(PhoneIcon, { sx: { fontSize: 12, mr: 0.5, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: primaryContact.phone_primary })] })), primaryContact.email && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(EmailIcon, { sx: { fontSize: 12, mr: 0.5, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: primaryContact.email })] }))] })), _jsx(Button, { size: "small", onClick: () => setDetailsOpen(true), sx: { mt: 1, fontSize: '0.75rem' }, children: "View All Contacts" })] }));
    }
    // Full display for expanded views
    return (_jsxs(Box, { children: [_jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "space-between", sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(ContactIcon, { sx: { color: theme.palette.primary.main } }), _jsx(Typography, { variant: "h6", fontWeight: 600, children: "Contact Information" }), hasSpecialNeeds && (_jsx(Chip, { label: "Special Needs", size: "small", color: "warning", icon: _jsx(MedicalIcon, { sx: { fontSize: '14px !important' } }) }))] }), _jsx(IconButton, { size: "small", onClick: () => setExpanded(!expanded), sx: {
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease',
                        }, children: _jsx(ExpandMoreIcon, {}) })] }), _jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 1 }, children: "Primary Contacts" }), _jsx(Stack, { spacing: 1, children: primaryContacts.map((contact) => (_jsx(ContactCard, { contact: contact, onCall: onCall, onEmail: onEmail, theme: theme }, contact.id))) })] }), emergencyContacts.length > 0 && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 1 }, children: "Emergency Contacts" }), _jsx(Stack, { spacing: 1, children: emergencyContacts.map((contact) => (_jsx(ContactCard, { contact: contact, onCall: onCall, onEmail: onEmail, theme: theme, isEmergency: true }, contact.id))) })] })), _jsxs(Collapse, { in: expanded, children: [hasSpecialNeeds && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 2 }, children: "Special Care Requirements" }), dietary_restrictions.length > 0 && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(DietIcon, { sx: { color: theme.palette.warning.main, fontSize: 18 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 500, children: "Dietary Restrictions" })] }), _jsx(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", children: dietary_restrictions.map((restriction, index) => (_jsx(Chip, { label: restriction, size: "small", sx: {
                                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                color: theme.palette.warning.main,
                                            } }, index))) })] })), allergies.length > 0 && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(MedicalIcon, { sx: { color: theme.palette.error.main, fontSize: 18 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 500, color: "error.main", children: "Allergies" })] }), _jsx(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", children: allergies.map((allergy, index) => (_jsx(Chip, { label: allergy, size: "small", color: "error", variant: "outlined" }, index))) })] })), medical_conditions.length > 0 && (_jsxs(Box, { sx: { mb: 2 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(MedicalIcon, { sx: { color: theme.palette.info.main, fontSize: 18 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 500, children: "Medical Conditions" })] }), _jsx(Stack, { direction: "row", spacing: 0.5, flexWrap: "wrap", children: medical_conditions.map((condition, index) => (_jsx(Chip, { label: condition, size: "small", sx: {
                                                bgcolor: alpha(theme.palette.info.main, 0.1),
                                                color: theme.palette.info.main,
                                            } }, index))) })] }))] })), contactInfo.transportation_notes && (_jsxs(Box, { sx: { mb: 3 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 1 }, children: [_jsx(TransportIcon, { sx: { color: theme.palette.primary.main, fontSize: 18 } }), _jsx(Typography, { variant: "subtitle2", fontWeight: 500, children: "Transportation Notes" })] }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: contactInfo.transportation_notes })] })), contacts.filter(c => !c.is_primary_contact && !c.is_emergency_contact).length > 0 && (_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle1", fontWeight: 600, sx: { mb: 1 }, children: "Other Contacts" }), _jsx(Stack, { spacing: 1, children: contacts
                                    .filter(c => !c.is_primary_contact && !c.is_emergency_contact)
                                    .map((contact) => (_jsx(ContactCard, { contact: contact, onCall: onCall, onEmail: onEmail, theme: theme }, contact.id))) })] }))] }), _jsxs(Dialog, { open: detailsOpen, onClose: () => setDetailsOpen(false), maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "Complete Contact Information" }), _jsx(DialogContent, { children: _jsx(ContactInfoDisplay, { contactInfo: contactInfo, compact: false, showActions: showActions, onEdit: onEdit, onCall: onCall, onEmail: onEmail }) })] })] }));
};
const ContactCard = ({ contact, onCall, onEmail, theme, isEmergency = false, }) => {
    const RelationshipIcon = getRelationshipIcon(contact.relationship);
    const typeColor = getContactTypeColor(contact.type, theme);
    return (_jsx(Box, { sx: {
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(typeColor, 0.05),
            border: `1px solid ${alpha(typeColor, 0.2)}`,
            transition: 'all 0.2s ease',
            '&:hover': {
                bgcolor: alpha(typeColor, 0.08),
                transform: 'translateY(-1px)',
            },
        }, children: _jsxs(Stack, { direction: "row", alignItems: "flex-start", spacing: 2, children: [_jsx(Avatar, { sx: {
                        bgcolor: alpha(typeColor, 0.1),
                        color: typeColor,
                        width: 40,
                        height: 40,
                    }, children: _jsx(RelationshipIcon, { sx: { fontSize: 20 } }) }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, sx: { mb: 0.5 }, children: [_jsxs(Typography, { variant: "subtitle2", fontWeight: 600, children: [contact.first_name, " ", contact.last_name] }), _jsx(Chip, { label: contact.relationship, size: "small", sx: {
                                        bgcolor: alpha(typeColor, 0.1),
                                        color: typeColor,
                                        fontWeight: 500,
                                        fontSize: '0.7rem',
                                    } }), isEmergency && (_jsx(Chip, { label: "Emergency", size: "small", color: "error", sx: { fontSize: '0.7rem' } }))] }), _jsxs(Stack, { spacing: 0.5, children: [contact.phone_primary && (_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(PhoneIcon, { sx: { fontSize: 14, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: {
                                                cursor: onCall ? 'pointer' : 'default',
                                                '&:hover': onCall ? { color: theme.palette.primary.main } : {},
                                            }, onClick: () => onCall?.(contact.phone_primary), children: contact.phone_primary })] })), contact.email && (_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(EmailIcon, { sx: { fontSize: 14, color: theme.palette.text.secondary } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: {
                                                cursor: onEmail ? 'pointer' : 'default',
                                                '&:hover': onEmail ? { color: theme.palette.primary.main } : {},
                                            }, onClick: () => onEmail?.(contact.email), children: contact.email })] })), contact.address && (_jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [_jsx(LocationIcon, { sx: { fontSize: 14, color: theme.palette.text.secondary } }), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [contact.address, contact.city && `, ${contact.city}`, contact.state && ` ${contact.state}`, contact.zip_code && ` ${contact.zip_code}`] })] }))] }), contact.notes && (_jsx(Box, { sx: { mt: 1, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }, children: _jsx(Typography, { variant: "caption", color: "text.secondary", children: contact.notes }) }))] })] }) }));
};
export default ContactInfoDisplay;
