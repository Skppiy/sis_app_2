// src/features/academics/components/SubjectSwapDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  SwapHoriz as SwapIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TeacherSwapCreate, TeacherSwapCreateSchema } from '@/schemas/academics';
import { 
  useEligibleSwapTeachers, 
  useSwapImpactAnalysis, 
  useCreateSwapRequest 
} from '../hooks/useTeacherSwaps';
import { useAuth } from '@/auth/AuthContext';
import { useSelectedYear } from '@/contexts/SelectedYearContext';

type Props = {
  open: boolean;
  onClose: () => void;
  requesterTeacherId: string;
  requesterSubjectId: string;
  requesterSubjectName: string;
  requesterTeacherName?: string;
};

const steps = ['Select Target Teacher', 'Choose Subject', 'Review Impact', 'Confirm Request'];

export default function SubjectSwapDialog({
  open,
  onClose,
  requesterTeacherId,
  requesterSubjectId,
  requesterSubjectName,
  requesterTeacherName,
}: Props) {
  const { user } = useAuth();
  const { selectedYear } = useSelectedYear();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTargetTeacher, setSelectedTargetTeacher] = useState<string>('');
  const [selectedTargetSubject, setSelectedTargetSubject] = useState<string>('');
  const [showImpactDetails, setShowImpactDetails] = useState(false);

  const createSwapMutation = useCreateSwapRequest();

  // Fetch eligible teachers
  const { 
    data: eligibleTeachers = [], 
    isLoading: loadingTeachers 
  } = useEligibleSwapTeachers(
    requesterTeacherId, 
    requesterSubjectId, 
    selectedYear?.id
  );

  // Get swap impact analysis when all selections are made
  const impactPayload = selectedTargetTeacher && selectedTargetSubject ? {
    requester_teacher_id: requesterTeacherId,
    target_teacher_id: selectedTargetTeacher,
    requester_subject_id: requesterSubjectId,
    target_subject_id: selectedTargetSubject,
  } : undefined;

  const { 
    data: impactAnalysis, 
    isLoading: loadingImpact 
  } = useSwapImpactAnalysis(impactPayload);

  const { register, handleSubmit, control, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(TeacherSwapCreateSchema),
    defaultValues: {
      target_teacher_id: '',
      requester_subject_id: requesterSubjectId,
      target_subject_id: '',
      reason: '',
    },
  });

  const selectedTargetTeacherData = eligibleTeachers.find(
    t => t.teacher.id === selectedTargetTeacher
  );

  const targetSubjectOptions = selectedTargetTeacherData?.compatible_subjects || [];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedTargetTeacher('');
      setSelectedTargetSubject('');
      setShowImpactDetails(false);
      reset();
    }
  }, [open, reset]);

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleTargetTeacherChange = (teacherId: string) => {
    setSelectedTargetTeacher(teacherId);
    setSelectedTargetSubject(''); // Reset subject selection
    if (activeStep === 0) {
      setActiveStep(1);
    }
  };

  const handleTargetSubjectChange = (subjectId: string) => {
    setSelectedTargetSubject(subjectId);
    if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const onSubmit = async (data: TeacherSwapCreate) => {
    try {
      await createSwapMutation.mutateAsync({
        target_teacher_id: selectedTargetTeacher,
        requester_subject_id: requesterSubjectId,
        target_subject_id: selectedTargetSubject,
        reason: data.reason,
      });
      
      onClose();
      // Success notification handled by the mutation
    } catch (error) {
      console.error('Failed to create swap request:', error);
    }
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1: return !!selectedTargetTeacher;
      case 2: return !!selectedTargetTeacher && !!selectedTargetSubject;
      case 3: return !!selectedTargetTeacher && !!selectedTargetSubject && !!impactAnalysis;
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Target Teacher
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Choose an elementary teacher to swap your {requesterSubjectName} assignment with.
            </Typography>
            
            {loadingTeachers ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : eligibleTeachers.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Eligible Teachers</AlertTitle>
                No other elementary teachers are available for subject swaps at this time.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {eligibleTeachers.map((entry) => (
                  <Card 
                    key={entry.teacher.id}
                    variant={selectedTargetTeacher === entry.teacher.id ? "outlined" : "elevation"}
                    sx={{ 
                      cursor: 'pointer',
                      bgcolor: selectedTargetTeacher === entry.teacher.id ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleTargetTeacherChange(entry.teacher.id)}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <PersonIcon color="primary" />
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {entry.teacher.first_name} {entry.teacher.last_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.teacher.is_specialist ?
                              `Specialist: ${entry.teacher.specialist_subject || 'General'}` :
                              `Grade ${entry.teacher.grade_level}`
                            } • {entry.compatible_subjects.length} compatible subjects
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          {entry.compatible_subjects.slice(0, 3).map((subject) => (
                            <Chip 
                              key={subject.id}
                              label={subject.name}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {entry.compatible_subjects.length > 3 && (
                            <Chip 
                              label={`+${entry.compatible_subjects.length - 3} more`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          )}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose Subject to Swap
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select which subject from {selectedTargetTeacherData?.teacher.first_name} {selectedTargetTeacherData?.teacher.last_name} you want to receive.
            </Typography>

            {targetSubjectOptions.length === 0 ? (
              <Alert severity="warning">
                <AlertTitle>No Compatible Subjects</AlertTitle>
                This teacher doesn't have any subjects compatible with your {requesterSubjectName} assignment.
              </Alert>
            ) : (
              <Stack spacing={1}>
                {targetSubjectOptions.map((subject) => (
                  <Card 
                    key={subject.id}
                    variant={selectedTargetSubject === subject.id ? "outlined" : "elevation"}
                    sx={{ 
                      cursor: 'pointer',
                      bgcolor: selectedTargetSubject === subject.id ? 'action.selected' : 'background.paper',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleTargetSubjectChange(subject.id)}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <SchoolIcon color="primary" />
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {subject.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Grade {subject.grade_level} • {subject.enrollment_count} students
                          </Typography>
                        </Box>
                        <Chip 
                          label={subject.code}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Swap Impact
            </Typography>
            
            {loadingImpact ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : !impactAnalysis ? (
              <Alert severity="error">
                Unable to load impact analysis. Please try again.
              </Alert>
            ) : (
              <Stack spacing={3}>
                {/* Swap Summary */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Swap Summary
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">You Give</Typography>
                          <Chip label={requesterSubjectName} color="primary" />
                        </Box>
                        <SwapIcon color="action" fontSize="large" />
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary">You Receive</Typography>
                          <Chip 
                            label={targetSubjectOptions.find(s => s.id === selectedTargetSubject)?.name} 
                            color="secondary" 
                          />
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>

                {/* Impact Analysis */}
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="subtitle1" fontWeight="medium">
                        Student Impact Analysis
                      </Typography>
                      <IconButton onClick={() => setShowImpactDetails(!showImpactDetails)}>
                        {showImpactDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Stack>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Box>
                        <Typography variant="h4" color="primary.main">
                          {impactAnalysis.requester_impact.net_change > 0 ? '+' : ''}{impactAnalysis.requester_impact.net_change}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Your Student Change
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h4" color="secondary.main">
                          {impactAnalysis.target_impact.net_change > 0 ? '+' : ''}{impactAnalysis.target_impact.net_change}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Their Student Change
                        </Typography>
                      </Box>
                    </Stack>

                    <Collapse in={showImpactDetails}>
                      <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        <TableContainer component={Paper} variant="outlined">
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Teacher</TableCell>
                                <TableCell align="right">Current Students</TableCell>
                                <TableCell align="right">Students Gained</TableCell>
                                <TableCell align="right">Students Lost</TableCell>
                                <TableCell align="right">Net Change</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                <TableCell>You ({requesterTeacherName})</TableCell>
                                <TableCell align="right">{impactAnalysis.requester_impact.current_students}</TableCell>
                                <TableCell align="right">+{impactAnalysis.requester_impact.students_gained}</TableCell>
                                <TableCell align="right">-{impactAnalysis.requester_impact.students_lost}</TableCell>
                                <TableCell align="right">
                                  <Typography color={impactAnalysis.requester_impact.net_change >= 0 ? 'success.main' : 'error.main'}>
                                    {impactAnalysis.requester_impact.net_change > 0 ? '+' : ''}{impactAnalysis.requester_impact.net_change}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>
                                  {selectedTargetTeacherData?.teacher.first_name} {selectedTargetTeacherData?.teacher.last_name}
                                </TableCell>
                                <TableCell align="right">{impactAnalysis.target_impact.current_students}</TableCell>
                                <TableCell align="right">+{impactAnalysis.target_impact.students_gained}</TableCell>
                                <TableCell align="right">-{impactAnalysis.target_impact.students_lost}</TableCell>
                                <TableCell align="right">
                                  <Typography color={impactAnalysis.target_impact.net_change >= 0 ? 'success.main' : 'error.main'}>
                                    {impactAnalysis.target_impact.net_change > 0 ? '+' : ''}{impactAnalysis.target_impact.net_change}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>

                {/* Warnings/Conflicts */}
                {impactAnalysis.schedule_conflicts.length > 0 && (
                  <Alert severity="warning">
                    <AlertTitle>Potential Issues Detected</AlertTitle>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {impactAnalysis.schedule_conflicts.map((conflict, index) => (
                        <Typography key={index} variant="body2">
                          • {conflict.description}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                )}

                {/* Grade Compatibility */}
                {!impactAnalysis.grade_compatibility.is_compatible && (
                  <Alert severity="error">
                    <AlertTitle>Grade Compatibility Issue</AlertTitle>
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      {impactAnalysis.grade_compatibility.warnings.map((warning, index) => (
                        <Typography key={index} variant="body2">
                          • {warning}
                        </Typography>
                      ))}
                    </Stack>
                  </Alert>
                )}
              </Stack>
            )}
          </Box>
        );

      case 3:
        return (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Provide Swap Reason
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Explain why you want to make this subject swap. This will help the target teacher and administrators understand your request.
              </Typography>

              <TextField
                {...register('reason')}
                label="Reason for Swap Request"
                multiline
                rows={4}
                fullWidth
                placeholder="Please explain why you want to swap subjects (e.g., teaching expertise, student needs, curriculum alignment, etc.)"
                error={!!errors.reason}
                helperText={errors.reason?.message}
                sx={{ mb: 3 }}
              />

              {/* Final Summary */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Request Summary
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Target Teacher:</Typography>
                      <Typography variant="body1">
                        {selectedTargetTeacherData?.teacher.first_name} {selectedTargetTeacherData?.teacher.last_name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Subject Exchange:</Typography>
                      <Typography variant="body1">
                        Your {requesterSubjectName} ↔ Their {targetSubjectOptions.find(s => s.id === selectedTargetSubject)?.name}
                      </Typography>
                    </Box>
                    {impactAnalysis && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Student Impact:</Typography>
                        <Typography variant="body1">
                          You: {impactAnalysis.requester_impact.net_change > 0 ? '+' : ''}{impactAnalysis.requester_impact.net_change} students, 
                          They: {impactAnalysis.target_impact.net_change > 0 ? '+' : ''}{impactAnalysis.target_impact.net_change} students
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: 600 }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <SwapIcon color="primary" />
          <Box>
            <Typography variant="h6">Request Subject Swap</Typography>
            <Typography variant="body2" color="text.secondary">
              Swap your {requesterSubjectName} assignment with another teacher
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={!canProceedToStep(activeStep + 1)}
          >
            Next
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={handleSubmit(onSubmit)}
            disabled={createSwapMutation.isPending || !canProceedToStep(activeStep)}
          >
            {createSwapMutation.isPending ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}