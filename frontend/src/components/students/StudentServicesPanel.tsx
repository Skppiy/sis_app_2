import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Badge,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  LocalHospital as MedicalIcon,
  DirectionsBus as TransportIcon,
  Restaurant as DietIcon,
  Psychology as CounselingIcon,
  School as AcademicIcon,
  Sports as SportsIcon,
  MusicNote as ArtsIcon,
  Accessibility as AccessibilityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

export interface MedicalInfo {
  conditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    administration_time: string;
    notes?: string;
  }>;
  allergies: Array<{
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction: string;
  }>;
  emergency_procedures: string[];
  physician: {
    name: string;
    phone: string;
    specialty?: string;
  };
  last_physical_date?: string;
  immunizations_current: boolean;
}

export interface TransportationInfo {
  method: 'bus' | 'parent_pickup' | 'walker' | 'other';
  bus_route?: string;
  pickup_location?: string;
  dropoff_location?: string;
  authorized_pickup_persons: Array<{
    name: string;
    relationship: string;
    phone: string;
    id_required: boolean;
  }>;
  special_instructions?: string;
  emergency_contact: {
    name: string;
    phone: string;
  };
}

export interface DietaryInfo {
  restrictions: string[];
  allergies: string[];
  meal_plan: 'full' | 'lunch_only' | 'breakfast_only' | 'none';
  free_reduced_lunch: boolean;
  special_diet_notes?: string;
}

export interface StudentService {
  id: string;
  type: 'counseling' | 'academic_support' | 'speech_therapy' | 'occupational_therapy' | 'physical_therapy' | 'social_work';
  provider: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  goals: string[];
  notes?: string;
  is_active: boolean;
}

export interface StudentServicesData {
  student_id: string;
  medical_info?: MedicalInfo;
  transportation_info?: TransportationInfo;
  dietary_info?: DietaryInfo;
  services: StudentService[];
  last_updated: string;
  updated_by: string;
}

interface StudentServicesPanelProps {
  servicesData?: StudentServicesData;
  compact?: boolean;
  onEdit?: () => void;
  onViewDetails?: () => void;
}

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

export const StudentServicesPanel: React.FC<StudentServicesPanelProps> = ({
  servicesData,
  compact = false,
  onEdit,
  onViewDetails,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  if (!servicesData) {
    return (
      <Paper
        sx={{
          p: 2,
          textAlign: 'center',
          bgcolor: alpha(theme.palette.info.main, 0.05),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          borderRadius: 2,
        }}
      >
        <InfoIcon sx={{ color: theme.palette.info.main, mb: 1 }} />
        <Typography variant="body2" color="info.main">
          No student services information available
        </Typography>
      </Paper>
    );
  };

  const {
    medical_info,
    transportation_info,
    dietary_info,
    services,
    last_updated,
    updated_by,
  } = servicesData;

  const activeServices = services.filter(s => s.is_active);
  const hasAlerts = 
    (medical_info?.allergies.some(a => a.severity === 'severe')) ||
    (dietary_info?.allergies.length && dietary_info.allergies.length > 0) ||
    (medical_info?.emergency_procedures.length && medical_info.emergency_procedures.length > 0);

  // Compact display for student cards
  if (compact) {
    const servicesCount = activeServices.length;
    const hasTransport = !!transportation_info;
    const hasMedical = !!medical_info;
    const hasDietary = !!dietary_info;

    return (
      <Box>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Badge
            badgeContent={hasAlerts ? '!' : null}
            color="error"
            variant="dot"
          >
            <MedicalIcon sx={{ color: theme.palette.primary.main, fontSize: 16 }} />
          </Badge>
          <Typography variant="body2" fontWeight={500} color="primary.main">
            Student Services
          </Typography>
          {servicesCount > 0 && (
            <Chip
              label={`${servicesCount} Active`}
              size="small"
              color="success"
              sx={{ fontSize: '0.7rem', height: 18 }}
            />
          )}
        </Stack>

        <Stack spacing={0.5} sx={{ fontSize: '0.8rem' }}>
          {hasMedical && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <MedicalIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary">
                Medical Info Available
              </Typography>
              {hasAlerts && (
                <WarningIcon sx={{ fontSize: 12, color: theme.palette.error.main }} />
              )}
            </Stack>
          )}

          {hasTransport && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <TransportIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary">
                {TRANSPORT_CONFIG[transportation_info.method].label}
              </Typography>
            </Stack>
          )}

          {hasDietary && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <DietIcon sx={{ fontSize: 12, color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary">
                Dietary: {dietary_info.meal_plan.replace('_', ' ').toUpperCase()}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Button
          size="small"
          onClick={() => setDetailsDialogOpen(true)}
          sx={{ mt: 1, fontSize: '0.75rem' }}
        >
          View Services
        </Button>
      </Box>
    );
  }

  // Full display
  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Badge
            badgeContent={hasAlerts ? '!' : null}
            color="error"
            variant="dot"
          >
            <MedicalIcon sx={{ color: theme.palette.primary.main }} />
          </Badge>
          <Typography variant="h6" fontWeight={600}>
            Student Services
          </Typography>
          {activeServices.length > 0 && (
            <Chip
              label={`${activeServices.length} Active Service${activeServices.length > 1 ? 's' : ''}`}
              size="small"
              color="success"
            />
          )}
        </Stack>
        
        <Stack direction="row" spacing={1}>
          {onEdit && (
            <IconButton size="small" onClick={onEdit}>
              <EditIcon />
            </IconButton>
          )}
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
      </Stack>

      {/* Active Services Summary */}
      {activeServices.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
            Active Services
          </Typography>
          <Stack spacing={1}>
            {activeServices.map(service => {
              const config = SERVICE_CONFIG[service.type];
              const IconComponent = config.icon;

              return (
                <Paper
                  key={service.id}
                  sx={{
                    p: 2,
                    borderLeft: `4px solid ${config.color}`,
                    bgcolor: alpha(config.color, 0.05),
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <IconComponent sx={{ color: config.color }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {config.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Provider: {service.provider} • {service.frequency}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Started: {format(new Date(service.start_date), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* Quick Overview Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {/* Medical */}
        {medical_info && (
          <Paper
            sx={{
              p: 2,
              flex: 1,
              bgcolor: alpha(theme.palette.error.main, 0.05),
              border: hasAlerts ? `1px solid ${theme.palette.error.main}` : '1px solid transparent',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <MedicalIcon sx={{ color: theme.palette.error.main }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Medical
              </Typography>
              {hasAlerts && <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 16 }} />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {medical_info.conditions.length} Condition{medical_info.conditions.length !== 1 ? 's' : ''} •{' '}
              {medical_info.allergies.length} Allerg{medical_info.allergies.length !== 1 ? 'ies' : 'y'}
            </Typography>
          </Paper>
        )}

        {/* Transportation */}
        {transportation_info && (
          <Paper sx={{ p: 2, flex: 1, bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <TransportIcon sx={{ color: theme.palette.info.main }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Transportation
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {TRANSPORT_CONFIG[transportation_info.method].label}
              {transportation_info.bus_route && ` • Route ${transportation_info.bus_route}`}
            </Typography>
          </Paper>
        )}

        {/* Dietary */}
        {dietary_info && (
          <Paper sx={{ p: 2, flex: 1, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <DietIcon sx={{ color: theme.palette.warning.main }} />
              <Typography variant="subtitle2" fontWeight={600}>
                Dietary
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {dietary_info.meal_plan.replace('_', ' ').toUpperCase()}
              {dietary_info.free_reduced_lunch && ' • Free/Reduced'}
            </Typography>
          </Paper>
        )}
      </Stack>

      {/* Expanded Details */}
      <Collapse in={expanded}>
        <Stack spacing={3}>
          {/* Medical Details */}
          {medical_info && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Medical Information
              </Typography>
              
              {medical_info.allergies.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Allergies</Typography>
                  <Stack spacing={0.5}>
                    {medical_info.allergies.map((allergy, index) => (
                      <Chip
                        key={index}
                        label={`${allergy.allergen} (${allergy.severity})`}
                        size="small"
                        color={allergy.severity === 'severe' ? 'error' : allergy.severity === 'moderate' ? 'warning' : 'default'}
                        icon={allergy.severity === 'severe' ? <WarningIcon /> : undefined}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {medical_info.medications.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Medications</Typography>
                  <List dense>
                    {medical_info.medications.map((med, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <MedicalIcon sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${med.name} - ${med.dosage}`}
                          secondary={`${med.administration_time}${med.notes ? ` • ${med.notes}` : ''}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          )}

          {/* Transportation Details */}
          {transportation_info && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Transportation Information
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Method</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {TRANSPORT_CONFIG[transportation_info.method].label}
                  </Typography>
                </Box>

                {transportation_info.authorized_pickup_persons.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Authorized Pickup Persons</Typography>
                    <List dense>
                      {transportation_info.authorized_pickup_persons.map((person, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <PersonIcon sx={{ fontSize: 16 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={person.name}
                            secondary={`${person.relationship} • ${person.phone}${person.id_required ? ' • ID Required' : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Stack>
            </Paper>
          )}
        </Stack>

        {/* Last Updated */}
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
          <Typography variant="caption" color="text.secondary">
            Last updated: {format(new Date(last_updated), 'MMM dd, yyyy')} by {updated_by}
          </Typography>
        </Box>
      </Collapse>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Student Services Information</DialogTitle>
        <DialogContent>
          <StudentServicesPanel
            servicesData={servicesData}
            compact={false}
            onEdit={onEdit}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {onEdit && (
            <Button onClick={onEdit} variant="contained">
              Edit Services
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentServicesPanel;