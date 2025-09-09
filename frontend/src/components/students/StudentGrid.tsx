import React, { useState, useMemo } from 'react';
import {
  Box,
  Grid,
  TextField,
  InputAdornment,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Pagination,
  Skeleton,
  Checkbox,
  Button,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  SelectAll as SelectAllIcon,
  ClearAll as ClearAllIcon,
} from '@mui/icons-material';
import { StudentCard } from './StudentCard';
import { EnhancedStudentCard } from './EnhancedStudentCard';
import { EnrollmentStatus } from './EnrollmentStatus';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { Student, Enrollment, GRADE_LEVELS } from '@/schemas/students';
import { useStudentEnrollments } from '@/features/enrollment/hooks/useStudents';

interface StudentGridProps {
  students: Student[];
  loading?: boolean;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onEnroll: (student: Student) => void;
  onWithdrawEnrollment?: (studentId: string, enrollmentId: string) => void;
  academicYearName?: string;
  academicYearId?: string;
  itemsPerPage?: number;
  // Enhanced features
  useEnhancedCards?: boolean;
  showBulkOperations?: boolean;
  availableClassrooms?: Array<{ id: string; name: string; subject?: { name: string } }>;
  // Bulk operations
  onBulkEnroll?: (studentIds: string[], classroomId: string) => void;
  onBulkActivate?: (studentIds: string[]) => void;
  onBulkInactivate?: (studentIds: string[]) => void;
  onBulkDelete?: (studentIds: string[]) => void;
  onBulkExport?: (studentIds: string[], format: 'csv' | 'pdf') => void;
  onBulkEmail?: (studentIds: string[]) => void;
  onBulkSms?: (studentIds: string[]) => void;
  onBulkReport?: (studentIds: string[], reportType: string) => void;
}

type SortField = 'name' | 'grade' | 'email' | 'status' | 'enrollments';
type SortOrder = 'asc' | 'desc';

// Individual card wrapper that handles enrollment data fetching
interface StudentCardWrapperProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onEnroll: (student: Student) => void;
  onWithdrawEnrollment?: (studentId: string, enrollmentId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (studentId: string) => void;
  academicYearName?: string;
  academicYearId?: string;
}

const StudentCardWrapper: React.FC<StudentCardWrapperProps> = ({
  student,
  onEdit,
  onDelete,
  onEnroll,
  onWithdrawEnrollment,
  isExpanded,
  onToggleExpand,
  academicYearName,
  academicYearId,
}) => {
  // Fetch enrollments for this specific student
  const { data: enrollments = [], isLoading } = useStudentEnrollments(student.id, {
    active_only: true,
    academic_year_id: academicYearId,
  });

  return (
    <Box>
      <StudentCard
        student={student}
        onEdit={onEdit}
        onDelete={onDelete}
        onEnroll={onEnroll}
        onExpandEnrollments={onToggleExpand}
        isExpanded={isExpanded}
        enrollmentCount={enrollments.length}
      />
      
      {/* Expanded Enrollment Details */}
      {isExpanded && (
        <Box sx={{ mt: 2 }}>
          <EnrollmentStatus
            studentId={student.id}
            enrollments={enrollments}
            enrollmentCount={enrollments.length}
            isExpanded={true}
            onToggleExpand={() => {}}
            onWithdrawEnrollment={onWithdrawEnrollment ? (enrollmentId) => onWithdrawEnrollment(student.id, enrollmentId) : undefined}
            isLoading={isLoading}
            academicYearName={academicYearName}
            studentGrade={student.current_grade_level}
          />
        </Box>
      )}
    </Box>
  );
};

export const StudentGrid: React.FC<StudentGridProps> = ({
  students,
  loading = false,
  onEdit,
  onDelete,
  onEnroll,
  onWithdrawEnrollment,
  academicYearName,
  academicYearId,
  itemsPerPage = 12,
  useEnhancedCards = false,
  showBulkOperations = false,
  availableClassrooms = [],
  onBulkEnroll,
  onBulkActivate,
  onBulkInactivate,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  onBulkSms,
  onBulkReport,
}) => {
  const theme = useTheme();
  
  // State for search, filter, sort, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  // Bulk operations state
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Filter and sort students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = students.filter(student => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchQuery.toLowerCase());

      // Grade filter
      const gradeMatch = gradeFilter === '' || student.current_grade_level === gradeFilter;

      // Status filter
      const statusMatch = statusFilter === '' || 
        (statusFilter === 'active' && student.is_active) ||
        (statusFilter === 'inactive' && !student.is_active);

      return searchMatch && gradeMatch && statusMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
        case 'grade':
          comparison = a.current_grade_level.localeCompare(b.current_grade_level);
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'status':
          comparison = Number(b.is_active) - Number(a.is_active);
          break;
        case 'enrollments':
          // This would need enrollment counts, for now sort by name
          comparison = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [students, searchQuery, gradeFilter, statusFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const paginatedStudents = filteredAndSortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle expand/collapse
  const handleToggleExpand = (studentId: string) => {
    setExpandedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Bulk selection handlers
  const handleSelectStudent = (studentId: string, selected: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(studentId);
      } else {
        newSet.delete(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allCurrentIds = paginatedStudents.map(s => s.id);
    const newSet = new Set([...selectedStudents, ...allCurrentIds]);
    setSelectedStudents(newSet);
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredAndSortedStudents.map(s => s.id);
    setSelectedStudents(new Set(allFilteredIds));
  };

  const handleClearSelection = () => {
    setSelectedStudents(new Set());
    setSelectMode(false);
  };

  const handleToggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      handleClearSelection();
    }
  };

  // Get selected student objects
  const selectedStudentObjects = students.filter(s => selectedStudents.has(s.id));

  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Render loading skeleton
  const renderLoadingSkeletons = () => (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
      gap: 3 
    }}>
      {Array.from({ length: itemsPerPage }).map((_, index) => (
        <Paper key={index} sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2}>
              <Skeleton variant="circular" width={56} height={56} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={24} />
                <Skeleton variant="text" width="40%" height={20} />
              </Box>
            </Stack>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="rectangular" height={40} />
          </Stack>
        </Paper>
      ))}
    </Box>
  );

  return (
    <Box>
      {/* Search and Filter Controls */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
          },
        }}
      >
        <Grid container spacing={3} alignItems="center">
          {/* Search */}
          <Grid size={{ xs: 12, md: showBulkOperations ? 3 : 4 }}>
            <TextField
              fullWidth
              placeholder="Search students..."
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
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    transform: 'scale(1.02)',
                  },
                  '&.Mui-focused': {
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    transform: 'scale(1.02)',
                  },
                },
              }}
            />
          </Grid>

          {/* Bulk Operations Toggle */}
          {showBulkOperations && (
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant={selectMode ? "contained" : "outlined"}
                  size="small"
                  onClick={handleToggleSelectMode}
                  startIcon={selectMode ? <ClearAllIcon /> : <SelectAllIcon />}
                  sx={{ minWidth: 120 }}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </Button>
                {selectMode && (
                  <Button
                    size="small"
                    onClick={handleSelectAll}
                    sx={{ minWidth: 80 }}
                  >
                    All Page
                  </Button>
                )}
              </Stack>
            </Grid>
          )}

          {/* Grade Filter */}
          <Grid size={{ xs: 12, sm: 6, md: showBulkOperations ? 2 : 3 }}>
            <FormControl fullWidth>
              <InputLabel>Grade Level</InputLabel>
              <Select
                value={gradeFilter}
                label="Grade Level"
                onChange={(e) => setGradeFilter(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <MenuItem value="">All Grades</MenuItem>
                {GRADE_LEVELS.map(grade => (
                  <MenuItem key={grade.value} value={grade.value}>
                    {grade.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid size={{ xs: 12, sm: 6, md: showBulkOperations ? 2 : 3 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Sort */}
          <Grid size={{ xs: 12, md: showBulkOperations ? 3 : 2 }}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortField}
                label="Sort By"
                onChange={(e) => handleSortChange(e.target.value as SortField)}
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                  </InputAdornment>
                }
                sx={{
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="grade">Grade</MenuItem>
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Results Summary */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {paginatedStudents.length} of {filteredAndSortedStudents.length} students
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedStudents.size > 0 && (
              <Chip 
                label={`${selectedStudents.size} selected`} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }} 
              />
            )}
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            {selectMode && filteredAndSortedStudents.length > paginatedStudents.length && (
              <Button
                size="small"
                onClick={handleSelectAllFiltered}
                sx={{ fontSize: '0.75rem' }}
              >
                Select All {filteredAndSortedStudents.length}
              </Button>
            )}
            <Typography variant="body2" color="text.secondary">
              {sortOrder === 'asc' ? '↑' : '↓'} Sorted by {sortField}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Student Cards Grid */}
      {loading ? renderLoadingSkeletons() : (
        <>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              md: useEnhancedCards ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              lg: useEnhancedCards ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'
            },
            gap: 3,
            width: '100%'
          }}>
            {paginatedStudents.map(student => (
              <Box key={student.id} sx={{ minHeight: useEnhancedCards ? 400 : 320 }}>
                {useEnhancedCards ? (
                  <Box sx={{ height: '100%' }}>
                    <EnhancedStudentCard
                      student={student}
                      selected={selectedStudents.has(student.id)}
                      onSelect={handleSelectStudent}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onEnroll={onEnroll}
                      onExpandEnrollments={handleToggleExpand}
                      isExpanded={expandedStudents.has(student.id)}
                      enrollmentCount={0} // Will be loaded by wrapper
                      showSelection={selectMode}
                      // Provide mock data for enhanced features until backend integration
                      accommodations={undefined}
                      contactInfo={undefined}
                      compact={false}
                      highlighted={false}
                    />
                    {/* Expanded Enrollment Details */}
                    {expandedStudents.has(student.id) && (
                      <Box sx={{ mt: 2 }}>
                        <StudentCardWrapperEnrollments
                          student={student}
                          onWithdrawEnrollment={onWithdrawEnrollment}
                          academicYearName={academicYearName}
                          academicYearId={academicYearId}
                        />
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ height: '100%' }}>
                    <StudentCardWrapper
                      student={student}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onEnroll={onEnroll}
                      onWithdrawEnrollment={onWithdrawEnrollment}
                      isExpanded={expandedStudents.has(student.id)}
                      onToggleExpand={handleToggleExpand}
                      academicYearName={academicYearName}
                      academicYearId={academicYearId}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {/* Empty State */}
          {paginatedStudents.length === 0 && !loading && (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Students Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery || gradeFilter || statusFilter
                  ? 'Try adjusting your search or filter criteria'
                  : 'No students have been added yet'
                }
              </Typography>
            </Paper>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 2,
                    '&.Mui-selected': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    },
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
      
      {/* Bulk Operations Toolbar */}
      {showBulkOperations && (
        <BulkOperationsToolbar
          selectedStudents={selectedStudentObjects}
          totalStudents={filteredAndSortedStudents.length}
          onClearSelection={handleClearSelection}
          onSelectAll={handleSelectAllFiltered}
          onBulkEnroll={onBulkEnroll}
          onBulkActivate={onBulkActivate}
          onBulkInactivate={onBulkInactivate}
          onBulkDelete={onBulkDelete}
          onBulkExport={onBulkExport}
          onBulkEmail={onBulkEmail}
          onBulkSms={onBulkSms}
          onBulkReport={onBulkReport}
          availableClassrooms={availableClassrooms}
        />
      )}
    </Box>
  );
};

// Separate component for enrollment details to avoid hook issues
interface StudentCardWrapperEnrollmentsProps {
  student: Student;
  onWithdrawEnrollment?: (studentId: string, enrollmentId: string) => void;
  academicYearName?: string;
  academicYearId?: string;
}

const StudentCardWrapperEnrollments: React.FC<StudentCardWrapperEnrollmentsProps> = ({
  student,
  onWithdrawEnrollment,
  academicYearName,
  academicYearId,
}) => {
  // Fetch enrollments for this specific student
  const { data: enrollments = [], isLoading } = useStudentEnrollments(student.id, {
    active_only: true,
    academic_year_id: academicYearId,
  });

  return (
    <EnrollmentStatus
      studentId={student.id}
      enrollments={enrollments}
      enrollmentCount={enrollments.length}
      isExpanded={true}
      onToggleExpand={() => {}}
      onWithdrawEnrollment={onWithdrawEnrollment ? (enrollmentId) => onWithdrawEnrollment(student.id, enrollmentId) : undefined}
      isLoading={isLoading}
      academicYearName={academicYearName}
      studentGrade={student.current_grade_level}
    />
  );
};

export default StudentGrid;