import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Stack,
  Typography,
  IconButton,
  Badge,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Accessible as AccessibleIcon,
  Visibility as VisualIcon,
  Hearing as HearingIcon,
  Psychology as CognitiveIcon,
  FamilyRestroom as BehavioralIcon,
  LocalHospital as MedicalIcon,
  MenuBook as LearningIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export interface SpecialNeed {
  id: string;
  type: 'physical' | 'visual' | 'hearing' | 'cognitive' | 'behavioral' | 'medical' | 'learning';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  accommodations: string[];
  iep_active?: boolean;
  section_504_active?: boolean;
}

export interface StudentAccommodation {
  student_id: string;
  special_needs: SpecialNeed[];
  has_iep: boolean;
  has_504_plan: boolean;
  emergency_contact_required: boolean;
  medical_alert?: string;
  dietary_restrictions?: string[];
  transportation_needs?: string;
}

interface SpecialNeedsIndicatorProps {
  accommodations?: StudentAccommodation;
  compact?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
}

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

export const SpecialNeedsIndicator: React.FC<SpecialNeedsIndicatorProps> = ({
  accommodations,
  compact = false,
  showDetails = false,
  onClick,
}) => {
  const theme = useTheme();

  if (!accommodations || accommodations.special_needs.length === 0) {
    return null;
  }

  const { special_needs, has_iep, has_504_plan, medical_alert } = accommodations;
  const totalNeeds = special_needs.length;
  const hasCriticalAlert = medical_alert || special_needs.some(need => need.severity === 'severe');

  // Compact display for card headers
  if (compact) {
    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Special Needs & Accommodations
            </Typography>
            {special_needs.map((need) => {
              const config = SPECIAL_NEED_CONFIG[need.type];
              return (
                <Stack key={need.id} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <config.icon sx={{ fontSize: 14, color: config.color }} />
                  <Typography variant="body2">
                    {config.label} ({SEVERITY_CONFIG[need.severity].label})
                  </Typography>
                </Stack>
              );
            })}
            {has_iep && (
              <Chip label="Active IEP" size="small" color="primary" sx={{ mt: 1, mr: 0.5 }} />
            )}
            {has_504_plan && (
              <Chip label="504 Plan" size="small" color="secondary" sx={{ mt: 1 }} />
            )}
          </Box>
        }
        placement="top"
      >
        <Box sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
          <Badge
            badgeContent={totalNeeds}
            color={hasCriticalAlert ? 'error' : 'primary'}
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.6rem',
                height: 16,
                minWidth: 16,
              },
            }}
          >
            <IconButton
              size="small"
              sx={{
                bgcolor: alpha('#3b82f6', 0.1),
                color: '#3b82f6',
                '&:hover': {
                  bgcolor: alpha('#3b82f6', 0.2),
                  transform: 'scale(1.1)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              <AccessibleIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Badge>
        </Box>
      </Tooltip>
    );
  }

  // Detailed display for expanded views
  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <AccessibleIcon sx={{ color: theme.palette.primary.main }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Special Needs & Accommodations
        </Typography>
        {hasCriticalAlert && (
          <WarningIcon sx={{ color: theme.palette.error.main, fontSize: 18 }} />
        )}
      </Stack>

      {/* Official Plans */}
      {(has_iep || has_504_plan) && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {has_iep && (
            <Chip
              label="Active IEP"
              size="small"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600,
              }}
            />
          )}
          {has_504_plan && (
            <Chip
              label="504 Plan"
              size="small"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: 'white',
                fontWeight: 600,
              }}
            />
          )}
        </Stack>
      )}

      {/* Special Needs List */}
      <Stack spacing={1.5}>
        {special_needs.map((need) => {
          const config = SPECIAL_NEED_CONFIG[need.type];
          const severityConfig = SEVERITY_CONFIG[need.severity];
          const IconComponent = config.icon;

          return (
            <Box
              key={need.id}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: config.bgColor,
                border: `1px solid ${alpha(config.color, 0.2)}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(config.color, 0.15)}`,
                },
              }}
            >
              <Stack direction="row" alignItems="flex-start" spacing={2}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: alpha(config.color, 0.1),
                    color: config.color,
                  }}
                >
                  <IconComponent sx={{ fontSize: 20 }} />
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {config.label}
                    </Typography>
                    <Chip
                      label={severityConfig.label}
                      size="small"
                      sx={{
                        bgcolor: alpha(severityConfig.color, 0.1),
                        color: severityConfig.color,
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Stack>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {need.description}
                  </Typography>
                  
                  {need.accommodations.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        fontWeight={500}
                        sx={{ mb: 0.5, display: 'block' }}
                      >
                        Accommodations:
                      </Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {need.accommodations.map((accommodation, index) => (
                          <Chip
                            key={index}
                            label={accommodation}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.65rem',
                              height: 20,
                              borderColor: alpha(config.color, 0.3),
                              color: config.color,
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {/* Medical Alert */}
      {medical_alert && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.error.main, 0.05),
            border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <MedicalIcon sx={{ color: theme.palette.error.main }} />
            <Typography variant="subtitle2" fontWeight={600} color="error.main">
              Medical Alert
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {medical_alert}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SpecialNeedsIndicator;