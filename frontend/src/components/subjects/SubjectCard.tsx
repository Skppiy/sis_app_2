import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Book as BookIcon,
  Code as CodeIcon,
  School as SchoolIcon,
  Science as ScienceIcon,
  Palette as PaletteIcon,
  Sports as SportsIcon,
  Language as LanguageIcon,
  Calculate as MathIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { Subject } from '@/schemas/academics';

interface SubjectCardProps {
  subject: Subject;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

// Subject type color mapping
const SUBJECT_TYPE_CONFIG = {
  CORE: {
    primary: '#1976d2',
    secondary: '#42a5f5',
    background: '#e3f2fd',
    border: '#bbdefb',
    label: 'Core Subject',
    icon: BookIcon,
    gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
  },
  ENRICHMENT: {
    primary: '#7b1fa2',
    secondary: '#ba68c8',
    background: '#f3e5f5',
    border: '#e1bee7',
    label: 'Enrichment',
    icon: PaletteIcon,
    gradient: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)',
  },
  ELECTIVE: {
    primary: '#388e3c',
    secondary: '#66bb6a',
    background: '#e8f5e8',
    border: '#c8e6c9',
    label: 'Elective',
    icon: StarIcon,
    gradient: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
  },
};

// Get subject icon based on name/code
const getSubjectIcon = (name: string, code: string) => {
  const lowerName = name.toLowerCase();
  const lowerCode = code.toLowerCase();
  
  if (lowerName.includes('math') || lowerCode.includes('math')) return MathIcon;
  if (lowerName.includes('science') || lowerCode.includes('sci')) return ScienceIcon;
  if (lowerName.includes('language') || lowerName.includes('english') || lowerCode.includes('eng')) return LanguageIcon;
  if (lowerName.includes('art') || lowerName.includes('creative')) return PaletteIcon;
  if (lowerName.includes('sport') || lowerName.includes('physical') || lowerName.includes('pe')) return SportsIcon;
  if (lowerName.includes('computer') || lowerName.includes('coding') || lowerCode.includes('cs')) return CodeIcon;
  
  return BookIcon; // Default
};

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();
  
  // Get configuration for subject type
  const typeConfig = SUBJECT_TYPE_CONFIG[subject.subject_type as keyof typeof SUBJECT_TYPE_CONFIG] || SUBJECT_TYPE_CONFIG.CORE;
  const SubjectIcon = getSubjectIcon(subject.name, subject.code);
  const ContentIcon = typeConfig.icon;

  // Calculate applicable levels
  const applicableLevels = [
    subject.applies_to_elementary && 'Elementary',
    subject.applies_to_middle && 'Middle School',
    subject.applies_to_high && 'High School',
  ].filter(Boolean);

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: `2px solid ${alpha(typeConfig.primary, 0.2)}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          borderColor: typeConfig.primary,
          '& .action-buttons': {
            opacity: 1,
            transform: 'translateX(0)',
          },
          '& .subject-icon': {
            transform: 'scale(1.1) rotate(5deg)',
            boxShadow: `0 8px 24px ${alpha(typeConfig.primary, 0.4)}`,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: typeConfig.gradient,
        },
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Icon and Type */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box
            className="subject-icon"
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: typeConfig.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 4px 16px ${alpha(typeConfig.primary, 0.3)}`,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -2,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(typeConfig.primary, 0.1)}, transparent)`,
                zIndex: -1,
              },
            }}
          >
            <SubjectIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Chip
                icon={<ContentIcon sx={{ fontSize: '16px !important' }} />}
                label={typeConfig.label}
                size="small"
                sx={{
                  background: typeConfig.gradient,
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
              {subject.requires_specialist && (
                <Chip
                  label="Specialist Required"
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack
            direction="row"
            spacing={0.5}
            className="action-buttons"
            sx={{
              opacity: 0,
              transform: 'translateX(20px)',
              transition: 'all 0.3s ease',
            }}
          >
            <Tooltip title="Edit Subject" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(subject);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.info.main, 0.2),
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Delete Subject" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(subject);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.2),
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {/* Subject Details */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 0.5,
              fontSize: '1.2rem',
              lineHeight: 1.2,
            }}
          >
            {subject.name}
          </Typography>
          
          {subject.code && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                backgroundColor: alpha(typeConfig.primary, 0.1),
                px: 1,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              {subject.code}
            </Typography>
          )}
        </Box>

        {/* Applicable Levels */}
        <Box sx={{ mb: 'auto' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Applicable Levels:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
            <Chip
              icon={subject.applies_to_elementary ? <CheckIcon /> : <CancelIcon />}
              label="Elementary"
              size="small"
              color={subject.applies_to_elementary ? "success" : "default"}
              variant={subject.applies_to_elementary ? "filled" : "outlined"}
              sx={{ fontSize: '0.75rem' }}
            />
            <Chip
              icon={subject.applies_to_middle ? <CheckIcon /> : <CancelIcon />}
              label="Middle"
              size="small"
              color={subject.applies_to_middle ? "success" : "default"}
              variant={subject.applies_to_middle ? "filled" : "outlined"}
              sx={{ fontSize: '0.75rem' }}
            />
            {subject.applies_to_high && (
              <Chip
                icon={<CheckIcon />}
                label="High School"
                size="small"
                color="success"
                sx={{ fontSize: '0.75rem' }}
              />
            )}
          </Stack>
        </Box>

        {/* Footer Stats/Info */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(typeConfig.primary, 0.08),
            border: `1px solid ${alpha(typeConfig.primary, 0.15)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon 
                sx={{ 
                  fontSize: 18, 
                  mr: 1, 
                  color: typeConfig.primary 
                }} 
              />
              <Typography 
                variant="body2" 
                fontWeight={600}
                color={typeConfig.primary}
              >
                {applicableLevels.length > 0 
                  ? `${applicableLevels.length} Level${applicableLevels.length > 1 ? 's' : ''}` 
                  : 'No Levels'
                }
              </Typography>
            </Box>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              {subject.subject_type}
            </Typography>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubjectCard;