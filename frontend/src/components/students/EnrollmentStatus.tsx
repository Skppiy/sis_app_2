import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import {
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ClassOutlined as ClassIcon,
  PersonOutline as StudentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Enrollment } from '@/schemas/students';

interface EnrollmentStatusProps {
  studentId: string;
  enrollments?: Enrollment[];
  enrollmentCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onWithdrawEnrollment?: (enrollmentId: string) => void;
  isLoading?: boolean;
  academicYearName?: string;
  studentGrade?: string;
}

export const EnrollmentStatus: React.FC<EnrollmentStatusProps> = ({
  studentId,
  enrollments = [],
  enrollmentCount,
  isExpanded,
  onToggleExpand,
  onWithdrawEnrollment,
  isLoading = false,
  academicYearName,
  studentGrade,
}) => {
  const theme = useTheme();

  // Format date display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  // Get status color based on enrollment status
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return theme.palette.success.main;
      case 'PENDING':
        return theme.palette.warning.main;
      case 'WITHDRAWN':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  return (
    <Box>
      {/* Enrollment Count Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.primary.light, 0.16)} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
          },
        }}
        onClick={onToggleExpand}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <Badge
              badgeContent={enrollmentCount}
              color="primary"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  height: 20,
                  minWidth: 20,
                },
              }}
            >
              <SchoolIcon
                sx={{
                  fontSize: 24,
                  color: theme.palette.primary.main,
                  mr: 2,
                }}
              />
            </Badge>
            
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={600}
                color={theme.palette.primary.main}
                sx={{ mb: 0.5 }}
              >
                Current Enrollments
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {studentGrade && (
                  <Chip
                    label={`Grade ${studentGrade}`}
                    size="small"
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      fontWeight: 500,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
                {academicYearName && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.8rem' }}
                  >
                    • {academicYearName}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Box>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Chip
              label={enrollmentCount}
              size="small"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600,
                minWidth: 36,
                fontSize: '0.75rem',
              }}
            />
            {isExpanded ? (
              <ExpandLessIcon sx={{ color: theme.palette.primary.main }} />
            ) : (
              <ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Expanded Enrollment Details */}
      <Collapse in={isExpanded} timeout={300}>
        <Paper
          sx={{
            mt: 1,
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Loading enrollments...
              </Typography>
            </Box>
          ) : enrollments.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <StudentIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.text.disabled,
                  mb: 1,
                }}
              />
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 0.5 }}
              >
                No Active Enrollments
              </Typography>
              <Typography variant="body2" color="text.disabled">
                This student is not currently enrolled in any classes
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {enrollments.map((enrollment, index) => (
                <React.Fragment key={enrollment.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.5),
                      },
                    }}
                  >
                    <ListItemIcon>
                      <ClassIcon
                        sx={{
                          color: getStatusColor(enrollment.enrollment_status),
                        }}
                      />
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="subtitle2" fontWeight={500}>
                            Classroom {enrollment.classroom_id}
                          </Typography>
                          <Chip
                            label={enrollment.enrollment_status}
                            size="small"
                            sx={{
                              bgcolor: alpha(getStatusColor(enrollment.enrollment_status), 0.1),
                              color: getStatusColor(enrollment.enrollment_status),
                              fontWeight: 500,
                              fontSize: '0.7rem',
                            }}
                          />
                          {enrollment.grade_level && (
                            <Chip
                              label={`Grade ${enrollment.grade_level}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Stack direction="column" spacing={0.5} sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Enrolled: {formatDate(enrollment.enrollment_date)}
                          </Typography>
                          {enrollment.withdrawal_date && (
                            <Typography variant="body2" color="error.main">
                              Withdrawn: {formatDate(enrollment.withdrawal_date)}
                            </Typography>
                          )}
                          {enrollment.withdrawal_reason && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: '0.75rem' }}
                            >
                              Reason: {enrollment.withdrawal_reason}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                    
                    {onWithdrawEnrollment && 
                     enrollment.enrollment_status === 'ACTIVE' && (
                      <ListItemSecondaryAction>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => onWithdrawEnrollment(enrollment.id)}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Withdraw
                        </Button>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                  {index < enrollments.length - 1 && (
                    <Box
                      sx={{
                        height: 1,
                        bgcolor: alpha(theme.palette.divider, 0.12),
                        mx: 2,
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

export default EnrollmentStatus;