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
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as ActiveIcon,
  RadioButtonUnchecked as InactiveIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Groups as StudentsIcon,
  Class as ClassroomsIcon,
  StarBorder as StarIcon,
} from '@mui/icons-material';
import { format, differenceInDays, parseISO, isWithinInterval } from 'date-fns';
import { AcademicYear } from '@/features/academics/schemas/years';

interface AcademicYearCardProps {
  academicYear: AcademicYear;
  onEdit: (year: AcademicYear) => void;
  onDelete: (year: AcademicYear) => void;
  // Optional stats that could come from backend
  studentCount?: number;
  classroomCount?: number;
  enrollmentCount?: number;
}

export const AcademicYearCard: React.FC<AcademicYearCardProps> = ({
  academicYear,
  onEdit,
  onDelete,
  studentCount = 0,
  classroomCount = 0,
  enrollmentCount = 0,
}) => {
  const theme = useTheme();

  // Calculate academic year progress
  const startDate = parseISO(academicYear.start_date);
  const endDate = parseISO(academicYear.end_date);
  const currentDate = new Date();
  
  const totalDays = differenceInDays(endDate, startDate);
  const daysPassed = Math.max(0, differenceInDays(currentDate, startDate));
  const progressPercentage = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
  
  const isCurrentlyActive = isWithinInterval(currentDate, { start: startDate, end: endDate });
  const hasEnded = currentDate > endDate;
  const hasStarted = currentDate >= startDate;

  // Determine status
  const getStatus = () => {
    if (academicYear.is_active) return 'active';
    if (hasEnded) return 'completed';
    if (!hasStarted) return 'upcoming';
    return 'inactive';
  };

  const status = getStatus();

  // Status configuration
  const statusConfig = {
    active: {
      color: theme.palette.success.main,
      bgColor: alpha(theme.palette.success.main, 0.1),
      label: 'Active',
      icon: ActiveIcon,
    },
    completed: {
      color: theme.palette.info.main,
      bgColor: alpha(theme.palette.info.main, 0.1),
      label: 'Completed',
      icon: ActiveIcon,
    },
    upcoming: {
      color: theme.palette.warning.main,
      bgColor: alpha(theme.palette.warning.main, 0.1),
      label: 'Upcoming',
      icon: CalendarIcon,
    },
    inactive: {
      color: theme.palette.text.secondary,
      bgColor: alpha(theme.palette.text.secondary, 0.1),
      label: 'Inactive',
      icon: InactiveIcon,
    },
  };

  const currentStatus = statusConfig[status];

  return (
    <Card
      sx={{
        position: 'relative',
        height: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        border: academicYear.is_active 
          ? `2px solid ${alpha(theme.palette.primary.main, 0.4)}`
          : `2px solid ${alpha(theme.palette.grey[400], 0.3)}`,
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          borderColor: academicYear.is_active ? theme.palette.primary.main : theme.palette.grey[500],
          '& .action-buttons': {
            opacity: 1,
            transform: 'translateX(0)',
          },
          '& .year-icon': {
            transform: 'scale(1.1) rotate(5deg)',
            boxShadow: `0 8px 24px ${alpha(currentStatus.color, 0.4)}`,
          },
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: academicYear.is_active
            ? `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
            : `linear-gradient(90deg, ${theme.palette.grey[400]}, ${theme.palette.grey[300]})`,
        },
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Icon and Status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Box
            className="year-icon"
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${currentStatus.color}, ${alpha(currentStatus.color, 0.8)})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `0 4px 16px ${alpha(currentStatus.color, 0.3)}`,
            }}
          >
            <SchoolIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Chip
                icon={React.createElement(currentStatus.icon, { sx: { fontSize: '16px !important' } })}
                label={currentStatus.label}
                size="small"
                sx={{
                  bgcolor: currentStatus.color,
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: 'white',
                  },
                }}
              />
              {academicYear.is_active && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                  label="Current"
                  size="small"
                  color="primary"
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
            <Tooltip title="Edit Academic Year" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(academicYear);
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
            
            <Tooltip title="Delete Academic Year" placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(academicYear);
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

        {/* Academic Year Details */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              fontSize: '1.3rem',
              lineHeight: 1.2,
            }}
          >
            {academicYear.name}
          </Typography>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.text.secondary }} />
              <Typography variant="body2" color="text.secondary">
                {format(startDate, 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              →
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ fontSize: 16, mr: 1, color: theme.palette.text.secondary }} />
              <Typography variant="body2" color="text.secondary">
                {format(endDate, 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Stack>

          {/* Progress Bar (only for current/active years) */}
          {isCurrentlyActive && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  Academic Year Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round(progressPercentage)}% Complete
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {/* Statistics Footer */}
        <Box
          sx={{
            mt: 'auto',
            p: 2,
            borderRadius: 2,
            bgcolor: alpha(currentStatus.color, 0.08),
            border: `1px solid ${alpha(currentStatus.color, 0.15)}`,
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StudentsIcon 
                  sx={{ 
                    fontSize: 16, 
                    mr: 1, 
                    color: currentStatus.color 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '0.85rem' }}
                >
                  Students
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                fontWeight={600}
                color={currentStatus.color}
              >
                {studentCount.toLocaleString()}
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ClassroomsIcon 
                  sx={{ 
                    fontSize: 16, 
                    mr: 1, 
                    color: currentStatus.color 
                  }} 
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: '0.85rem' }}
                >
                  Classrooms
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                fontWeight={600}
                color={currentStatus.color}
              >
                {classroomCount.toLocaleString()}
              </Typography>
            </Stack>

            {enrollmentCount > 0 && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon 
                    sx={{ 
                      fontSize: 16, 
                      mr: 1, 
                      color: currentStatus.color 
                    }} 
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: '0.85rem' }}
                  >
                    Enrollments
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  fontWeight={600}
                  color={currentStatus.color}
                >
                  {enrollmentCount.toLocaleString()}
                </Typography>
              </Stack>
            )}

            {/* Duration */}
            <Box sx={{ pt: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
              <Stack direction="row" justifyContent="center" alignItems="center">
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ fontWeight: 500, textAlign: 'center' }}
                >
                  {totalDays} days • {Math.round(totalDays / 30)} months
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AcademicYearCard;