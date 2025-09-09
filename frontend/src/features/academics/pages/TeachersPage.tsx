// src/features/academics/pages/TeachersPage.tsx
import React, { useState } from 'react';
import {
  Paper,
  Box,
  Container,
  Button,
  IconButton,
  Typography,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
} from '@mui/material';
import {
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as TeacherIcon,
  School as HomeRoomIcon,
  SportsBasketball as PEIcon,
  LibraryBooks as LibraryIcon,
  Palette as ArtIcon,
  MusicNote as MusicIcon,
  Science as ScienceIcon,
  Room as RoomIcon,
  Groups as StudentsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

import { useAuth } from '@/auth/AuthContext';
import { 
  useTeachers, 
  useCreateTeacher, 
  useUpdateTeacher, 
  useDeleteTeacher 
} from '@/features/academics/hooks/useTeachers';
import TeacherFormDialog from '@/features/academics/components/TeacherFormDialog';
import type { Teacher } from '@/schemas/academics';
import { GRADE_LEVELS, getTeacherRoomDisplay, getTeacherSubjectDisplay } from '@/schemas/academics';

export default function TeachersPage() {
  const { activeSchool } = useAuth();
  const theme = useTheme();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Tab and search state
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const schoolId = activeSchool?.id;

  // Queries
  const { data: teachers = [], isLoading, error } = useTeachers({
    school_id: schoolId
  });

  // Track data loading state for better UX
  const [dataEnrichmentLoading, setDataEnrichmentLoading] = React.useState(false);

  // Monitor when teacher data is being enriched
  React.useEffect(() => {
    if (isLoading) {
      setDataEnrichmentLoading(true);
    } else {
      // Add small delay to show the enrichment process
      const timer = setTimeout(() => {
        setDataEnrichmentLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Mutations
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher(selectedTeacher?.id || '');
  const deleteMutation = useDeleteTeacher();

  // Handle create
  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create teacher:', error);
    }
  };

  // Handle update
  const handleUpdate = async (data: any) => {
    if (!selectedTeacher) return;
    try {
      await updateMutation.mutateAsync(data);
      setEditDialogOpen(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Failed to update teacher:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedTeacher) return;
    try {
      await deleteMutation.mutateAsync(selectedTeacher.id);
      setDeleteConfirmOpen(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Failed to delete teacher:', error);
    }
  };

  // Helper function to get teacher icon
  const getTeacherIcon = (teacher: Teacher) => {
    if (teacher.is_specialist) {
      const subject = teacher.specialist_subject?.toLowerCase() || '';
      if (subject.includes('pe') || subject.includes('gym') || subject.includes('physical'))
        return <PEIcon />;
      if (subject.includes('library') || subject.includes('reading'))
        return <LibraryIcon />;
      if (subject.includes('music'))
        return <MusicIcon />;
      if (subject.includes('art'))
        return <ArtIcon />;
      if (subject.includes('science'))
        return <ScienceIcon />;
      return <TeacherIcon />;
    }
    return <HomeRoomIcon />;
  };

  // Helper function to get grade level label
  const getGradeLabel = (gradeValue?: string) => {
    if (!gradeValue) return 'N/A';
    const grade = GRADE_LEVELS.find(g => g.value === gradeValue);
    return grade ? grade.label : gradeValue;
  };

  // Filter teachers by search and tab
  const filterTeachersByTab = (tabIndex: number) => {
    let filteredByType = teachers;

    // Filter by tab
    switch (tabIndex) {
      case 0: // All Teachers
        break;
      case 1: // Homeroom Teachers
        filteredByType = teachers.filter(t => !t.is_specialist && t.grade_level);
        break;
      case 2: // Specialist Teachers
        filteredByType = teachers.filter(t => t.is_specialist);
        break;
      case 3: // Unassigned
        filteredByType = teachers.filter(t => !t.is_specialist && !t.grade_level);
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filteredByType = filteredByType.filter(teacher => 
        teacher.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.specialist_subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredByType;
  };

  // Get current tab teachers
  const currentTabTeachers = filterTeachersByTab(activeTab);

  // Group teachers by type for counts
  const allTeachers = teachers;
  const homeroomTeachers = teachers.filter(t => !t.is_specialist && t.grade_level);
  const specialistTeachers = teachers.filter(t => t.is_specialist);
  const unassignedTeachers = teachers.filter(t => !t.is_specialist && !t.grade_level);

  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }} className="card-hover">
          <Alert severity="error">Failed to load teachers</Alert>
        </Paper>
      </Container>
    );
  }

  return (
    <Box>
      {/* Header Section */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              Teachers & Staff
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage teacher assignments to grades and rooms. Track homeroom and specialist assignments.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {dataEnrichmentLoading && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                disabled
                size="large"
                sx={{ borderRadius: 2 }}
              >
                Loading Room Data...
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              size="large"
              sx={{
                borderRadius: 2,
                px: 3,
              }}
            >
              Add Teacher
            </Button>
          </Stack>
        </Stack>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<TeacherIcon />} 
            label={`All (${allTeachers.length})`} 
            sx={{ fontWeight: 600 }} 
          />
          <Tab 
            icon={<HomeRoomIcon />} 
            label={`Homeroom (${homeroomTeachers.length})`} 
            sx={{ fontWeight: 600 }} 
          />
          <Tab 
            icon={<PEIcon />} 
            label={`Specialists (${specialistTeachers.length})`} 
            sx={{ fontWeight: 600 }} 
          />
          <Tab 
            icon={<RoomIcon />} 
            label={`Unassigned (${unassignedTeachers.length})`} 
            sx={{ fontWeight: 600 }} 
          />
        </Tabs>
      </Paper>

      {/* Teachers List */}
      <Paper sx={{ mb: 3 }}>
        {(isLoading || dataEnrichmentLoading) ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">
              {isLoading ? 'Loading teachers...' : 'Enriching teacher data with classroom assignments...'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {currentTabTeachers.map((teacher, index) => (
              <ListItem
                key={teacher.id}
                sx={{
                  borderBottom: index < currentTabTeachers.length - 1 ? 1 : 0,
                  borderColor: 'divider',
                  py: 2,
                  px: 3,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: teacher.is_specialist
                        ? theme.palette.secondary.main
                        : theme.palette.primary.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getTeacherIcon(teacher)}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {teacher.first_name} {teacher.last_name}
                      </Typography>
                      {teacher.email && (
                        <Typography variant="body2" color="text.secondary">
                          {teacher.email}
                        </Typography>
                      )}
                      {teacher.is_specialist && (
                        <Chip
                          label={`Specialist: ${getTeacherSubjectDisplay(teacher).replace('Grade ', '')}`}
                          size="small"
                          color="secondary"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {dataEnrichmentLoading && (
                        <Chip
                          label="Loading room data..."
                          size="small"
                          color="info"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {!teacher.is_active && (
                        <Chip
                          label="Inactive"
                          size="small"
                          color="error"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Grade:</strong> {getGradeLabel(teacher.grade_level)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Room:</strong> {getTeacherRoomDisplay(teacher)}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <StudentsIcon sx={{ fontSize: 16 }} />
                        <Typography variant="body2" color="text.secondary">
                          <strong>{dataEnrichmentLoading ? '...' : (teacher.student_count || 0)}</strong> students
                        </Typography>
                      </Stack>
                    </Stack>
                  }
                />

                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Teacher">
                      <IconButton
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setEditDialogOpen(true);
                        }}
                        size="small"
                        sx={{
                          color: theme.palette.primary.main,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Teacher">
                      <IconButton
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setDeleteConfirmOpen(true);
                        }}
                        size="small"
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}

            {currentTabTeachers.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No teachers found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery
                    ? `No teachers match "${searchQuery}"`
                    : 'No teachers in this category yet'
                  }
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Paper>

      {/* Dialogs */}
      <TeacherFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      <TeacherFormDialog
        open={editDialogOpen}
        initial={selectedTeacher || undefined}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedTeacher(null);
        }}
        onSubmit={handleUpdate}
      />

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete teacher "{selectedTeacher?.first_name} {selectedTeacher?.last_name}"? 
            This may affect existing student assignments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}