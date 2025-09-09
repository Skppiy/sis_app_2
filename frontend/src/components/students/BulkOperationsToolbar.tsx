import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormControlLabel,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Assignment as ReportIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PersonOff as InactivateIcon,
  PersonAddAlt as ActivateIcon,
} from '@mui/icons-material';
import { Student, GRADE_LEVELS } from '@/schemas/students';

interface BulkOperationsToolbarProps {
  selectedStudents: Student[];
  totalStudents: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkEnroll?: (studentIds: string[], classroomId: string) => void;
  onBulkActivate?: (studentIds: string[]) => void;
  onBulkInactivate?: (studentIds: string[]) => void;
  onBulkDelete?: (studentIds: string[]) => void;
  onBulkExport?: (studentIds: string[], format: 'csv' | 'pdf') => void;
  onBulkEmail?: (studentIds: string[]) => void;
  onBulkSms?: (studentIds: string[]) => void;
  onBulkReport?: (studentIds: string[], reportType: string) => void;
  availableClassrooms?: Array<{ id: string; name: string; subject?: { name: string } }>;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  selectedStudents,
  totalStudents,
  onClearSelection,
  onSelectAll,
  onBulkEnroll,
  onBulkActivate,
  onBulkInactivate,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  onBulkSms,
  onBulkReport,
  availableClassrooms = [],
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [reportType, setReportType] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');

  const selectedCount = selectedStudents.length;
  const isAllSelected = selectedCount === totalStudents && totalStudents > 0;
  const activeCount = selectedStudents.filter(s => s.is_active).length;
  const inactiveCount = selectedStudents.filter(s => !s.is_active).length;

  if (selectedCount === 0) {
    return null;
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBulkEnroll = () => {
    if (selectedClassroom) {
      onBulkEnroll?.(selectedStudents.map(s => s.id), selectedClassroom);
      setEnrollDialogOpen(false);
      setSelectedClassroom('');
    }
  };

  const handleBulkDelete = () => {
    onBulkDelete?.(selectedStudents.map(s => s.id));
    setDeleteDialogOpen(false);
  };

  const handleBulkReport = () => {
    if (reportType) {
      onBulkReport?.(selectedStudents.map(s => s.id), reportType);
      setReportDialogOpen(false);
      setReportType('');
    }
  };

  return (
    <>
      <Fade in={selectedCount > 0}>
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            p: 2,
            minWidth: 600,
            maxWidth: '90vw',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            borderRadius: 3,
            boxShadow: `0 12px 36px ${alpha(theme.palette.primary.main, 0.4)}`,
            border: `1px solid ${alpha('#fff', 0.2)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={3}>
            {/* Selection Info */}
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircleIcon sx={{ fontSize: 24 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedCount} Student{selectedCount > 1 ? 's' : ''} Selected
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {activeCount} Active • {inactiveCount} Inactive
                    </Typography>
                    {!isAllSelected && (
                      <>
                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                          •
                        </Typography>
                        <Button
                          size="small"
                          onClick={onSelectAll}
                          sx={{
                            color: 'white',
                            textDecoration: 'underline',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            p: 0,
                          }}
                        >
                          Select All ({totalStudents})
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>

            {/* Quick Actions */}
            <Stack direction="row" spacing={1}>
              {/* Bulk Enroll */}
              {onBulkEnroll && availableClassrooms.length > 0 && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setEnrollDialogOpen(true)}
                  sx={{
                    bgcolor: alpha('#fff', 0.2),
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.3),
                    },
                  }}
                >
                  Enroll
                </Button>
              )}

              {/* Bulk Activate/Inactivate */}
              {inactiveCount > 0 && onBulkActivate && (
                <Button
                  variant="contained"
                  startIcon={<ActivateIcon />}
                  onClick={() => onBulkActivate(selectedStudents.filter(s => !s.is_active).map(s => s.id))}
                  sx={{
                    bgcolor: alpha(theme.palette.success.main, 0.8),
                    '&:hover': {
                      bgcolor: theme.palette.success.main,
                    },
                  }}
                >
                  Activate
                </Button>
              )}

              {activeCount > 0 && onBulkInactivate && (
                <Button
                  variant="contained"
                  startIcon={<InactivateIcon />}
                  onClick={() => onBulkInactivate(selectedStudents.filter(s => s.is_active).map(s => s.id))}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.8),
                    '&:hover': {
                      bgcolor: theme.palette.warning.main,
                    },
                  }}
                >
                  Inactivate
                </Button>
              )}

              {/* More Actions Menu */}
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  color: 'white',
                  bgcolor: alpha('#fff', 0.1),
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.2),
                  },
                }}
              >
                <MoreVertIcon />
              </IconButton>

              {/* Clear Selection */}
              <IconButton
                onClick={onClearSelection}
                sx={{
                  color: 'white',
                  bgcolor: alpha(theme.palette.error.main, 0.3),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.5),
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      </Fade>

      {/* More Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: { mt: 1, minWidth: 220 },
        }}
      >
        {/* Communication */}
        {onBulkEmail && (
          <MenuItem onClick={() => { onBulkEmail(selectedStudents.map(s => s.id)); handleMenuClose(); }}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Email Contacts</ListItemText>
          </MenuItem>
        )}

        {onBulkSms && (
          <MenuItem onClick={() => { onBulkSms(selectedStudents.map(s => s.id)); handleMenuClose(); }}>
            <ListItemIcon>
              <SmsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Send SMS</ListItemText>
          </MenuItem>
        )}

        <Divider />

        {/* Export */}
        {onBulkExport && (
          <>
            <MenuItem onClick={() => { onBulkExport(selectedStudents.map(s => s.id), 'csv'); handleMenuClose(); }}>
              <ListItemIcon>
                <ExportIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export CSV</ListItemText>
            </MenuItem>

            <MenuItem onClick={() => { onBulkExport(selectedStudents.map(s => s.id), 'pdf'); handleMenuClose(); }}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Export PDF</ListItemText>
            </MenuItem>
          </>
        )}

        {/* Reports */}
        {onBulkReport && (
          <MenuItem onClick={() => { setReportDialogOpen(true); handleMenuClose(); }}>
            <ListItemIcon>
              <ReportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Generate Report</ListItemText>
          </MenuItem>
        )}

        <Divider />

        {/* Dangerous Actions */}
        {onBulkDelete && (
          <MenuItem 
            onClick={() => { setDeleteDialogOpen(true); handleMenuClose(); }}
            sx={{ color: theme.palette.error.main }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete Selected</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Bulk Enroll Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enroll Selected Students</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              You are about to enroll {selectedCount} student{selectedCount > 1 ? 's' : ''} in a classroom.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Select Classroom</InputLabel>
              <Select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                label="Select Classroom"
              >
                {availableClassrooms.map((classroom) => (
                  <MenuItem key={classroom.id} value={classroom.id}>
                    <Stack>
                      <Typography variant="body1">{classroom.name}</Typography>
                      {classroom.subject && (
                        <Typography variant="body2" color="text.secondary">
                          {classroom.subject.name}
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Selected Students Preview */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Students to be enrolled:
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {selectedStudents.slice(0, 5).map((student) => (
                  <Chip
                    key={student.id}
                    label={`${student.first_name} ${student.last_name}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
                {selectedStudents.length > 5 && (
                  <Chip
                    label={`+${selectedStudents.length - 5} more`}
                    size="small"
                    color="primary"
                  />
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkEnroll}
            variant="contained"
            disabled={!selectedClassroom}
            startIcon={<PersonAddIcon />}
          >
            Enroll Students
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Selected Students</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Alert severity="error">
              This will permanently delete {selectedCount} student{selectedCount > 1 ? 's' : ''} and all their enrollments. This action cannot be undone.
            </Alert>

            <Typography variant="body2">
              Students to be deleted:
            </Typography>
            <Stack spacing={1} sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {selectedStudents.map((student) => (
                <Box key={student.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">
                    {student.first_name} {student.last_name} ({student.current_grade_level})
                  </Typography>
                  {student.student_id && (
                    <Chip label={student.student_id} size="small" variant="outlined" />
                  )}
                </Box>
              ))}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete Students
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Report</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              Generate a report for {selectedCount} selected student{selectedCount > 1 ? 's' : ''}.
            </Alert>

            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="contact_list">Contact List</MenuItem>
                <MenuItem value="enrollment_summary">Enrollment Summary</MenuItem>
                <MenuItem value="grade_roster">Grade Level Roster</MenuItem>
                <MenuItem value="emergency_contacts">Emergency Contacts</MenuItem>
                <MenuItem value="special_needs">Special Needs Summary</MenuItem>
                <MenuItem value="attendance_report">Attendance Report</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkReport}
            variant="contained"
            disabled={!reportType}
            startIcon={<ReportIcon />}
          >
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkOperationsToolbar;