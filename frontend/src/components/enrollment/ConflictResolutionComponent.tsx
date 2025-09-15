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
  ListItemSecondaryAction,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  Build as FixIcon,
  Visibility as ViewIcon,
  AutoFixHigh as AutoFixIcon,
  Settings as ManualIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  PlayArrow as ResolveIcon,
} from '@mui/icons-material';

import type { EnrollmentConflict } from '@/schemas/threeTierEnrollment';
import { 
  CONFLICT_SEVERITY_COLORS, 
  ConflictSeverity, 
  ConflictType 
} from '@/schemas/threeTierEnrollment';
import { useConflictResolution } from '@/features/enrollment/hooks/useThreeTierEnrollment';

interface ConflictResolutionComponentProps {
  academicYearId: string;
  gradeLevel?: string;
  conflicts: Record<string, EnrollmentConflict[]>;
  onClose: () => void;
  onResolve: () => void;
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
      id={`conflict-tabpanel-${index}`}
      aria-labelledby={`conflict-tab-${index}`}
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

export const ConflictResolutionComponent: React.FC<ConflictResolutionComponentProps> = ({
  academicYearId,
  gradeLevel,
  conflicts,
  onClose,
  onResolve,
}) => {
  const theme = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [selectedConflictType, setSelectedConflictType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showAutoResolvableOnly, setShowAutoResolvableOnly] = useState(false);

  // Hooks
  const {
    selectedConflicts,
    resolutionStrategy,
    setResolutionStrategy,
    selectConflict,
    clearSelection,
    resolveConflicts
  } = useConflictResolution();

  // Process conflicts
  const allConflicts = useMemo(() => {
    return Object.entries(conflicts).flatMap(([type, conflictList]) => 
      conflictList.map(conflict => ({ ...conflict, category: type }))
    );
  }, [conflicts]);

  // Filter conflicts
  const filteredConflicts = useMemo(() => {
    return allConflicts.filter(conflict => {
      const typeMatch = selectedConflictType === 'all' || conflict.type === selectedConflictType;
      const severityMatch = selectedSeverity === 'all' || conflict.severity === selectedSeverity;
      const autoResolveMatch = !showAutoResolvableOnly || conflict.auto_resolvable;
      
      return typeMatch && severityMatch && autoResolveMatch;
    });
  }, [allConflicts, selectedConflictType, selectedSeverity, showAutoResolvableOnly]);

  // Group conflicts by category
  const conflictsByCategory = useMemo(() => {
    const grouped: Record<string, EnrollmentConflict[]> = {};
    filteredConflicts.forEach(conflict => {
      if (!grouped[conflict.category]) {
        grouped[conflict.category] = [];
      }
      grouped[conflict.category].push(conflict);
    });
    return grouped;
  }, [filteredConflicts]);

  // Statistics
  const conflictStats = useMemo(() => {
    const total = allConflicts.length;
    const critical = allConflicts.filter(c => c.severity === 'CRITICAL').length;
    const high = allConflicts.filter(c => c.severity === 'HIGH').length;
    const medium = allConflicts.filter(c => c.severity === 'MEDIUM').length;
    const low = allConflicts.filter(c => c.severity === 'LOW').length;
    const autoResolvable = allConflicts.filter(c => c.auto_resolvable).length;
    const selected = selectedConflicts.length;
    
    return {
      total,
      critical,
      high,
      medium,
      low,
      autoResolvable,
      selected,
      manualReview: total - autoResolvable
    };
  }, [allConflicts, selectedConflicts.length]);

  // Get conflict severity icon and color
  const getConflictSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <ErrorIcon sx={{ color: theme.palette.error.main }} />;
      case 'HIGH':
        return <WarningIcon sx={{ color: theme.palette.error.main }} />;
      case 'MEDIUM':
        return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'LOW':
        return <InfoIcon sx={{ color: theme.palette.info.main }} />;
      default:
        return <InfoIcon />;
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle resolve selected
  const handleResolveSelected = async () => {
    if (selectedConflicts.length > 0) {
      try {
        await resolveConflicts.mutateAsync(selectedConflicts);
        onResolve();
      } catch (error) {
        console.error('Failed to resolve conflicts:', error);
      }
    }
  };

  // Handle resolve all auto-resolvable
  const handleResolveAllAuto = async () => {
    const autoResolvableConflicts = allConflicts.filter(c => c.auto_resolvable);
    if (autoResolvableConflicts.length > 0) {
      try {
        await resolveConflicts.mutateAsync(autoResolvableConflicts);
        onResolve();
      } catch (error) {
        console.error('Failed to resolve auto-resolvable conflicts:', error);
      }
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh', maxHeight: '90vh' },
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Enrollment Conflict Resolution
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {conflictStats.total} conflicts detected • {conflictStats.selected} selected
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 3 }}>
        {/* Statistics Overview */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.error.main, 0.05) }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Conflict Overview
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Chip 
              label={`${conflictStats.total} Total`} 
              color="default" 
            />
            <Chip 
              label={`${conflictStats.critical} Critical`} 
              color="error" 
            />
            <Chip 
              label={`${conflictStats.high} High`} 
              color="error" 
              variant="outlined"
            />
            <Chip 
              label={`${conflictStats.medium} Medium`} 
              color="warning" 
            />
            <Chip 
              label={`${conflictStats.low} Low`} 
              color="info" 
            />
            <Chip 
              label={`${conflictStats.autoResolvable} Auto-Resolvable`} 
              color="success" 
              icon={<AutoFixIcon />}
            />
            <Chip 
              label={`${conflictStats.manualReview} Manual Review`} 
              color="secondary" 
              icon={<ManualIcon />}
            />
          </Stack>
        </Paper>

        {/* Filters and Actions */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Conflict Type</InputLabel>
              <Select
                value={selectedConflictType}
                onChange={(e) => setSelectedConflictType(e.target.value)}
                label="Conflict Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="SCHEDULE_CONFLICT">Schedule Conflict</MenuItem>
                <MenuItem value="CAPACITY_EXCEEDED">Capacity Exceeded</MenuItem>
                <MenuItem value="DUPLICATE_ENROLLMENT">Duplicate Enrollment</MenuItem>
                <MenuItem value="GRADE_MISMATCH">Grade Mismatch</MenuItem>
                <MenuItem value="PREREQUISITE_MISSING">Missing Prerequisites</MenuItem>
                <MenuItem value="STUDENT_NOT_FOUND">Student Not Found</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Severity</InputLabel>
              <Select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                label="Severity"
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="LOW">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Resolution Strategy</InputLabel>
              <Select
                value={resolutionStrategy}
                onChange={(e) => setResolutionStrategy(e.target.value as any)}
                label="Resolution Strategy"
              >
                <MenuItem value="AUTO">Auto-Resolve</MenuItem>
                <MenuItem value="MANUAL">Manual Review</MenuItem>
                <MenuItem value="SKIP">Skip Resolution</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flex: 1 }} />

            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowAutoResolvableOnly(!showAutoResolvableOnly)}
              startIcon={<FilterIcon />}
              color={showAutoResolvableOnly ? 'primary' : 'inherit'}
            >
              Auto-Resolvable Only
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={handleResolveAllAuto}
              startIcon={<AutoFixIcon />}
              disabled={conflictStats.autoResolvable === 0 || resolveConflicts.isPending}
              color="success"
            >
              Resolve All Auto ({conflictStats.autoResolvable})
            </Button>
          </Stack>
        </Paper>

        {/* Conflicts List */}
        <Box>
          {Object.keys(conflictsByCategory).length === 0 ? (
            <Alert severity="success">
              <Typography variant="subtitle2" gutterBottom>
                No conflicts found matching your filters
              </Typography>
              <Typography variant="body2">
                All enrollment conflicts have been resolved or filtered out.
              </Typography>
            </Alert>
          ) : (
            <Stack spacing={2}>
              {Object.entries(conflictsByCategory).map(([category, categoryConflicts]) => (
                <Accordion key={category} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                      <Typography variant="h6" fontWeight={600}>
                        {category.replace('_', ' ')} Conflicts
                      </Typography>
                      <Chip 
                        label={`${categoryConflicts.length} conflicts`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {categoryConflicts.map((conflict, index) => {
                        const isSelected = selectedConflicts.some(sc => 
                          sc.student_id === conflict.student_id && 
                          sc.subject_name === conflict.subject_name &&
                          sc.type === conflict.type
                        );
                        
                        return (
                          <ListItem
                            key={`${category}-${index}`}
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                            }}
                          >
                            <ListItemIcon>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => selectConflict(conflict)}
                                disabled={resolveConflicts.isPending}
                              />
                            </ListItemIcon>
                            
                            <ListItemIcon>
                              {getConflictSeverityIcon(conflict.severity)}
                            </ListItemIcon>
                            
                            <ListItemText
                              primary={
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography variant="subtitle2" fontWeight={500}>
                                    {conflict.message}
                                  </Typography>
                                  {conflict.auto_resolvable && (
                                    <Chip 
                                      label="Auto-Resolvable" 
                                      size="small" 
                                      color="success" 
                                      icon={<AutoFixIcon />}
                                    />
                                  )}
                                </Stack>
                              }
                              secondary={
                                <Stack spacing={0.5}>
                                  {conflict.student_name && (
                                    <Typography variant="caption" color="text.secondary">
                                      Student: {conflict.student_name}
                                    </Typography>
                                  )}
                                  {conflict.subject_name && (
                                    <Typography variant="caption" color="text.secondary">
                                      Subject: {conflict.subject_name}
                                    </Typography>
                                  )}
                                  {conflict.teacher_name && (
                                    <Typography variant="caption" color="text.secondary">
                                      Teacher: {conflict.teacher_name}
                                    </Typography>
                                  )}
                                  {conflict.recommended_action && (
                                    <Typography variant="caption" color="primary.main">
                                      Recommended: {conflict.recommended_action}
                                    </Typography>
                                  )}
                                </Stack>
                              }
                            />
                            
                            <ListItemSecondaryAction>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  label={conflict.severity}
                                  size="small"
                                  color={CONFLICT_SEVERITY_COLORS[conflict.severity as keyof typeof CONFLICT_SEVERITY_COLORS] as any}
                                />
                              </Stack>
                            </ListItemSecondaryAction>
                          </ListItem>
                        );
                      })}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          )}
        </Box>

        {/* Resolution Progress */}
        {resolveConflicts.isPending && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Resolving {selectedConflicts.length} conflicts...
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button onClick={clearSelection} disabled={selectedConflicts.length === 0}>
          Clear Selection
        </Button>
        
        <Button onClick={onClose}>
          Close
        </Button>
        
        <Box sx={{ flex: 1 }} />
        
        <Button
          onClick={handleResolveSelected}
          variant="contained"
          disabled={selectedConflicts.length === 0 || resolveConflicts.isPending}
          startIcon={<ResolveIcon />}
          color="warning"
        >
          Resolve Selected ({selectedConflicts.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
};