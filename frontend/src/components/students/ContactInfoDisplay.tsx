import React, { useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Collapse,
  Divider,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Business as BusinessIcon,
  Emergency as EmergencyIcon,
  ContactMail as ContactIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocationOn as LocationIcon,
  LocalHospital as MedicalIcon,
  DirectionsBus as TransportIcon,
  Restaurant as DietIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

export interface ContactInfo {
  id: string;
  type: 'primary' | 'secondary' | 'emergency';
  relationship: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_primary?: string;
  phone_secondary?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_primary_contact: boolean;
  is_emergency_contact: boolean;
  can_pickup: boolean;
  notes?: string;
}

export interface StudentContactInfo {
  student_id: string;
  contacts: ContactInfo[];
  medical_contacts?: ContactInfo[];
  primary_address?: string;
  transportation_notes?: string;
  dietary_restrictions?: string[];
  medical_conditions?: string[];
  allergies?: string[];
  emergency_procedures?: string;
}

interface ContactInfoDisplayProps {
  contactInfo?: StudentContactInfo;
  compact?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

const getRelationshipIcon = (relationship: string) => {
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

const getContactTypeColor = (type: string, theme: any) => {
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

export const ContactInfoDisplay: React.FC<ContactInfoDisplayProps> = ({
  contactInfo,
  compact = false,
  showActions = false,
  onEdit,
  onCall,
  onEmail,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!contactInfo || contactInfo.contacts.length === 0) {
    return (
      <Box
        sx={{
          p: 2,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.warning.main, 0.05),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          borderRadius: 2,
        }}
      >
        <ContactIcon sx={{ color: theme.palette.warning.main, mb: 1 }} />
        <Typography variant="body2" color="warning.main">
          No contact information available
        </Typography>
      </Box>
    );
  }

  const { contacts, medical_contacts = [], dietary_restrictions = [], medical_conditions = [], allergies = [] } = contactInfo;
  const primaryContacts = contacts.filter(c => c.is_primary_contact);
  const emergencyContacts = contacts.filter(c => c.is_emergency_contact);
  const hasSpecialNeeds = dietary_restrictions.length > 0 || medical_conditions.length > 0 || allergies.length > 0;

  // Compact display for student cards
  if (compact) {
    const primaryContact = primaryContacts[0];
    const emergencyContact = emergencyContacts[0];

    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <ContactIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />
          <Typography variant="body2" fontWeight={500} color="primary.main">
            Contact Information
          </Typography>
          {hasSpecialNeeds && (
            <Chip
              label="Special Needs"
              size="small"
              color="warning"
              sx={{ fontSize: '0.7rem', height: 18 }}
            />
          )}
        </Stack>

        {primaryContact && (
          <Stack spacing={0.5}>
            <Typography variant="body2" fontWeight={500}>
              {primaryContact.first_name} {primaryContact.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {primaryContact.relationship} • Primary
            </Typography>
            {primaryContact.phone_primary && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ fontSize: 12, mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="caption" color="text.secondary">
                  {primaryContact.phone_primary}
                </Typography>
              </Box>
            )}
            {primaryContact.email && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ fontSize: 12, mr: 0.5, color: theme.palette.text.secondary }} />
                <Typography variant="caption" color="text.secondary">
                  {primaryContact.email}
                </Typography>
              </Box>
            )}
          </Stack>
        )}

        <Button
          size="small"
          onClick={() => setDetailsOpen(true)}
          sx={{ mt: 1, fontSize: '0.75rem' }}
        >
          View All Contacts
        </Button>
      </Box>
    );
  }

  // Full display for expanded views
  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ContactIcon sx={{ color: theme.palette.primary.main }} />
          <Typography variant="h6" fontWeight={600}>
            Contact Information
          </Typography>
          {hasSpecialNeeds && (
            <Chip
              label="Special Needs"
              size="small"
              color="warning"
              icon={<MedicalIcon sx={{ fontSize: '14px !important' }} />}
            />
          )}
        </Stack>
        
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Stack>

      {/* Primary Contacts */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          Primary Contacts
        </Typography>
        <Stack spacing={1}>
          {primaryContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onCall={onCall}
              onEmail={onEmail}
              theme={theme}
            />
          ))}
        </Stack>
      </Box>

      {/* Emergency Contacts */}
      {emergencyContacts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Emergency Contacts
          </Typography>
          <Stack spacing={1}>
            {emergencyContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onCall={onCall}
                onEmail={onEmail}
                theme={theme}
                isEmergency
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Expanded Details */}
      <Collapse in={expanded}>
        {/* Special Needs Summary */}
        {hasSpecialNeeds && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Special Care Requirements
            </Typography>
            
            {dietary_restrictions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <DietIcon sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={500}>
                    Dietary Restrictions
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {dietary_restrictions.map((restriction, index) => (
                    <Chip
                      key={index}
                      label={restriction}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                        color: theme.palette.warning.main,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {allergies.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <MedicalIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={500} color="error.main">
                    Allergies
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {allergies.map((allergy, index) => (
                    <Chip
                      key={index}
                      label={allergy}
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {medical_conditions.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <MedicalIcon sx={{ color: theme.palette.info.main, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={500}>
                    Medical Conditions
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {medical_conditions.map((condition, index) => (
                    <Chip
                      key={index}
                      label={condition}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        color: theme.palette.info.main,
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        )}

        {/* Transportation */}
        {contactInfo.transportation_notes && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <TransportIcon sx={{ color: theme.palette.primary.main, fontSize: 18 }} />
              <Typography variant="subtitle2" fontWeight={500}>
                Transportation Notes
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {contactInfo.transportation_notes}
            </Typography>
          </Box>
        )}

        {/* All Other Contacts */}
        {contacts.filter(c => !c.is_primary_contact && !c.is_emergency_contact).length > 0 && (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Other Contacts
            </Typography>
            <Stack spacing={1}>
              {contacts
                .filter(c => !c.is_primary_contact && !c.is_emergency_contact)
                .map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onCall={onCall}
                    onEmail={onEmail}
                    theme={theme}
                  />
                ))}
            </Stack>
          </Box>
        )}
      </Collapse>

      {/* Full Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Contact Information</DialogTitle>
        <DialogContent>
          <ContactInfoDisplay
            contactInfo={contactInfo}
            compact={false}
            showActions={showActions}
            onEdit={onEdit}
            onCall={onCall}
            onEmail={onEmail}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Contact Card Component
interface ContactCardProps {
  contact: ContactInfo;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
  theme: any;
  isEmergency?: boolean;
}

const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onCall,
  onEmail,
  theme,
  isEmergency = false,
}) => {
  const RelationshipIcon = getRelationshipIcon(contact.relationship);
  const typeColor = getContactTypeColor(contact.type, theme);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: alpha(typeColor, 0.05),
        border: `1px solid ${alpha(typeColor, 0.2)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          bgcolor: alpha(typeColor, 0.08),
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={2}>
        <Avatar
          sx={{
            bgcolor: alpha(typeColor, 0.1),
            color: typeColor,
            width: 40,
            height: 40,
          }}
        >
          <RelationshipIcon sx={{ fontSize: 20 }} />
        </Avatar>
        
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              {contact.first_name} {contact.last_name}
            </Typography>
            <Chip
              label={contact.relationship}
              size="small"
              sx={{
                bgcolor: alpha(typeColor, 0.1),
                color: typeColor,
                fontWeight: 500,
                fontSize: '0.7rem',
              }}
            />
            {isEmergency && (
              <Chip
                label="Emergency"
                size="small"
                color="error"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Stack>
          
          <Stack spacing={0.5}>
            {contact.phone_primary && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <PhoneIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    cursor: onCall ? 'pointer' : 'default',
                    '&:hover': onCall ? { color: theme.palette.primary.main } : {},
                  }}
                  onClick={() => onCall?.(contact.phone_primary!)}
                >
                  {contact.phone_primary}
                </Typography>
              </Stack>
            )}
            
            {contact.email && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <EmailIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    cursor: onEmail ? 'pointer' : 'default',
                    '&:hover': onEmail ? { color: theme.palette.primary.main } : {},
                  }}
                  onClick={() => onEmail?.(contact.email!)}
                >
                  {contact.email}
                </Typography>
              </Stack>
            )}
            
            {contact.address && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocationIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                <Typography variant="body2" color="text.secondary">
                  {contact.address}
                  {contact.city && `, ${contact.city}`}
                  {contact.state && ` ${contact.state}`}
                  {contact.zip_code && ` ${contact.zip_code}`}
                </Typography>
              </Stack>
            )}
          </Stack>
          
          {contact.notes && (
            <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Typography variant="caption" color="text.secondary">
                {contact.notes}
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

export default ContactInfoDisplay;