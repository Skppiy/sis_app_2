// src/features/academics/components/StudentServiceAssignmentDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
  Alert,
  Chip,
  Box,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

import { useStudentServices } from '../hooks/useStudentServices';
import { formatSeverityLevel, getSeverityColor } from '../services/studentServices';
import type { StudentServiceAssignmentCreate } from '../services/studentServices';

interface StudentServiceAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  studentId: string;
  studentName?: string;
}

interface AssignmentFormData {
  tag_library_id: string;
  severity_level: 'MILD' | 'MODERATE' | 'INTENSIVE' | '';
  notes: string;
  start_date: string;
  end_date: string;
  review_date: string;
}

const StudentServiceAssignmentDialog: React.FC<StudentServiceAssignmentDialogProps> = ({
  open,
  onClose,
  studentId,
  studentName,
}) => {
  const {
    availableTags,
    createAssignment,
    isCreatingAssignment,
    assignmentCreateError,
  } = useStudentServices(studentId);

  const [formData, setFormData] = useState<AssignmentFormData>({
    tag_library_id: '',
    severity_level: '',
    notes: '',
    start_date: new Date().toISOString().split('T')[0], // Today
    end_date: '',
    review_date: '',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      const reviewDate = new Date();
      reviewDate.setMonth(reviewDate.getMonth() + 6); // 6 months from now

      setFormData({
        tag_library_id: '',
        severity_level: '',
        notes: '',
        start_date: today,
        end_date: '',
        review_date: reviewDate.toISOString().split('T')[0],
      });
    }
  }, [open]);

  const handleFormChange = (field: keyof AssignmentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    const submitData: StudentServiceAssignmentCreate = {
      student_id: studentId,
      tag_library_id: formData.tag_library_id,
      severity_level: formData.severity_level || undefined,
      notes: formData.notes.trim() || undefined,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      review_date: formData.review_date || undefined,
    };

    createAssignment(submitData);
  };

  const handleCancel = () => {
    onClose();
  };

  // Auto-close on successful creation
  useEffect(() => {
    if (!isCreatingAssignment && !assignmentCreateError && open && formData.tag_library_id) {
      // Small delay to show success state
      const timer = setTimeout(() => {
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isCreatingAssignment, assignmentCreateError, open, formData.tag_library_id, onClose]);

  const selectedTag = availableTags.find(tag => tag.id === formData.tag_library_id);
  const canSubmit = formData.tag_library_id && formData.start_date;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AssignmentIcon />
          <Typography variant="h6">
            Assign Student Service
            {studentName && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                for {studentName}
              </Typography>
            )}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Error Display */}
          {assignmentCreateError && (
            <Alert severity="error">
              {assignmentCreateError.message}
            </Alert>
          )}

          {/* Available Services Info */}
          {availableTags.length === 0 ? (
            <Alert severity="info">
              No additional services available for assignment. All active service tags are already assigned to this student.
            </Alert>
          ) : (
            <Alert severity="info">
              {availableTags.length} service{availableTags.length !== 1 ? 's' : ''} available for assignment.
            </Alert>
          )}

          {/* Service Selection */}
          <FormControl fullWidth required>
            <InputLabel>Service Type</InputLabel>
            <Select
              value={formData.tag_library_id}
              onChange={(e) => handleFormChange('tag_library_id', e.target.value)}
              label="Service Type"
              disabled={availableTags.length === 0}
            >
              {availableTags.map((tag) => (
                <MenuItem key={tag.id} value={tag.id}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                    <Typography>{tag.tag_name}</Typography>
                    <Chip
                      label={tag.tag_code}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Service Description */}
          {selectedTag?.description && (
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {selectedTag.description}
              </Typography>
            </Box>
          )}

          {/* Severity Level */}
          <FormControl fullWidth>
            <InputLabel>Severity Level</InputLabel>
            <Select
              value={formData.severity_level}
              onChange={(e) => handleFormChange('severity_level', e.target.value)}
              label="Severity Level"
            >
              <MenuItem value="">
                <em>Not specified</em>
              </MenuItem>
              <MenuItem value="MILD">
                <Chip
                  label="Mild"
                  size="small"
                  color={getSeverityColor('MILD')}
                  sx={{ mr: 1 }}
                />
                Mild support needed
              </MenuItem>
              <MenuItem value="MODERATE">
                <Chip
                  label="Moderate"
                  size="small"
                  color={getSeverityColor('MODERATE')}
                  sx={{ mr: 1 }}
                />
                Moderate support needed
              </MenuItem>
              <MenuItem value="INTENSIVE">
                <Chip
                  label="Intensive"
                  size="small"
                  color={getSeverityColor('INTENSIVE')}
                  sx={{ mr: 1 }}
                />
                Intensive support needed
              </MenuItem>
            </Select>
          </FormControl>

          {/* Date Fields */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => handleFormChange('start_date', e.target.value)}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) => handleFormChange('end_date', e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="Leave blank for ongoing service"
            />
          </Stack>

          <TextField
            label="Review Date"
            type="date"
            value={formData.review_date}
            onChange={(e) => handleFormChange('review_date', e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="When this assignment should be reviewed"
          />

          {/* Notes */}
          <TextField
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleFormChange('notes', e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Optional notes about this service assignment..."
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          startIcon={<CancelIcon />}
          disabled={isCreatingAssignment}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={!canSubmit || isCreatingAssignment || availableTags.length === 0}
        >
          {isCreatingAssignment ? 'Assigning...' : 'Assign Service'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentServiceAssignmentDialog;