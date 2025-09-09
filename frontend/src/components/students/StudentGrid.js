import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Box, Grid, TextField, InputAdornment, Stack, Typography, Select, MenuItem, FormControl, InputLabel, Paper, Pagination, Skeleton, Button, Chip, alpha, useTheme, } from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon, Sort as SortIcon, SelectAll as SelectAllIcon, ClearAll as ClearAllIcon, } from '@mui/icons-material';
import { StudentCard } from './StudentCard';
import { EnhancedStudentCard } from './EnhancedStudentCard';
import { EnrollmentStatus } from './EnrollmentStatus';
import { BulkOperationsToolbar } from './BulkOperationsToolbar';
import { GRADE_LEVELS } from '@/schemas/students';
import { useStudentEnrollments } from '@/features/enrollment/hooks/useStudents';
const StudentCardWrapper = ({ student, onEdit, onDelete, onEnroll, onWithdrawEnrollment, isExpanded, onToggleExpand, academicYearName, academicYearId, }) => {
    // Fetch enrollments for this specific student
    const { data: enrollments = [], isLoading } = useStudentEnrollments(student.id, {
        active_only: true,
        academic_year_id: academicYearId,
    });
    return (_jsxs(Box, { children: [_jsx(StudentCard, { student: student, onEdit: onEdit, onDelete: onDelete, onEnroll: onEnroll, onExpandEnrollments: onToggleExpand, isExpanded: isExpanded, enrollmentCount: enrollments.length }), isExpanded && (_jsx(Box, { sx: { mt: 2 }, children: _jsx(EnrollmentStatus, { studentId: student.id, enrollments: enrollments, enrollmentCount: enrollments.length, isExpanded: true, onToggleExpand: () => { }, onWithdrawEnrollment: onWithdrawEnrollment ? (enrollmentId) => onWithdrawEnrollment(student.id, enrollmentId) : undefined, isLoading: isLoading, academicYearName: academicYearName, studentGrade: student.current_grade_level }) }))] }));
};
export const StudentGrid = ({ students, loading = false, onEdit, onDelete, onEnroll, onWithdrawEnrollment, academicYearName, academicYearId, itemsPerPage = 12, useEnhancedCards = false, showBulkOperations = false, availableClassrooms = [], onBulkEnroll, onBulkActivate, onBulkInactivate, onBulkDelete, onBulkExport, onBulkEmail, onBulkSms, onBulkReport, }) => {
    const theme = useTheme();
    // State for search, filter, sort, and pagination
    const [searchQuery, setSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedStudents, setExpandedStudents] = useState(new Set());
    // Bulk operations state
    const [selectedStudents, setSelectedStudents] = useState(new Set());
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
    const paginatedStudents = filteredAndSortedStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    // Handle expand/collapse
    const handleToggleExpand = (studentId) => {
        setExpandedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            }
            else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };
    // Bulk selection handlers
    const handleSelectStudent = (studentId, selected) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(studentId);
            }
            else {
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
    const handleSortChange = (field) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortOrder('asc');
        }
    };
    // Render loading skeleton
    const renderLoadingSkeletons = () => (_jsx(Box, { sx: {
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3
        }, children: Array.from({ length: itemsPerPage }).map((_, index) => (_jsx(Paper, { sx: { p: 3, borderRadius: 3 }, children: _jsxs(Stack, { spacing: 2, children: [_jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(Skeleton, { variant: "circular", width: 56, height: 56 }), _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Skeleton, { variant: "text", width: "70%", height: 24 }), _jsx(Skeleton, { variant: "text", width: "40%", height: 20 })] })] }), _jsx(Skeleton, { variant: "text", width: "60%" }), _jsx(Skeleton, { variant: "text", width: "80%" }), _jsx(Skeleton, { variant: "rectangular", height: 40 })] }) }, index))) }));
    return (_jsxs(Box, { children: [_jsxs(Paper, { sx: {
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
                }, children: [_jsxs(Grid, { container: true, spacing: 3, alignItems: "center", children: [_jsx(Grid, { size: { xs: 12, md: showBulkOperations ? 3 : 4 }, children: _jsx(TextField, { fullWidth: true, placeholder: "Search students...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), InputProps: {
                                        startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { sx: { color: theme.palette.text.secondary } }) })),
                                    }, sx: {
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
                                    } }) }), showBulkOperations && (_jsx(Grid, { size: { xs: 12, sm: 6, md: 2 }, children: _jsxs(Stack, { direction: "row", spacing: 1, children: [_jsx(Button, { variant: selectMode ? "contained" : "outlined", size: "small", onClick: handleToggleSelectMode, startIcon: selectMode ? _jsx(ClearAllIcon, {}) : _jsx(SelectAllIcon, {}), sx: { minWidth: 120 }, children: selectMode ? 'Cancel' : 'Select' }), selectMode && (_jsx(Button, { size: "small", onClick: handleSelectAll, sx: { minWidth: 80 }, children: "All Page" }))] }) })), _jsx(Grid, { size: { xs: 12, sm: 6, md: showBulkOperations ? 2 : 3 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Grade Level" }), _jsxs(Select, { value: gradeFilter, label: "Grade Level", onChange: (e) => setGradeFilter(e.target.value), startAdornment: _jsx(InputAdornment, { position: "start", children: _jsx(FilterIcon, { sx: { color: theme.palette.text.secondary, mr: 1 } }) }), sx: {
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.paper, 0.5),
                                            }, children: [_jsx(MenuItem, { value: "", children: "All Grades" }), GRADE_LEVELS.map(grade => (_jsx(MenuItem, { value: grade.value, children: grade.label }, grade.value)))] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6, md: showBulkOperations ? 2 : 3 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Status" }), _jsxs(Select, { value: statusFilter, label: "Status", onChange: (e) => setStatusFilter(e.target.value), sx: {
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.paper, 0.5),
                                            }, children: [_jsx(MenuItem, { value: "", children: "All Status" }), _jsx(MenuItem, { value: "active", children: "Active" }), _jsx(MenuItem, { value: "inactive", children: "Inactive" })] })] }) }), _jsx(Grid, { size: { xs: 12, md: showBulkOperations ? 3 : 2 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Sort By" }), _jsxs(Select, { value: sortField, label: "Sort By", onChange: (e) => handleSortChange(e.target.value), startAdornment: _jsx(InputAdornment, { position: "start", children: _jsx(SortIcon, { sx: { color: theme.palette.text.secondary, mr: 1 } }) }), sx: {
                                                borderRadius: 2,
                                                bgcolor: alpha(theme.palette.background.paper, 0.5),
                                            }, children: [_jsx(MenuItem, { value: "name", children: "Name" }), _jsx(MenuItem, { value: "grade", children: "Grade" }), _jsx(MenuItem, { value: "email", children: "Email" }), _jsx(MenuItem, { value: "status", children: "Status" })] })] }) })] }), _jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", sx: { mt: 2 }, children: [_jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["Showing ", paginatedStudents.length, " of ", filteredAndSortedStudents.length, " students", searchQuery && ` matching "${searchQuery}"`, selectedStudents.size > 0 && (_jsx(Chip, { label: `${selectedStudents.size} selected`, size: "small", color: "primary", sx: { ml: 1 } }))] }), _jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [selectMode && filteredAndSortedStudents.length > paginatedStudents.length && (_jsxs(Button, { size: "small", onClick: handleSelectAllFiltered, sx: { fontSize: '0.75rem' }, children: ["Select All ", filteredAndSortedStudents.length] })), _jsxs(Typography, { variant: "body2", color: "text.secondary", children: [sortOrder === 'asc' ? '↑' : '↓', " Sorted by ", sortField] })] })] })] }), loading ? renderLoadingSkeletons() : (_jsxs(_Fragment, { children: [_jsx(Box, { sx: {
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: useEnhancedCards ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                                lg: useEnhancedCards ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)'
                            },
                            gap: 3,
                            width: '100%'
                        }, children: paginatedStudents.map(student => (_jsx(Box, { sx: { minHeight: useEnhancedCards ? 400 : 320 }, children: useEnhancedCards ? (_jsxs(Box, { sx: { height: '100%' }, children: [_jsx(EnhancedStudentCard, { student: student, selected: selectedStudents.has(student.id), onSelect: handleSelectStudent, onEdit: onEdit, onDelete: onDelete, onEnroll: onEnroll, onExpandEnrollments: handleToggleExpand, isExpanded: expandedStudents.has(student.id), enrollmentCount: 0, showSelection: selectMode, 
                                        // Provide mock data for enhanced features until backend integration
                                        accommodations: undefined, contactInfo: undefined, compact: false, highlighted: false }), expandedStudents.has(student.id) && (_jsx(Box, { sx: { mt: 2 }, children: _jsx(StudentCardWrapperEnrollments, { student: student, onWithdrawEnrollment: onWithdrawEnrollment, academicYearName: academicYearName, academicYearId: academicYearId }) }))] })) : (_jsx(Box, { sx: { height: '100%' }, children: _jsx(StudentCardWrapper, { student: student, onEdit: onEdit, onDelete: onDelete, onEnroll: onEnroll, onWithdrawEnrollment: onWithdrawEnrollment, isExpanded: expandedStudents.has(student.id), onToggleExpand: handleToggleExpand, academicYearName: academicYearName, academicYearId: academicYearId }) })) }, student.id))) }), paginatedStudents.length === 0 && !loading && (_jsxs(Paper, { sx: {
                            p: 6,
                            textAlign: 'center',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                        }, children: [_jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "No Students Found" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: searchQuery || gradeFilter || statusFilter
                                    ? 'Try adjusting your search or filter criteria'
                                    : 'No students have been added yet' })] })), totalPages > 1 && (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', mt: 4 }, children: _jsx(Pagination, { count: totalPages, page: currentPage, onChange: (_, page) => setCurrentPage(page), color: "primary", size: "large", sx: {
                                '& .MuiPaginationItem-root': {
                                    borderRadius: 2,
                                    '&.Mui-selected': {
                                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                                    },
                                },
                            } }) }))] })), showBulkOperations && (_jsx(BulkOperationsToolbar, { selectedStudents: selectedStudentObjects, totalStudents: filteredAndSortedStudents.length, onClearSelection: handleClearSelection, onSelectAll: handleSelectAllFiltered, onBulkEnroll: onBulkEnroll, onBulkActivate: onBulkActivate, onBulkInactivate: onBulkInactivate, onBulkDelete: onBulkDelete, onBulkExport: onBulkExport, onBulkEmail: onBulkEmail, onBulkSms: onBulkSms, onBulkReport: onBulkReport, availableClassrooms: availableClassrooms }))] }));
};
const StudentCardWrapperEnrollments = ({ student, onWithdrawEnrollment, academicYearName, academicYearId, }) => {
    // Fetch enrollments for this specific student
    const { data: enrollments = [], isLoading } = useStudentEnrollments(student.id, {
        active_only: true,
        academic_year_id: academicYearId,
    });
    return (_jsx(EnrollmentStatus, { studentId: student.id, enrollments: enrollments, enrollmentCount: enrollments.length, isExpanded: true, onToggleExpand: () => { }, onWithdrawEnrollment: onWithdrawEnrollment ? (enrollmentId) => onWithdrawEnrollment(student.id, enrollmentId) : undefined, isLoading: isLoading, academicYearName: academicYearName, studentGrade: student.current_grade_level }));
};
export default StudentGrid;
