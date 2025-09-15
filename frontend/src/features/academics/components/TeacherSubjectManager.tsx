// src/features/academics/components/TeacherSubjectManager.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  CircularProgress,
  Badge,
  Button,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  SwapHoriz as SwapIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  NotificationImportant as NotificationIcon,
  Add as AddIcon,
  History as HistoryIcon,
} from '@mui/icons-material';

import { useTeacherSubjects } from '../hooks/useHomeroom';
import { useTeacherSwaps } from '../hooks/useTeacherSwaps';
import { isSwappableSubject } from '@/schemas/academics';
import type { TeacherSubjects } from '../services/homeroom';
import SubjectSwapDialog from './SubjectSwapDialog';
import SwapRequestsPanel from './SwapRequestsPanel';

type Props = {
  teacherId: string;
  teacherName?: string;
  academicYearId?: string;
  onViewEnrollment?: (classroomId: string) => void;
  showSwapPanel?: boolean;
};

export default function TeacherSubjectManager({
  teacherId,
  teacherName,
  academicYearId,
  onViewEnrollment,
  showSwapPanel = false,
}: Props) {
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showSwapRequests, setShowSwapRequests] = useState(showSwapPanel);

  const {
    data: teacherSubjects,
    isLoading,
    error,
  } = useTeacherSubjects(
    teacherId,
    { academic_year_id: academicYearId }
  );

  const { data: swaps = [] } = useTeacherSwaps(teacherId);

  // Calculate swap notifications
  const pendingReceivedSwaps = swaps.filter(swap => 
    swap.target_teacher.id === teacherId && 
    swap.status === 'PENDING_TARGET_RESPONSE'
  ).length;

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Loading teacher assignments...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error Loading Assignments</AlertTitle>
        Unable to load teacher subject assignments. Please try again.
      </Alert>
    );
  }

  if (!teacherSubjects || teacherSubjects.length === 0) {
    return (
      <Alert severity="info">
        <AlertTitle>No Subject Assignments</AlertTitle>
        {teacherName} does not have any subject assignments for this academic year.
      </Alert>
    );
  }

  // Calculate statistics
  const totalStudents = teacherSubjects.reduce((sum, subject) => sum + subject.enrollment_count, 0);
  const uniqueGrades = [...new Set(teacherSubjects.map(s => s.grade_level))];
  const uniqueSubjects = [...new Set(teacherSubjects.map(s => s.subject_name))];

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>
                Subject Assignments
              </Typography>
              {teacherName && (
                <Typography variant="body2" color="text.secondary">
                  {teacherName}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              {pendingReceivedSwaps > 0 && (
                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={
                    <Badge badgeContent={pendingReceivedSwaps} color="error">
                      <NotificationIcon />
                    </Badge>
                  }
                  onClick={() => setShowSwapRequests(true)}
                >
                  Swap Requests
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setShowSwapRequests(!showSwapRequests)}
              >
                {showSwapRequests ? 'Hide' : 'Show'} Swap Panel
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Summary Stats */}
        <Stack direction="row" spacing={2}>
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AssignmentIcon color="primary" />
                <Box>
                  <Typography variant="h6">{teacherSubjects.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Classrooms
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="h6">{totalStudents}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SchoolIcon color="primary" />
                <Box>
                  <Typography variant="h6">{uniqueSubjects.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Subjects
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        {/* Grade Levels Overview */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Grade Levels Teaching
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {uniqueGrades.map((grade) => {
                const gradeSubjects = teacherSubjects.filter(s => s.grade_level === grade);
                return (
                  <Badge key={grade} badgeContent={gradeSubjects.length} color="primary">
                    <Chip label={`Grade ${grade}`} variant="outlined" />
                  </Badge>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Assignments Table */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Current Assignments
            </Typography>
            
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Classroom</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell align="right">Students</TableCell>
                    <TableCell>Assigned Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teacherSubjects.map((assignment) => (
                    <TableRow key={assignment.classroom_id} hover>
                      <TableCell>
                        <Stack>
                          <Typography variant="body2" fontWeight="medium">
                            {assignment.subject_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {assignment.subject_code}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {assignment.classroom_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`Grade ${assignment.grade_level}`}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {assignment.enrollment_count}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CalendarIcon fontSize="small" color="disabled" />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(assignment.assignment_date).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" justifyContent="center" spacing={0.5}>
                          {onViewEnrollment && (
                            <Tooltip title="View Student Enrollment">
                              <IconButton
                                size="small"
                                onClick={() => onViewEnrollment(assignment.classroom_id)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {isSwappableSubject(assignment.subject_name) && (
                            <Tooltip title="Request Subject Swap">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedSubject({
                                    id: assignment.subject_id,
                                    name: assignment.subject_name,
                                  });
                                  setSwapDialogOpen(true);
                                }}
                              >
                                <SwapIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Subject Distribution
            </Typography>
            <Stack spacing={2}>
              {uniqueSubjects.map((subjectName) => {
                const subjectAssignments = teacherSubjects.filter(s => s.subject_name === subjectName);
                const subjectStudentCount = subjectAssignments.reduce((sum, a) => sum + a.enrollment_count, 0);
                
                return (
                  <Box key={subjectName}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {subjectName}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {subjectAssignments.length} classroom{subjectAssignments.length !== 1 ? 's' : ''}
                        </Typography>
                        <Chip 
                          label={`${subjectStudentCount} students`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Stack>
                    
                    {/* Show grade breakdown for this subject */}
                    <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                      {subjectAssignments.map((assignment) => (
                        <Chip
                          key={assignment.classroom_id}
                          label={`Grade ${assignment.grade_level} (${assignment.enrollment_count})`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Subject Swap Requests Panel */}
        {showSwapRequests && (
          <>
            <Divider />
            <SwapRequestsPanel 
              teacherId={teacherId}
              teacherName={teacherName}
            />
          </>
        )}
      </Stack>

      {/* Subject Swap Dialog */}
      {selectedSubject && (
        <SubjectSwapDialog
          open={swapDialogOpen}
          onClose={() => {
            setSwapDialogOpen(false);
            setSelectedSubject(null);
          }}
          requesterTeacherId={teacherId}
          requesterSubjectId={selectedSubject.id}
          requesterSubjectName={selectedSubject.name}
          requesterTeacherName={teacherName}
        />
      )}
    </Box>
  );
}