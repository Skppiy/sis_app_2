import * as React from 'react';
import { 
  Box, 
  Button, 
  Stack, 
  Typography, 
  Paper,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  alpha,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useYears, useCreateYear, useUpdateYear, useDeleteYear } from '../hooks/useYears';
import YearFormDialog from '../components/YearFormDialog';
import { AcademicYear } from '../schemas/years';
import { AcademicYearCard } from '@/components/academic-years';

export default function YearsPage() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AcademicYear | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [yearToDelete, setYearToDelete] = React.useState<AcademicYear | null>(null);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const yearsQuery = useYears();
  const createMutation = useCreateYear();
  const updateMutation = useUpdateYear(editing?.id || '');
  const deleteMutation = useDeleteYear();

  const years = yearsQuery.data ?? [];

  // Filter and search logic
  const filteredYears = years.filter(year => {
    // Search filter
    const searchMatch = searchQuery === '' || 
      year.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const statusMatch = statusFilter === '' || 
      (statusFilter === 'active' && year.is_active) ||
      (statusFilter === 'inactive' && !year.is_active);

    return searchMatch && statusMatch;
  });

  // Sort years: active first, then by start date
  const sortedYears = [...filteredYears].sort((a, b) => {
    if (a.is_active !== b.is_active) {
      return a.is_active ? -1 : 1; // Active years first
    }
    return new Date(b.start_date).getTime() - new Date(a.start_date).getTime(); // Most recent first
  });

  // Get statistics
  const activeCount = years.filter(y => y.is_active).length;
  const totalCount = years.length;

  const handleEdit = (year: AcademicYear) => {
    setEditing(year);
    setOpen(true);
  };

  const handleDelete = (year: AcademicYear) => {
    setYearToDelete(year);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!yearToDelete) return;
    try {
      await deleteMutation.mutateAsync(yearToDelete.id);
      setDeleteConfirmOpen(false);
      setYearToDelete(null);
    } catch (error) {
      console.error('Failed to delete academic year:', error);
    }
  };

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
              Academic Years
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage academic calendar periods and enrollment cycles
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { 
              setEditing(null); 
              setOpen(true); 
            }}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 3,
            }}
          >
            Add Academic Year
          </Button>
        </Stack>

        {/* Search and Filter Controls */}
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search academic years..."
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
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                  </InputAdornment>
                }
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Results Summary */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {sortedYears.length} of {totalCount} academic years
            {searchQuery && ` matching "${searchQuery}"`}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip 
              label={`${activeCount} Active`} 
              size="small" 
              color="success" 
              variant="outlined" 
            />
            <Chip 
              label={`${totalCount - activeCount} Inactive`} 
              size="small" 
              color="default" 
              variant="outlined" 
            />
          </Stack>
        </Stack>
      </Paper>

      {/* Academic Years Grid */}
      <Box>
        {yearsQuery.isLoading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                <Paper sx={{ p: 3, height: 320 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                      <Box sx={{ width: 56, height: 56, bgcolor: 'grey.200', borderRadius: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ width: '70%', height: 20, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
                        <Box sx={{ width: '40%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
                      </Box>
                    </Stack>
                    <Box sx={{ width: '100%', height: 8, bgcolor: 'grey.200', borderRadius: 1 }} />
                    <Box sx={{ width: '80%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
                    <Box sx={{ width: '60%', height: 16, bgcolor: 'grey.200', borderRadius: 1 }} />
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Grid container spacing={3}>
              {sortedYears.map(year => (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={year.id}>
                  <AcademicYearCard
                    academicYear={year}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    // Mock stats - these would come from backend queries
                    studentCount={Math.floor(Math.random() * 500) + 100}
                    classroomCount={Math.floor(Math.random() * 50) + 10}
                    enrollmentCount={Math.floor(Math.random() * 800) + 200}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Empty State */}
            {sortedYears.length === 0 && !yearsQuery.isLoading && (
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                }}
              >
                <CalendarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Academic Years Found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery || statusFilter
                    ? 'Try adjusting your search or filter criteria'
                    : 'No academic years have been created yet'
                  }
                </Typography>
                {!searchQuery && !statusFilter && (
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => { 
                      setEditing(null); 
                      setOpen(true); 
                    }}
                  >
                    Create First Academic Year
                  </Button>
                )}
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* Form Dialog */}
      <YearFormDialog
        open={open}
        initial={editing ?? undefined}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={async (values) => {
          if (editing) {
            await updateMutation.mutateAsync(values);
          } else {
            await createMutation.mutateAsync(values);
          }
          setOpen(false);
          setEditing(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete academic year "{yearToDelete?.name}"?
            This action cannot be undone and may affect associated classrooms and enrollments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
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
