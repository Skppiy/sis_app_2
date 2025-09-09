import React from 'react';
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
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Student, GRADE_LEVELS } from '@/schemas/students';

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onEnroll: (student: Student) => void;
  onExpandEnrollments: (studentId: string) => void;
  isExpanded: boolean;
  enrollmentCount?: number;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onEdit,
  onDelete,
  onEnroll,
  onExpandEnrollments,
  isExpanded,
  enrollmentCount = 0,
}) => {
  const theme = useTheme();
  
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

  return (
    <Card
      sx={{
        position: 'relative',
        backgroundColor: '#ffffff',
        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          borderColor: theme.palette.primary.main,
          '& .action-buttons': {
            opacity: 1,
            transform: 'translateX(0)',
          },
          '& .student-avatar': {
            transform: 'scale(1.1)',
            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        },
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {/* Header with Avatar and Basic Info */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            className="student-avatar"
            sx={{
              width: 56,
              height: 56,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              fontSize: '1.2rem',
              fontWeight: 600,
              mr: 2,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {getInitials(student.first_name, student.last_name)}
          </Avatar>
          
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
            
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip
                label={getGradeLabel(student.current_grade_level)}
                size="small"
                sx={{
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={student.is_active ? 'Active' : 'Inactive'}
                size="small"
                color={student.is_active ? 'success' : 'default'}
                variant={student.is_active ? 'filled' : 'outlined'}
              />
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

        {/* Contact and Details */}
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
                sx={{ fontSize: '0.85rem' }}
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
        </Stack>

        {/* Enrollment Status Footer */}
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              transform: 'scale(1.01)',
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
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StudentCard;