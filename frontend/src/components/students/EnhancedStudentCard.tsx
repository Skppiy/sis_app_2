import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Collapse,
  Checkbox,
  Badge,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  School as SchoolIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Phone as PhoneIcon,
  ContactMail as ContactIcon,
  Star as StarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Student, GRADE_LEVELS } from '@/schemas/students';
// Import simplified status badge only - removing complex dependencies temporarily
import { StatusBadge } from './StatusBadge';

interface EnhancedStudentCardProps {
  student: Student;
  selected?: boolean;
  onSelect?: (studentId: string, selected: boolean) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onEnroll: (student: Student) => void;
  onExpandEnrollments: (studentId: string) => void;
  isExpanded: boolean;
  enrollmentCount?: number;
  // Enhanced data - simplified for now
  accommodations?: any; // Will be properly typed when backend is ready
  contactInfo?: any;    // Will be properly typed when backend is ready
  // Additional features
  showSelection?: boolean;
  compact?: boolean;
  highlighted?: boolean;
  priority?: 'high' | 'medium' | 'low';
  // Actions
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
  onViewProfile?: (student: Student) => void;
}

export const EnhancedStudentCard: React.FC<EnhancedStudentCardProps> = ({
  student,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onEnroll,
  onExpandEnrollments,
  isExpanded,
  enrollmentCount = 0,
  accommodations,
  contactInfo,
  showSelection = false,
  compact = false,
  highlighted = false,
  priority,
  onCall,
  onEmail,
  onViewProfile,
}) => {
  const theme = useTheme();
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  
  // Generate initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Get grade level label
  const getGradeLabel = (gradeValue: string) => {
    const grade = GRADE_LEVELS.find(g => g.value === gradeValue);
    return grade ? grade.label : gradeValue;
  };

  // Format date display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  // Get priority colors
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const hasSpecialNeeds = false; // Will be enabled when backend data is available
  const hasContacts = false;     // Will be enabled when backend data is available  
  const hasMedicalAlert = false; // Will be enabled when backend data is available
  const priorityColor = priority ? getPriorityColor() : theme.palette.primary.main;

  return (
    <Card
      sx={{
        position: 'relative',
        minHeight: '400px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: selected 
          ? `3px solid ${theme.palette.primary.main}`
          : highlighted
          ? `2px solid ${theme.palette.secondary.main}`
          : `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: 4,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          transform: selected ? 'scale(1.02)' : 'translateY(-6px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          borderColor: priorityColor,
          '& .action-buttons': {
            opacity: 1,
            transform: 'translateX(0)',
          },
          '& .student-avatar': {
            transform: 'scale(1.15)',
            boxShadow: `0 8px 24px ${alpha(priorityColor, 0.4)}`,
          },
          '& .card-content': {
            transform: 'translateY(-2px)',
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: priority 
            ? `linear-gradient(90deg, ${priorityColor}, ${alpha(priorityColor, 0.7)})`
            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
          zIndex: 1,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'transparent',
          pointerEvents: 'none',
        },
      }}
    >
      <CardContent 
        className="card-content"
        sx={{ 
          p: 3, 
          '&:last-child': { pb: 3 }, 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header with Avatar and Basic Info */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          {/* Selection Checkbox */}
          {showSelection && (
            <Box sx={{ mr: 1, mt: 0.5 }}>
              <Checkbox
                checked={selected}
                onChange={(e) => onSelect?.(student.id, e.target.checked)}
                size="small"
                sx={{
                  color: theme.palette.primary.main,
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          )}

          {/* Avatar with Status Indicators */}
          <Box sx={{ position: 'relative', mr: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              badgeContent={
                priority && (
                  <StarIcon 
                    sx={{ 
                      fontSize: 16, 
                      color: priorityColor,
                      bgcolor: 'white',
                      borderRadius: '50%',
                      p: 0.2,
                    }} 
                  />
                )
              }
            >
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  hasMedicalAlert ? (
                    <WarningIcon 
                      sx={{ 
                        fontSize: 16, 
                        color: theme.palette.error.main,
                        bgcolor: 'white',
                        borderRadius: '50%',
                        p: 0.2,
                      }} 
                    />
                  ) : null
                }
              >
                <Avatar
                  className="student-avatar"
                  sx={{
                    width: 64,
                    height: 64,
                    background: `linear-gradient(135deg, ${priorityColor}, ${alpha(priorityColor, 0.8)})`,
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    boxShadow: `0 6px 16px ${alpha(priorityColor, 0.3)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `3px solid ${alpha('#ffffff', 0.2)}`,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -2,
                      left: -2,
                      right: -2,
                      bottom: -2,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${alpha(priorityColor, 0.2)}, transparent)`,
                      zIndex: -1,
                    },
                  }}
                >
                  {getInitials(student.first_name, student.last_name)}
                </Avatar>
              </Badge>
            </Badge>
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
                fontSize: '1.1rem',
              }}
            >
              {student.first_name} {student.last_name}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={getGradeLabel(student.current_grade_level)}
                size="small"
                sx={{
                  background: `linear-gradient(45deg, ${priorityColor}, ${alpha(priorityColor, 0.8)})`,
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
              <StatusBadge 
                status={student.is_active ? 'active' : 'inactive'} 
                size="small"
              />
              {hasSpecialNeeds && (
                <Chip
                  label="Special Needs"
                  size="small"
                  color="warning"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
              {priority && (
                <Chip
                  label={`${priority.toUpperCase()} Priority`}
                  size="small"
                  sx={{
                    bgcolor: alpha(priorityColor, 0.1),
                    color: priorityColor,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </Stack>

            {student.student_id && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.85rem' }}
              >
                ID: {student.student_id}
              </Typography>
            )}
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
            <Tooltip title="Enroll in Class" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnroll(student);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <PersonAddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Edit Student" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(student);
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
            
            <Tooltip title="Delete Student" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(student);
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

        <Divider sx={{ my: 2, opacity: 0.6 }} />

        {/* Quick Info Section */}
        <Stack spacing={1.5}>
          {student.email && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EmailIcon 
                sx={{ 
                  fontSize: 16, 
                  mr: 1.5, 
                  color: theme.palette.text.secondary 
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.85rem',
                  cursor: onEmail ? 'pointer' : 'default',
                  '&:hover': onEmail ? { color: theme.palette.primary.main } : {},
                }}
                onClick={() => onEmail?.(student.email!)}
              >
                {student.email}
              </Typography>
            </Box>
          )}

          {student.date_of_birth && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CakeIcon 
                sx={{ 
                  fontSize: 16, 
                  mr: 1.5, 
                  color: theme.palette.text.secondary 
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.85rem' }}
              >
                Born: {formatDate(student.date_of_birth)}
              </Typography>
            </Box>
          )}

          {student.entry_date && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon 
                sx={{ 
                  fontSize: 16, 
                  mr: 1.5, 
                  color: theme.palette.text.secondary 
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.85rem' }}
              >
                Enrolled: {formatDate(student.entry_date)}
              </Typography>
            </Box>
          )}

          {/* Placeholder for Special Needs - will be enabled when data is available */}
          {hasSpecialNeeds && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                color="warning.main"
                sx={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => setDetailsExpanded(!detailsExpanded)}
              >
                Special Accommodations Required
              </Typography>
            </Box>
          )}

          {/* Placeholder for Contact Info - will be enabled when data is available */}
          {hasContacts && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ContactIcon 
                sx={{ 
                  fontSize: 16, 
                  mr: 1.5, 
                  color: theme.palette.text.secondary 
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.85rem', cursor: 'pointer' }}
                onClick={() => setDetailsExpanded(!detailsExpanded)}
              >
                Contact Information Available
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Enrollment Status Footer */}
        <Box
          sx={{
            mt: 'auto',
            p: 2,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transform: 'scale(1.02) translateY(-1px)',
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 100%)`,
            },
          }}
          onClick={() => onExpandEnrollments(student.id)}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon 
                sx={{ 
                  fontSize: 18, 
                  mr: 1, 
                  color: theme.palette.primary.main 
                }} 
              />
              <Typography 
                variant="body2" 
                fontWeight={500}
                color={theme.palette.primary.main}
              >
                Current Enrollments
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip
                label={enrollmentCount}
                size="small"
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                  minWidth: 32,
                }}
              />
              {isExpanded ? (
                <ExpandLessIcon sx={{ color: theme.palette.primary.main }} />
              ) : (
                <ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Expanded Details Section - Placeholder for future enhancements */}
        <Collapse in={detailsExpanded} timeout={300}>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 2 }}>
                Enhanced student details will be available when additional data integration is complete.
              </Typography>
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default EnhancedStudentCard;