// src/features/academics/components/AutoAssignmentPreview.tsx
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  School as SchoolIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

import { usePreviewAssignment } from '../hooks/useHomeroom';
import type { AssignmentPreview } from '../services/homeroom';

type Props = {
  grade: string | undefined;
  teacherId: string | undefined;
  academicYearId: string | undefined;
  teacherName?: string;
};

export default function AutoAssignmentPreview({
  grade,
  teacherId,
  academicYearId,
  teacherName,
}: Props) {
  const {
    data: preview,
    isLoading,
    error,
    isFetching,
  } = usePreviewAssignment(
    grade,
    teacherId,
    { academic_year_id: academicYearId }
  );

  if (!grade || !teacherId) {
    return (
      <Alert severity="info" icon={<InfoIcon />}>
        <AlertTitle>Preview Not Available</AlertTitle>
        Please select both a teacher and grade level to see the auto-assignment preview.
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">
              Loading assignment preview...
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error" icon={<ErrorIcon />}>
        <AlertTitle>Preview Error</AlertTitle>
        Unable to load assignment preview. Please try again.
      </Alert>
    );
  }

  if (!preview) {
    return null;
  }

  const hasConflicts = false; // No conflicts in new schema
  const hasErrors = false;
  const hasWarnings = false;

  return (
    <Box>
      {isFetching && <LinearProgress sx={{ mb: 2 }} />}
      
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Auto-Assignment Preview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {teacherName && `${teacherName} • `}
            Grade {grade} Homeroom
          </Typography>
        </Box>

        {/* Ready for creation status */}
        {!preview.ready_for_creation && (
          <Alert 
            severity="warning"
            icon={<WarningIcon />}
          >
            <AlertTitle>Not Ready for Creation</AlertTitle>
            This assignment preview is not ready for homeroom creation. Please check the requirements.
          </Alert>
        )}

        {/* Subjects to be assigned */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AssignmentIcon color="primary" />
                <Typography variant="subtitle1">
                  CORE Subjects to Assign
                </Typography>
              </Stack>
              
              {preview.subjects_to_assign.length > 0 ? (
                <Box>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {preview.subjects_to_assign.map((subject) => (
                      <Chip
                        key={subject.id}
                        label={subject.name}
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {preview.subjects_to_assign.length} subject{preview.subjects_to_assign.length !== 1 ? 's' : ''} will be auto-assigned
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ py: 1 }}>
                  No CORE subjects available for auto-assignment
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Student Impact */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PersonIcon color="primary" />
                <Typography variant="subtitle1">
                  Student Impact
                </Typography>
              </Stack>
              
              <Box>
                <Typography variant="h4" color="primary" gutterBottom>
                  {preview.will_create_classrooms}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  classrooms will be created for auto-enrollment
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Teacher Workload */}
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <SchoolIcon color="primary" />
                <Typography variant="subtitle1">
                  Teacher Workload Impact
                </Typography>
              </Stack>
              
              <Stack spacing={2}>
                {/* Subject Load */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2">Subject Assignments</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {preview.total_existing_assignments} → {preview.total_existing_assignments + preview.total_new_assignments}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      label={`${preview.total_existing_assignments} current`}
                      size="small"
                      variant="outlined"
                    />
                    <Typography variant="body2">+</Typography>
                    <Chip 
                      label={`${preview.total_new_assignments} new`}
                      size="small"
                      color="primary"
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Classroom Creation */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2">Classrooms</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {preview.will_create_classrooms} will be created
                    </Typography>
                  </Stack>
                  <Chip 
                    label={`${preview.will_create_classrooms} new classrooms`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Success indicator */}
        {preview.ready_for_creation && preview.subjects_to_assign.length > 0 && (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            <AlertTitle>Ready to Create Homeroom</AlertTitle>
            This homeroom can be created successfully with the assignments shown above.
          </Alert>
        )}
      </Stack>
    </Box>
  );
}