import React, { useState, useMemo } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Card,
  CardContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  LinearProgress,
  CircularProgress,
  alpha,
  useTheme,
} from '@mui/material';
// Grid import removed - using Stack instead
import {
  Close as CloseIcon,
  Assessment as SummaryIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  School as SchoolIcon,
  Person as StudentIcon,
  Class as SubjectIcon,
  Assignment as EnrollmentIcon,
  Timeline as ProgressIcon,
  Download as ExportIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

import type { Student } from '@/schemas/students';
import type { EnrollmentSummaryItem } from '@/schemas/threeTierEnrollment';
import { 
  SUBJECT_TYPE_LABELS,
  ENROLLMENT_STATUS_COLORS 
} from '@/schemas/threeTierEnrollment';
import { 
  useMultipleStudentSummaries,
  useEnrollmentProgress
} from '@/features/enrollment/hooks/useThreeTierEnrollment';

interface EnrollmentSummaryComponentProps {
  studentIds: string[];
  academicYearId: string;
  enrollmentHistory: Array<{
    tier: number;
    type: string;
    timestamp: Date;
    summary: string;
  }>;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`summary-tabpanel-${index}`}
      aria-labelledby={`summary-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const EnrollmentSummaryComponent: React.FC<EnrollmentSummaryComponentProps> = ({
  studentIds,
  academicYearId,
  enrollmentHistory,
  onClose,
}) => {
  const theme = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState(0);

  // Hooks
  const summariesQuery = useMultipleStudentSummaries(studentIds, academicYearId);
  const progressQuery = useEnrollmentProgress(studentIds, academicYearId);

  // Process enrollment data
  const enrollmentData = useMemo(() => {
    if (!summariesQuery.data) return null;

    const successful = summariesQuery.successfulSummaries;
    const failed = summariesQuery.failedSummaries;

    // Aggregate statistics
    const totalEnrollments = successful.reduce((acc, s) => 
      acc + (s.data?.statistics.total_enrollments || 0), 0
    );
    
    const activeEnrollments = successful.reduce((acc, s) => 
      acc + (s.data?.statistics.active_enrollments || 0), 0
    );
    
    const avgCoreCompletion = successful.length > 0 
      ? successful.reduce((acc, s) => 
          acc + (s.data?.statistics.core_completion_rate || 0), 0
        ) / successful.length
      : 0;

    const totalConflicts = successful.reduce((acc, s) => 
      acc + (s.data?.conflicts.length || 0), 0
    );

    // Enrollment breakdown by subject type
    const subjectTypeBreakdown: Record<string, number> = {};
    successful.forEach(s => {
      if (s.data?.enrollment_summary) {
        Object.entries(s.data.enrollment_summary).forEach(([type, enrollments]) => {
          subjectTypeBreakdown[type] = (subjectTypeBreakdown[type] || 0) + enrollments.length;
        });
      }
    });

    // Performance metrics
    const performanceData = successful.map(s => ({
      studentId: s.studentId,
      studentName: s.data?.student.name || 'Unknown',
      totalEnrollments: s.data?.statistics.total_enrollments || 0,
      activeEnrollments: s.data?.statistics.active_enrollments || 0,
      coreCompletion: s.data?.statistics.core_completion_rate || 0,
      overallGPA: s.data?.statistics.overall_gpa,
      attendanceRate: s.data?.statistics.attendance_rate,
      conflictsCount: s.data?.conflicts.length || 0,
    }));

    return {
      totalStudents: studentIds.length,
      processedStudents: successful.length,
      failedStudents: failed.length,
      totalEnrollments,
      activeEnrollments,
      avgCoreCompletion,
      totalConflicts,
      subjectTypeBreakdown,
      performanceData,
      summaryData: successful
    };
  }, [summariesQuery.data, studentIds.length]);

  // Enrollment timeline
  const enrollmentTimeline = useMemo(() => {
    return enrollmentHistory.map((entry, index) => ({
      ...entry,
      id: index,
      tierName: `Tier ${entry.tier}`,
      formattedTime: entry.timestamp.toLocaleString(),
    }));
  }, [enrollmentHistory]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Export functionality (placeholder)
  const handleExport = () => {
    // This would implement CSV/Excel export functionality
    console.log('Export enrollment summary data');
  };

  // Loading state
  if (summariesQuery.isLoading) {
    return (
      <Dialog open={true} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: { minHeight: '85vh', maxHeight: '95vh' },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Enrollment Summary Report
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {enrollmentData?.totalStudents || 0} students • {enrollmentData?.totalEnrollments || 0} total enrollments
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<ExportIcon />}
              onClick={handleExport}
              variant="outlined"
              size="small"
            >
              Export
            </Button>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Overview Statistics */}
        {enrollmentData && (
          <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enrollment Overview
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={600} color="primary.main">
                    {enrollmentData.processedStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students Processed
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={600} color="success.main">
                    {enrollmentData.totalEnrollments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Enrollments
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={600} color="info.main">
                    {enrollmentData.avgCoreCompletion.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Core Completion
                  </Typography>
                </CardContent>
              </Card>
              
              <Card sx={{ flex: '1 1 200px', minWidth: 200 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={600} color={enrollmentData.totalConflicts > 0 ? "error.main" : "success.main"}>
                    {enrollmentData.totalConflicts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Conflicts
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Paper>
        )}

        {/* Progress Overview */}
        {progressQuery.progress && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Enrollment Progress
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Overall Completion Rate</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {progressQuery.progress.completionRate.toFixed(1)}%
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={progressQuery.progress.completionRate}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip 
                  label={`${progressQuery.progress.fullyEnrolled} Fully Enrolled`} 
                  color="success" 
                  icon={<CheckIcon />}
                />
                <Chip 
                  label={`${progressQuery.progress.partiallyEnrolled} Partially Enrolled`} 
                  color="warning" 
                  icon={<WarningIcon />}
                />
                <Chip 
                  label={`${progressQuery.progress.notEnrolled} Not Enrolled`} 
                  color="error" 
                  icon={<InfoIcon />}
                />
              </Stack>
            </Stack>
          </Paper>
        )}

        {/* Tabbed Content */}
        <Box>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab label="Student Performance" />
            <Tab label="Subject Breakdown" />
            <Tab label="Enrollment Timeline" />
            <Tab label="Conflicts & Issues" />
          </Tabs>

          {/* Student Performance Tab */}
          <TabPanel value={activeTab} index={0}>
            {enrollmentData?.performanceData && (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell align="center">Total Enrollments</TableCell>
                      <TableCell align="center">Active Enrollments</TableCell>
                      <TableCell align="center">Core Completion</TableCell>
                      <TableCell align="center">GPA</TableCell>
                      <TableCell align="center">Attendance</TableCell>
                      <TableCell align="center">Conflicts</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {enrollmentData.performanceData.map((student) => (
                      <TableRow key={student.studentId}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <StudentIcon fontSize="small" />
                            <Typography variant="body2" fontWeight={500}>
                              {student.studentName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">{student.totalEnrollments}</TableCell>
                        <TableCell align="center">{student.activeEnrollments}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${student.coreCompletion.toFixed(0)}%`}
                            size="small"
                            color={student.coreCompletion === 100 ? 'success' : 
                                   student.coreCompletion >= 75 ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {student.overallGPA ? student.overallGPA.toFixed(2) : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {student.attendanceRate ? `${student.attendanceRate.toFixed(0)}%` : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          {student.conflictsCount > 0 ? (
                            <Chip 
                              label={student.conflictsCount} 
                              size="small" 
                              color="error"
                              icon={<WarningIcon />}
                            />
                          ) : (
                            <Chip 
                              label="None" 
                              size="small" 
                              color="success"
                              icon={<CheckIcon />}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Subject Breakdown Tab */}
          <TabPanel value={activeTab} index={1}>
            {enrollmentData?.subjectTypeBreakdown && (
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                {Object.entries(enrollmentData.subjectTypeBreakdown).map(([type, count]) => (
                  <Card key={type} sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <CardContent>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <SubjectIcon sx={{ color: theme.palette.primary.main }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={600}>
                            {count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {SUBJECT_TYPE_LABELS[type as keyof typeof SUBJECT_TYPE_LABELS] || type}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Enrollment Timeline Tab */}
          <TabPanel value={activeTab} index={2}>
            <Stack spacing={2}>
              {enrollmentTimeline.map((entry) => (
                <Card key={entry.id}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: '50%',
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ProgressIcon sx={{ color: theme.palette.success.main }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {entry.tierName}: {entry.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {entry.summary}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {entry.formattedTime}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`Tier ${entry.tier}`} 
                        size="small" 
                        color="primary" 
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
              
              {enrollmentTimeline.length === 0 && (
                <Alert severity="info">
                  No enrollment operations have been completed yet.
                </Alert>
              )}
            </Stack>
          </TabPanel>

          {/* Conflicts & Issues Tab */}
          <TabPanel value={activeTab} index={3}>
            {enrollmentData?.summaryData && (
              <Stack spacing={2}>
                {enrollmentData.summaryData
                  .filter(s => s.data && s.data.conflicts.length > 0)
                  .map((studentSummary) => (
                    <Accordion key={studentSummary.studentId}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%', pr: 2 }}>
                          <Typography variant="subtitle1" fontWeight={500}>
                            {studentSummary.data?.student.name || 'Unknown Student'}
                          </Typography>
                          <Chip 
                            label={`${studentSummary.data?.conflicts.length || 0} conflicts`}
                            size="small"
                            color="error"
                          />
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {studentSummary.data?.conflicts.map((conflict, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <WarningIcon color="error" />
                              </ListItemIcon>
                              <ListItemText
                                primary={conflict.message}
                                secondary={
                                  <Stack spacing={0.5}>
                                    <Typography variant="caption">
                                      Type: {conflict.type}
                                    </Typography>
                                    <Typography variant="caption">
                                      Severity: {conflict.severity}
                                    </Typography>
                                    {conflict.recommended_action && (
                                      <Typography variant="caption" color="primary.main">
                                        Recommended: {conflict.recommended_action}
                                      </Typography>
                                    )}
                                  </Stack>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                
                {enrollmentData.totalConflicts === 0 && (
                  <Alert severity="success">
                    <Typography variant="subtitle2" gutterBottom>
                      No Conflicts Detected
                    </Typography>
                    <Typography variant="body2">
                      All enrollment operations completed successfully without conflicts.
                    </Typography>
                  </Alert>
                )}
              </Stack>
            )}
          </TabPanel>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained">
          Close Summary
        </Button>
      </DialogActions>
    </Dialog>
  );
};