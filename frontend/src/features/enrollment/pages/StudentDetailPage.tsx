import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Divider,
  Stack,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getStudent, getStudentEnrollments } from '@/features/enrollment/services/students';
import { EnrollmentStatus } from '@/components/students/EnrollmentStatus';
import { useStudentServiceAssignments } from '@/features/academics/hooks/useStudentServices';
import { format } from 'date-fns';

const StudentDetailPage: React.FC = () => {
  const { studentId } = useParams({ from: '/app/students/$studentId' });
  const navigate = useNavigate();
  const theme = useTheme();

  // Fetch student data
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId,
  });

  // Fetch student enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['student-enrollments', studentId],
    queryFn: () => getStudentEnrollments(studentId),
    enabled: !!studentId,
  });

  // Fetch student service assignments
  const { assignments: serviceAssignments, isLoading: servicesLoading } = useStudentServiceAssignments(studentId);


  const handleBack = () => {
    navigate({ to: '/app/students' });
  };

  if (studentLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading student details...</Typography>
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Student not found</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Students
        </Button>
      </Box>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <IconButton
            onClick={handleBack}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" color="primary" fontWeight={600}>
            Student Details
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            startIcon={<EditIcon />}
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Edit Student
          </Button>
        </Stack>

        <Stack direction="row" spacing={3} alignItems="center">
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: theme.palette.primary.main,
              fontSize: '2rem',
              fontWeight: 'bold',
            }}
          >
            {getInitials(student.first_name, student.last_name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>
              {student.first_name} {student.last_name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label={`Grade ${student.current_grade_level}`}
                color="primary"
                size="small"
                sx={{ fontWeight: 500 }}
              />
              <Chip
                label={student.is_active ? 'Active' : 'Inactive'}
                color={student.is_active ? 'success' : 'error'}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Student ID: {student.student_id || 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* Personal Information */}
          <Card sx={{ flex: { xs: 1, md: '0 0 350px' } }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Personal Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Full Name
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {student.first_name} {student.last_name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date of Birth
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {formatDate(student.date_of_birth)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                    <Typography variant="body1" fontWeight={500}>
                      {student.email || 'N/A'}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Current Grade Level
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    Grade {student.current_grade_level}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={student.is_active ? 'Active' : 'Inactive'}
                    color={student.is_active ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Enrollment Information */}
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Current Enrollments
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {enrollmentsLoading ? (
                <Typography>Loading enrollments...</Typography>
              ) : (
                <EnrollmentStatus
                  studentId={studentId}
                  enrollments={enrollments || []}
                  enrollmentCount={enrollments?.length || 0}
                  isExpanded={true}
                  onToggleExpand={() => {}} // Always expanded in detail view
                  isLoading={enrollmentsLoading}
                  academicYearName="2024-2025" // This could be dynamic
                  studentGrade={student.current_grade_level}
                />
              )}
            </CardContent>
          </Card>
        </Stack>

        {/* Student Services */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              Student Services
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {servicesLoading ? (
              <Typography>Loading services...</Typography>
            ) : serviceAssignments && serviceAssignments.length > 0 ? (
              <Stack spacing={2}>
                {serviceAssignments.filter(assignment => assignment.is_active).map((assignment) => (
                  <Paper
                    key={assignment.id}
                    sx={{
                      p: 2,
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {assignment.tag?.tag_name || 'Unknown Service'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Started: {formatDate(assignment.start_date)}
                      {assignment.end_date && ` • Ends: ${formatDate(assignment.end_date)}`}
                    </Typography>
                    {assignment.severity_level && (
                      <Chip
                        label={assignment.severity_level}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                    {assignment.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Notes: {assignment.notes}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                No active student services assigned.
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              Additional Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Entry Date
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {formatDate(student.entry_date)}
                </Typography>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Entry Grade Level
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  Grade {student.entry_grade_level}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Special Notes
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                No special notes recorded.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default StudentDetailPage;