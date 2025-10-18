import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Paper,
  Grid,
  CircularProgress
} from '@mui/material';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  ArrowBack,
  School,
  Room,
  People,
  Email,
  Groups,
  Class,
  LocationOn
} from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useAuth } from '@/auth/AuthContext';
import { useTeachers } from '@/features/academics/hooks/useTeachers';
import { getTeacherRoomDisplay, getTeacherSubjectDisplay } from '@/schemas/academics';

export default function TeacherDetailPage() {
  const { teacherId } = useParams({ from: '/app/teachers/$teacherId' });
  const navigate = useNavigate();
  const { activeSchool } = useAuth();

  const { data: teachers = [], isLoading } = useTeachers({
    schoolId: activeSchool?.id,
    includeInactive: false
  });

  const teacher = teachers.find(t => t.id === teacherId);

  // Debug: Log teacher data to console
  if (teacher) {
    console.log('Teacher data:', {
      name: `${teacher.first_name} ${teacher.last_name}`,
      is_specialist: teacher.is_specialist,
      specialist_subject: teacher.specialist_subject,
      grade_level: teacher.grade_level,
      homeroom_name: teacher.homeroom_name,
      specialist_room_name: teacher.specialist_room_name
    });
  }

  const handleBack = () => {
    navigate({ to: '/app/teachers' });
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!teacher) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <IconButton onClick={handleBack} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Teacher Not Found
          </Typography>
        </Stack>
        <Alert severity="error">
          Teacher with ID {teacherId} not found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={handleBack} size="small">
          <ArrowBack />
        </IconButton>
        <Avatar
          sx={{
            bgcolor: teacher.is_specialist ? 'secondary.main' : 'primary.main',
            width: 56,
            height: 56
          }}
        >
          {teacher.first_name[0]}{teacher.last_name[0]}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">
            {teacher.first_name} {teacher.last_name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {teacher.is_specialist && (
              <Chip
                label="Subject Teacher"
                color="secondary"
                size="small"
              />
            )}
            <Chip
              label={`${teacher.class_count || teacher.student_count || 0} Classes`}
              color="primary"
              size="small"
            />
          </Stack>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Teacher Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={teacher.email || 'Not provided'}
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Assignment Details
              </Typography>
              <List dense>
                {teacher.is_specialist ? (
                  teacher.specialist_subject && (
                    <ListItem>
                      <ListItemIcon>
                        <Class />
                      </ListItemIcon>
                      <ListItemText
                        primary="Subject Area"
                        secondary={teacher.specialist_subject}
                      />
                    </ListItem>
                  )
                ) : (
                  teacher.grade_level && (
                    <ListItem>
                      <ListItemIcon>
                        <School />
                      </ListItemIcon>
                      <ListItemText
                        primary="Grade Level"
                        secondary={`Grade ${teacher.grade_level}`}
                      />
                    </ListItem>
                  )
                )}

                {(teacher.homeroom_name || teacher.specialist_room_name) && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Room Assignment"
                      secondary={getTeacherRoomDisplay(teacher)}
                    />
                  </ListItem>
                )}

                <ListItem>
                  <ListItemIcon>
                    <Groups />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Classes"
                    secondary={`${teacher.class_count || teacher.student_count || 0} classes assigned`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Class Assignments */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Class Assignments
              </Typography>

              {teacher.is_specialist ? (
                <Paper sx={{ p: 2, bgcolor: 'secondary.50' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Class color="secondary" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Subject Teacher: {teacher.specialist_subject || 'Multiple Subjects'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Teaches subject classes across multiple grades
                      </Typography>
                      {teacher.specialist_room_name && (
                        <Typography variant="body2" color="text.secondary">
                          Primary Room: {teacher.specialist_room_name}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ) : (!teacher.is_specialist && teacher.grade_level) ? (
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <School color="primary" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Homeroom Teacher - Grade {teacher.grade_level}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Primary classroom teacher with core subject responsibilities
                      </Typography>
                      {teacher.homeroom_name && (
                        <Typography variant="body2" color="text.secondary">
                          Homeroom: {teacher.homeroom_name}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Paper>
              ) : (
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <People color="action" />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Teacher Assignment
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        General teaching assignment - specific details to be configured
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Coming Soon:</strong> Detailed class-by-class student listings,
                  individual enrollment counts, and schedule information will be available
                  in the next update.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}