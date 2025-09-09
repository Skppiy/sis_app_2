import * as React from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  Stack, 
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  LinearProgress,
  Divider,
  Button,
  alpha,
  useTheme,
  Grid
} from '@mui/material';
import {
  Person as TeacherIcon,
  Group as StudentsIcon,
  School as HomeRoomIcon,
  SportsBasketball as SpecialistIcon,
  Warning as AlertIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  TrendingUp as StatsIcon,
  Assignment as AssignmentIcon,
  School
} from '@mui/icons-material';
import { Link } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';
import { useTeachers } from '@/features/academics/hooks/useTeachers';
import { useStudents } from '@/features/enrollment/hooks/useStudents';
import { getStudentEnrollments } from '@/features/enrollment/services/students';
import { listClassrooms } from '@/features/academics/services/classrooms';
import type { Teacher } from '@/schemas/academics';
import type { Student, Enrollment } from '@/schemas/students';

export default function Dashboard() {
  const { activeSchool } = useAuth();
  const theme = useTheme();

  // Fetch teachers and students data
  const { data: teachers = [], isLoading: teachersLoading } = useTeachers({
    school_id: activeSchool?.id,
    is_active: true
  });

  const { data: students = [], isLoading: studentsLoading } = useStudents({
    school_id: activeSchool?.id,
    is_active: true
  });

  // State for enrollment calculations
  const [enrollmentStats, setEnrollmentStats] = React.useState({
    totalEnrolled: 0,
    assignedStudents: 0,
    unassignedStudents: 0,
    calculationComplete: false
  });

  // Calculate real enrollment statistics
  React.useEffect(() => {
    const calculateEnrollmentStats = async () => {
      if (!activeSchool?.id || students.length === 0) {
        setEnrollmentStats({
          totalEnrolled: 0,
          assignedStudents: 0,
          unassignedStudents: 0,
          calculationComplete: true
        });
        return;
      }

      try {
        // Get all classrooms to understand current assignments
        const classrooms = await listClassrooms();
        const totalEnrollments = classrooms.reduce((sum, classroom) => {
          return sum + (classroom.enrollment_count || 0);
        }, 0);

        // For more accurate calculations, we could fetch individual student enrollments
        // but for performance, we'll use the classroom enrollment counts
        const assignedCount = totalEnrollments;
        const totalStudents = students.length;
        const unassignedCount = Math.max(0, totalStudents - assignedCount);

        setEnrollmentStats({
          totalEnrolled: totalStudents,
          assignedStudents: assignedCount,
          unassignedStudents: unassignedCount,
          calculationComplete: true
        });
      } catch (error) {
        console.warn('[Dashboard] Failed to calculate enrollment stats:', error);
        // Fallback to simple is_active calculation with better logic
        const activeStudents = students.filter(s => s.is_active).length;
        const totalStudents = students.length;
        
        setEnrollmentStats({
          totalEnrolled: totalStudents,
          assignedStudents: activeStudents, // Better than before but still approximate
          unassignedStudents: totalStudents - activeStudents,
          calculationComplete: true
        });
      }
    };

    calculateEnrollmentStats();
  }, [students, activeSchool?.id]);

  // Calculate statistics
  const totalTeachers = teachers.length;
  const homeroomTeachers = teachers.filter(t => !t.is_specialist && t.grade_level);
  const specialistTeachers = teachers.filter(t => t.is_specialist);
  const unassignedTeachers = teachers.filter(t => !t.is_specialist && !t.grade_level);
  
  // Use calculated enrollment statistics
  const totalStudents = enrollmentStats.totalEnrolled;
  const assignedStudents = enrollmentStats.assignedStudents;
  const unassignedStudents = enrollmentStats.unassignedStudents;

  const assignmentCompletionRate = totalStudents > 0 ? Math.round((assignedStudents / totalStudents) * 100) : 0;

  // Get teachers sorted by student count for highlights
  const teachersByLoad = [...teachers]
    .filter(t => t.student_count > 0)
    .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
    .slice(0, 5);

  const StatCard = ({ title, value, subtitle, icon, color, action }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    action?: { label: string; to: string };
  }) => (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.12)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${alpha(color, 0.15)}`,
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Stack spacing={1} sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 600, color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {action && (
              <Button 
                component={Link} 
                to={action.to} 
                size="small" 
                sx={{ mt: 1, alignSelf: 'flex-start' }}
              >
                {action.label}
              </Button>
            )}
          </Stack>
          <Avatar sx={{ bgcolor: alpha(color, 0.1), color }}>
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ py: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          School Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of teacher assignments and student enrollment status
        </Typography>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Total Teachers"
            value={totalTeachers}
            subtitle={`${homeroomTeachers.length} homeroom, ${specialistTeachers.length} specialists`}
            icon={<TeacherIcon />}
            color={theme.palette.primary.main}
            action={{ label: "Manage Teachers", to: "/app/teachers" }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Total Students"
            value={totalStudents}
            subtitle={`${assignedStudents} assigned, ${unassignedStudents} pending`}
            icon={<StudentsIcon />}
            color={theme.palette.info.main}
            action={{ label: "View Students", to: "/app/students" }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Assignment Rate"
            value={`${assignmentCompletionRate}%`}
            subtitle="Students assigned to teachers"
            icon={<AssignmentIcon />}
            color={assignmentCompletionRate > 80 ? theme.palette.success.main : theme.palette.warning.main}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Unassigned Teachers"
            value={unassignedTeachers.length}
            subtitle="Awaiting grade/room assignment"
            icon={<AlertIcon />}
            color={unassignedTeachers.length > 0 ? theme.palette.error.main : theme.palette.success.main}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Teacher Load Overview */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Teacher Assignments
              </Typography>
              <Button component={Link} to="/app/teachers" size="small">
                View All Teachers
              </Button>
            </Stack>

            {(teachersLoading || !enrollmentStats.calculationComplete) ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography color="text.secondary">
                  {teachersLoading ? 'Loading teachers...' : 'Calculating enrollment statistics...'}
                </Typography>
              </Box>
            ) : teachersByLoad.length > 0 ? (
              <List sx={{ p: 0 }}>
                {teachersByLoad.map((teacher, index) => (
                  <React.Fragment key={teacher.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: teacher.is_specialist 
                              ? theme.palette.secondary.main 
                              : theme.palette.primary.main 
                          }}
                        >
                          {teacher.is_specialist ? <SpecialistIcon /> : <HomeRoomIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                              {teacher.first_name} {teacher.last_name}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={`${teacher.student_count || 0} students`}
                              color={teacher.student_count > 25 ? "warning" : "success"}
                            />
                          </Stack>
                        }
                        secondary={
                          teacher.is_specialist 
                            ? `${teacher.specialist_subject || 'Specialist'} • ${teacher.specialist_room_name || 'No room assigned'}`
                            : `Grade ${teacher.grade_level || 'TBD'} • ${teacher.homeroom_name || 'No room assigned'}`
                        }
                      />
                    </ListItem>
                    {index < teachersByLoad.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No teacher assignments found. Add teachers and assign them to grades/rooms to see data here.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Alerts and Quick Actions */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            {/* Assignment Completion Progress */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Assignment Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Student Assignment Completion
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {assignedStudents} of {totalStudents}
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={assignmentCompletionRate} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                {enrollmentStats.calculationComplete 
                  ? `${assignmentCompletionRate}% of students have classroom assignments`
                  : 'Calculating assignment rates...'
                }
              </Typography>
            </Paper>

            {/* Alerts */}
            {(unassignedTeachers.length > 0 || unassignedStudents > 0) && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Action Required
                </Typography>
                <Stack spacing={2}>
                  {unassignedTeachers.length > 0 && (
                    <Alert severity="warning" action={
                      <Button component={Link} to="/app/teachers" size="small">
                        Assign
                      </Button>
                    }>
                      <Typography variant="body2">
                        {unassignedTeachers.length} teacher{unassignedTeachers.length !== 1 ? 's' : ''} need grade/room assignments
                      </Typography>
                    </Alert>
                  )}
                  
                  {unassignedStudents > 0 && (
                    <Alert severity="info" action={
                      <Button component={Link} to="/app/students" size="small">
                        View
                      </Button>
                    }>
                      <Typography variant="body2">
                        {unassignedStudents} student{unassignedStudents !== 1 ? 's' : ''} awaiting teacher assignment
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Paper>
            )}

            {/* Quick Actions */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={1}>
                <Button 
                  component={Link} 
                  to="/app/teachers" 
                  startIcon={<TeacherIcon />}
                  fullWidth
                  variant="outlined"
                >
                  Add New Teacher
                </Button>
                <Button 
                  component={Link} 
                  to="/app/students" 
                  startIcon={<StudentsIcon />}
                  fullWidth
                  variant="outlined"
                >
                  Manage Student Enrollments
                </Button>
                <Button 
                  component={Link} 
                  to="/app/classrooms" 
                  startIcon={<School />}
                  fullWidth
                  variant="outlined"
                >
                  Setup Classrooms
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
