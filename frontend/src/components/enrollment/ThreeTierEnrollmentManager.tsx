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
  Chip,
  Alert,
  Paper,
  Card,
  CardContent,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme,
  ButtonGroup,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  School as SchoolIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
} from '@mui/icons-material';

// Import types
import type { Student } from '@/schemas/students';

// Import workflow-specific components
import { HomeroomEnrollmentWorkflow } from './workflows/HomeroomEnrollmentWorkflow';
import { HomeroomBulkEnrollmentWorkflow } from './workflows/HomeroomBulkEnrollmentWorkflow';
import { IndividualEnrollmentWorkflow } from './workflows/IndividualEnrollmentWorkflow';

// Types
type EnrollmentWorkflow = 'homeroom' | 'group' | 'individual';

interface ThreeTierEnrollmentManagerProps {
  students: Student[];
  academicYearId: string;
  academicYearName?: string;
  open: boolean;
  onClose: () => void;
  onEnrollmentComplete?: (results: {
    workflowType: EnrollmentWorkflow;
    enrollmentCount: number;
    studentsAffected: number;
  }) => void;
}

interface WorkflowOption {
  id: EnrollmentWorkflow;
  title: string;
  description: string;
  icon: React.ReactElement;
  bestFor: string;
  steps: string[];
}

export const ThreeTierEnrollmentManager: React.FC<ThreeTierEnrollmentManagerProps> = ({
  students,
  academicYearId,
  academicYearName,
  open,
  onClose,
  onEnrollmentComplete,
}) => {
  const theme = useTheme();
  
  // State management
  const [selectedWorkflow, setSelectedWorkflow] = useState<EnrollmentWorkflow | null>(null);
  const [showWorkflowSelector, setShowWorkflowSelector] = useState(true);

  // Derive grade level from selected students
  const primaryGradeLevel = useMemo(() => {
    const gradeCounts = students.reduce((acc, student) => {
      acc[student.current_grade_level] = (acc[student.current_grade_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(gradeCounts)
      .sort(([,a], [,b]) => b - a)
      [0]?.[0] || '';
  }, [students]);

  // Workflow options based on SME-designed workflows
  const workflowOptions: WorkflowOption[] = [
    {
      id: 'homeroom',
      title: 'Homeroom Enrollment',
      description: 'Enroll students in CORE subjects by homeroom teacher',
      icon: <GroupsIcon />,
      bestFor: 'Bulk enrollment of students in Math, ELA, Science, Social Studies',
      steps: ['Select Grade Level', 'Choose Homeroom Teacher', 'Select Students', 'Choose CORE Subjects', 'Review & Confirm']
    },
    {
      id: 'group',
      title: 'Bulk Enrollment',
      description: 'Enroll homeroom population in multiple classrooms',
      icon: <SchoolIcon />,
      bestFor: 'Enroll students from one homeroom into multiple available classes for their grade',
      steps: ['Select Homeroom Population', 'List Available Classrooms', 'Select Multiple Classrooms', 'Review & Confirm']
    },
    // {
    //   id: 'individual',
    //   title: 'Individual Enrollment',
    //   description: 'Enroll specific students in individual classes',
    //   icon: <PersonIcon />,
    //   bestFor: 'Special circumstances, accommodations, schedule conflicts',
    //   steps: ['Find Student', 'Review Schedule', 'Select Class', 'Check Requirements', 'Add Accommodations', 'Confirm']
    // }
  ];

  // Event handlers
  const handleWorkflowSelect = (workflowId: EnrollmentWorkflow) => {
    setSelectedWorkflow(workflowId);
    setShowWorkflowSelector(false);
  };

  const handleBackToSelector = () => {
    setSelectedWorkflow(null);
    setShowWorkflowSelector(true);
  };

  const handleWorkflowComplete = (results: { enrollmentCount: number; studentsAffected: number }) => {
    if (onEnrollmentComplete && selectedWorkflow) {
      onEnrollmentComplete({
        workflowType: selectedWorkflow,
        enrollmentCount: results.enrollmentCount,
        studentsAffected: results.studentsAffected
      });
    }
    onClose();
  };

  const handleClose = () => {
    setSelectedWorkflow(null);
    setShowWorkflowSelector(true);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '70vh', 
          maxHeight: '90vh',
          borderRadius: 2 
        },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SchoolIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={600}>
                  {selectedWorkflow ? 
                    workflowOptions.find(w => w.id === selectedWorkflow)?.title || 'Student Enrollment'
                    : 'Student Enrollment'
                  }
                </Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {students.length} student{students.length > 1 ? 's' : ''} • 
                  Grade {primaryGradeLevel}
                  {academicYearName && ` • ${academicYearName}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Back button when in workflow */}
            {!showWorkflowSelector && (
              <Tooltip title="Back to workflow selection">
                <IconButton onClick={handleBackToSelector}>
                  <BackIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 1 }}>
        {/* Students Preview */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <GroupsIcon sx={{ color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Selected Students
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {students.slice(0, 8).map(student => (
                  <Chip
                    key={student.id}
                    label={`${student.first_name} ${student.last_name}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {students.length > 8 && (
                  <Chip
                    label={`+${students.length - 8} more`}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        {/* Workflow Selector */}
        {showWorkflowSelector && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Choose Enrollment Method
            </Typography>
            
            <Stack spacing={3}>
              {workflowOptions.map((workflow) => (
                <Card 
                  key={workflow.id}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleWorkflowSelect(workflow.id)}
                >
                  <CardContent>
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 64,
                          height: 64
                        }}
                      >
                        <Box sx={{ color: theme.palette.primary.main, fontSize: 28 }}>
                          {workflow.icon}
                        </Box>
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {workflow.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {workflow.description}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight={600} gutterBottom>
                          Best for: {workflow.bestFor}
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Process Steps:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {workflow.steps.map((step, index) => (
                              <Chip 
                                key={index}
                                label={`${index + 1}. ${step}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NextIcon sx={{ color: theme.palette.action.active }} />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {/* Selected Workflow Component */}
        {!showWorkflowSelector && selectedWorkflow && (
          <Box>
            {selectedWorkflow === 'homeroom' && (
              <HomeroomEnrollmentWorkflow
                students={students}
                academicYearId={academicYearId}
                gradeLevel={primaryGradeLevel}
                onComplete={handleWorkflowComplete}
                onCancel={handleBackToSelector}
              />
            )}
            
            {selectedWorkflow === 'group' && (
              <HomeroomBulkEnrollmentWorkflow
                students={students}
                academicYearId={academicYearId}
                gradeLevel={primaryGradeLevel}
                onComplete={handleWorkflowComplete}
                onCancel={handleBackToSelector}
              />
            )}

            {/* Temporarily disabled until implemented */}
            {/* {selectedWorkflow === 'individual' && (
              <IndividualEnrollmentWorkflow
                students={students}
                academicYearId={academicYearId}
                gradeLevel={primaryGradeLevel}
                onComplete={handleWorkflowComplete}
                onCancel={handleBackToSelector}
              />
            )} */}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThreeTierEnrollmentManager;