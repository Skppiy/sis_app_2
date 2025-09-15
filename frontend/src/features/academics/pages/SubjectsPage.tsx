// src/features/academics/pages/SubjectsPage.tsx
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
  Badge,
} from '@mui/material';
import {
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as RestoreIcon,
  Visibility as ShowArchivedIcon,
  VisibilityOff as HideArchivedIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Science as ScienceIcon,
  Calculate as MathIcon,
  Language as LanguageIcon,
  SportsBasketball as PEIcon,
  LibraryBooks as LibraryIcon,
  School as CoreIcon,
  Palette as EnrichmentIcon,
  Extension as SpecialIcon,
} from '@mui/icons-material';

import { useAuth } from '@/auth/AuthContext';
import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useArchiveSubject,
  useRestoreSubject,
} from '@/features/academics/hooks/useSubjects';
import SubjectFormDialog from '@/features/academics/components/SubjectFormDialog';
import { Subject, SubjectCreate } from '@/schemas/academics';
import { SubjectCard } from '@/components/subjects';

export default function SubjectsPage() {
  const { activeSchool } = useAuth();
  const theme = useTheme();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Tab and search state
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const schoolId = activeSchool?.id;
  
  // Queries
  const { data: subjects = [], isLoading, error } = useSubjects({ 
    school_id: schoolId,
    include_archived: showArchived
  });

  // Mutations
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject(selectedSubject?.id || '');
  const deleteMutation = useDeleteSubject();
  const archiveMutation = useArchiveSubject();
  const restoreMutation = useRestoreSubject();

  // Handle create
  const handleCreate = async (data: SubjectCreate) => {
    try {
      await createMutation.mutateAsync(data);
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create subject:', error);
    }
  };

  // Handle update
  const handleUpdate = async (data: Partial<Subject>) => {
    if (!selectedSubject) return;
    try {
      await updateMutation.mutateAsync(data);
      setEditDialogOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Failed to update subject:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedSubject) return;
    try {
      await deleteMutation.mutateAsync(selectedSubject.id);
      setDeleteConfirmOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Failed to delete subject:', error);
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!selectedSubject) return;
    try {
      await archiveMutation.mutateAsync({ 
        id: selectedSubject.id, 
        reason: "Archived by administrator" 
      });
      setArchiveConfirmOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error('Failed to archive subject:', error);
    }
  };

  // Handle restore
  const handleRestore = async (subject: Subject) => {
    try {
      await restoreMutation.mutateAsync(subject.id);
    } catch (error) {
      console.error('Failed to restore subject:', error);
    }
  };

  // Helper function to get subject icon
  const getSubjectIcon = (subject: Subject) => {
    const name = subject.name.toLowerCase();
    if (name.includes('math')) return <MathIcon />;
    if (name.includes('science') || name.includes('physics') || name.includes('chemistry')) return <ScienceIcon />;
    if (name.includes('english') || name.includes('language') || name.includes('writing')) return <LanguageIcon />;
    if (name.includes('gym') || name.includes('pe') || name.includes('physical')) return <PEIcon />;
    if (name.includes('library') || name.includes('reading')) return <LibraryIcon />;
    if (subject.subject_type === 'CORE') return <CoreIcon />;
    if (subject.subject_type === 'ENRICHMENT') return <EnrichmentIcon />;
    return <SpecialIcon />;
  };

  // Helper function to get grade level display
  const getGradeLevels = (subject: Subject) => {
    const levels = [];
    if (subject.applies_to_elementary) levels.push('Elementary');
    if (subject.applies_to_middle) levels.push('Middle');
    if (subject.applies_to_high) levels.push('High School');
    return levels.join(', ');
  };

  // Filter subjects by search and tab
  const filterSubjectsByTab = (tabIndex: number) => {
    let filteredByType = subjects;
    
    // Filter by tab
    switch (tabIndex) {
      case 0: // Core
        filteredByType = subjects.filter(s => s.subject_type === 'CORE');
        break;
      case 1: // Enrichment
        filteredByType = subjects.filter(s => s.subject_type === 'ENRICHMENT');
        break;
      case 2: // Special Services
        filteredByType = subjects.filter(s => s.subject_type !== 'CORE' && s.subject_type !== 'ENRICHMENT');
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      filteredByType = filteredByType.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filteredByType;
  };

  // Get current tab subjects
  const currentTabSubjects = filterSubjectsByTab(activeTab);
  
  // Group subjects by type for counts
  const coreSubjects = subjects.filter(s => s.subject_type === 'CORE');
  const enrichmentSubjects = subjects.filter(s => s.subject_type === 'ENRICHMENT');
  const specialSubjects = subjects.filter(s => s.subject_type !== 'CORE' && s.subject_type !== 'ENRICHMENT');

  if (error) {
    return (
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }} className="card-hover">
          <Alert severity="error">Failed to load subjects</Alert>
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
              Academic Subjects
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage academic structure: years, subjects, and classrooms. All changes are immediately saved.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={showArchived ? <HideArchivedIcon /> : <ShowArchivedIcon />}
              onClick={() => setShowArchived(!showArchived)}
              sx={{ 
                borderRadius: 2,
                px: 2,
              }}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
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
              Add Subject
            </Button>
          </Stack>
        </Stack>

        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search subjects..."
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
            icon={<CoreIcon />}
            label={`Core (${coreSubjects.length})`} 
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<EnrichmentIcon />}
            label={`Enrichment (${enrichmentSubjects.length})`} 
            sx={{ fontWeight: 600 }}
          />
          <Tab 
            icon={<SpecialIcon />}
            label={`Special Services (${specialSubjects.length})`} 
            sx={{ fontWeight: 600 }}
          />
        </Tabs>
      </Paper>

      {/* Subject Content - Professional List Layout */}
      <Paper sx={{ mb: 3 }}>
        {isLoading ? (
          <Box sx={{ p: 2 }}>
            <Typography>Loading subjects...</Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {currentTabSubjects.map((subject, index) => (
              <ListItem
                key={subject.id}
                sx={{
                  borderBottom: index < currentTabSubjects.length - 1 ? 1 : 0,
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
                      bgcolor: subject.subject_type === 'CORE' 
                        ? theme.palette.primary.main
                        : subject.subject_type === 'ENRICHMENT'
                        ? theme.palette.secondary.main
                        : theme.palette.success.main,
                      width: 48,
                      height: 48,
                    }}
                  >
                    {getSubjectIcon(subject)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {subject.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Code: {subject.code || 'N/A'}
                      </Typography>
                      {subject.requires_specialist && (
                        <Chip 
                          label="Requires Specialist" 
                          size="small" 
                          color="warning"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {subject.is_homeroom_default && (
                        <Chip 
                          label="Homeroom" 
                          size="small" 
                          color="info"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                      {subject.is_archived && (
                        <Chip 
                          label="Archived" 
                          size="small" 
                          color="warning"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Grades:</strong> {getGradeLevels(subject)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Specialist:</strong> {subject.requires_specialist ? 'Required' : 'No'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cross-Grade:</strong> {subject.allows_cross_grade ? 'Yes' : 'No'}
                      </Typography>
                    </Stack>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={1}>
                    {!subject.is_archived ? (
                      <>
                        <Tooltip title="Edit Subject">
                          <IconButton
                            onClick={() => {
                              setSelectedSubject(subject);
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
                        <Tooltip title="Delete Subject">
                          <IconButton
                            onClick={() => {
                              setSelectedSubject(subject);
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
                      </>
                    ) : (
                      <Tooltip title="Restore Subject">
                        <IconButton
                          onClick={() => handleRestore(subject)}
                          size="small"
                          disabled={restoreMutation.isPending}
                          sx={{ 
                            color: theme.palette.success.main,
                            '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) }
                          }}
                        >
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            
            {/* Empty State */}
            {currentTabSubjects.length === 0 && (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No subjects found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchQuery 
                    ? `No subjects match "${searchQuery}"`
                    : 'No subjects in this category yet'
                  }
                </Typography>
              </Box>
            )}
          </List>
        )}
      </Paper>

      {/* Create Dialog */}
      <SubjectFormDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      <SubjectFormDialog
        open={editDialogOpen}
        initial={selectedSubject || undefined}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedSubject(null);
        }}
        onSubmit={handleUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete subject "{selectedSubject?.name}"?
            This may affect existing classrooms that use this subject.
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

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveConfirmOpen} onClose={() => setArchiveConfirmOpen(false)}>
        <DialogTitle>Confirm Archive</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to archive subject "{selectedSubject?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Archived subjects will be hidden from active use but preserved for historical data.
            You can restore archived subjects later if needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleArchive}
            color="warning"
            variant="contained"
            disabled={archiveMutation.isPending}
            startIcon={<ArchiveIcon />}
          >
            {archiveMutation.isPending ? 'Archiving...' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
