// src/features/academics/pages/StudentServicesPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Alert,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Grid,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Public as PublicIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { useStudentServiceTags } from '../hooks/useStudentServices';
import type { StudentServiceTag, StudentServiceTagCreate } from '../services/studentServices';

interface StudentServiceTagFormData {
  tag_name: string;
  tag_code: string;
  description: string;
  school_id?: string;
}

const StudentServicesPage: React.FC = () => {
  const {
    tags,
    isLoading,
    error,
    createTag,
    updateTag,
    deactivateTag,
    isCreating,
    isUpdating,
    isDeactivating,
    createError,
    updateError,
    deactivateError,
  } = useStudentServiceTags();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<StudentServiceTag | null>(null);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<StudentServiceTag | null>(null);

  const [formData, setFormData] = useState<StudentServiceTagFormData>({
    tag_name: '',
    tag_code: '',
    description: '',
    school_id: '',
  });

  const handleCreateOpen = () => {
    setFormData({
      tag_name: '',
      tag_code: '',
      description: '',
      school_id: '',
    });
    setCreateDialogOpen(true);
  };

  const handleEditOpen = (tag: StudentServiceTag) => {
    setFormData({
      tag_name: tag.tag_name,
      tag_code: tag.tag_code,
      description: tag.description || '',
      school_id: tag.school_id || '',
    });
    setEditingTag(tag);
  };

  const handleFormChange = (field: keyof StudentServiceTagFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Auto-generate code from name if creating new tag
      ...(field === 'tag_name' && !editingTag ? {
        tag_code: value.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20)
      } : {})
    }));
  };

  const handleSubmit = () => {
    const submitData: any = {
      tag_name: formData.tag_name.trim(),
      tag_code: formData.tag_code.trim(),
    };

    // Only add description if it has a value
    if (formData.description.trim()) {
      submitData.description = formData.description.trim();
    }

    // Only add school_id if it's a valid UUID (not empty string or 'district')
    if (formData.school_id && formData.school_id !== 'district' && formData.school_id.trim()) {
      submitData.school_id = formData.school_id;
    }

    if (editingTag) {
      updateTag({ id: editingTag.id, data: submitData });
      setEditingTag(null);
    } else {
      createTag(submitData);
      setCreateDialogOpen(false);
    }
  };

  const handleDelete = (tag: StudentServiceTag) => {
    setDeleteConfirmTag(tag);
  };

  const confirmDelete = () => {
    if (deleteConfirmTag) {
      deactivateTag(deleteConfirmTag.id);
      setDeleteConfirmTag(null);
    }
  };

  const handleCancel = () => {
    setCreateDialogOpen(false);
    setEditingTag(null);
    setFormData({
      tag_name: '',
      tag_code: '',
      description: '',
      school_id: '',
    });
  };

  // Group tags by active/inactive
  const activeTags = tags.filter(tag => tag.is_active);
  const inactiveTags = tags.filter(tag => !tag.is_active);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Student Services
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage accommodation tags and student service categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateOpen}
          size="large"
        >
          Add Service Tag
        </Button>
      </Stack>

      {/* Error Display */}
      {(error || createError || updateError || deactivateError) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.message || createError?.message || updateError?.message || deactivateError?.message}
        </Alert>
      )}

      {/* Active Tags Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Active Service Tags ({activeTags.length})
        </Typography>

        {activeTags.length === 0 ? (
          <Alert severity="info">
            No active service tags found. Create your first service tag to get started.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {activeTags.map((tag) => (
              <Grid item xs={12} sm={6} md={4} key={tag.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h3">
                        {tag.tag_name}
                      </Typography>
                      <Chip
                        icon={tag.school_id ? <SchoolIcon /> : <PublicIcon />}
                        label={tag.school_id ? 'School' : 'District'}
                        size="small"
                        color={tag.school_id ? 'primary' : 'default'}
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Code: {tag.tag_code}
                    </Typography>

                    {tag.description && (
                      <Typography variant="body2" color="text.secondary">
                        {tag.description}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => handleEditOpen(tag)}
                      disabled={isUpdating}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(tag)}
                      disabled={isDeactivating}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Inactive Tags Section */}
      {inactiveTags.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Inactive Service Tags ({inactiveTags.length})
          </Typography>

          <Grid container spacing={2}>
            {inactiveTags.map((tag) => (
              <Grid item xs={12} sm={6} md={4} key={tag.id}>
                <Card variant="outlined" sx={{ opacity: 0.6 }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h3">
                        {tag.tag_name}
                      </Typography>
                      <Chip
                        label="Inactive"
                        size="small"
                        color="default"
                      />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Code: {tag.tag_code}
                    </Typography>

                    {tag.description && (
                      <Typography variant="body2" color="text.secondary">
                        {tag.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={createDialogOpen || !!editingTag}
        onClose={handleCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTag ? 'Edit Service Tag' : 'Create Service Tag'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Service Name"
              value={formData.tag_name}
              onChange={(e) => handleFormChange('tag_name', e.target.value)}
              fullWidth
              required
              placeholder="e.g., Speech Therapy"
            />

            <TextField
              label="Service Code"
              value={formData.tag_code}
              onChange={(e) => handleFormChange('tag_code', e.target.value)}
              fullWidth
              required
              placeholder="e.g., SPEECH"
              helperText="Short code for internal use (auto-generated from name)"
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Optional description of this service"
            />

            <FormControl fullWidth>
              <InputLabel>Scope</InputLabel>
              <Select
                value={formData.school_id || 'district'}
                onChange={(e) => handleFormChange('school_id', e.target.value === 'district' ? '' : e.target.value)}
                label="Scope"
              >
                <MenuItem value="district">District-wide</MenuItem>
                {/* For now, default to district-wide only until school selection is implemented */}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCancel} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!formData.tag_name.trim() || !formData.tag_code.trim() || isCreating || isUpdating}
          >
            {editingTag ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmTag}
        onClose={() => setDeleteConfirmTag(null)}
        maxWidth="sm"
      >
        <DialogTitle>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate "{deleteConfirmTag?.tag_name}"?
            This will make it unavailable for new assignments but preserve existing student assignments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmTag(null)}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isDeactivating}
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentServicesPage;