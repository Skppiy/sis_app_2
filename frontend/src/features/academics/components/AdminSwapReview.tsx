// src/features/academics/components/AdminSwapReview.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  AlertTitle,
  Tooltip,
  Badge,
  Collapse,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp as ImpactIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdminSwapReview, AdminSwapReviewSchema, getSwapStatusColor, getSwapStatusText } from '@/schemas/academics';
import { useAdminSwaps, useReviewSwap, formatTeacherName } from '../hooks/useTeacherSwaps';
import type { SwapRequest } from '../services/teacherSwaps';

export default function AdminSwapReview() {
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data: swaps = [], isLoading, error } = useAdminSwaps();
  const reviewMutation = useReviewSwap();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(AdminSwapReviewSchema),
    defaultValues: {
      decision: 'APPROVE' as const,
      admin_comments: '',
    },
  });

  const watchedDecision = watch('decision');

  const toggleRowExpansion = (swapId: string) => {
    const newExpanded = new Set(expandedRows);
    if (expandedRows.has(swapId)) {
      newExpanded.delete(swapId);
    } else {
      newExpanded.add(swapId);
    }
    setExpandedRows(newExpanded);
  };

  const toggleBulkSelection = (swapId: string) => {
    const newSelected = new Set(bulkSelected);
    if (bulkSelected.has(swapId)) {
      newSelected.delete(swapId);
    } else {
      newSelected.add(swapId);
    }
    setBulkSelected(newSelected);
  };

  const selectAllSwaps = () => {
    const eligibleSwaps = swaps.filter(swap => swap.status === 'PENDING_ADMIN_APPROVAL');
    setBulkSelected(new Set(eligibleSwaps.map(swap => swap.id)));
  };

  const clearSelection = () => {
    setBulkSelected(new Set());
  };

  const handleReviewClick = (swap: SwapRequest, decision: 'APPROVE' | 'REJECT') => {
    setSelectedSwap(swap);
    setReviewDialogOpen(true);
    reset({ 
      decision, 
      admin_comments: '' 
    });
  };

  const handleViewDetails = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setDetailsDialogOpen(true);
  };

  const onSubmitReview = async (data: AdminSwapReview) => {
    if (!selectedSwap) return;
    
    try {
      await reviewMutation.mutateAsync({
        swapId: selectedSwap.id,
        decision: data.decision,
        adminComments: data.admin_comments,
      });
      setReviewDialogOpen(false);
      setSelectedSwap(null);
    } catch (error) {
      console.error('Failed to review swap request:', error);
    }
  };

  const handleBulkApprove = async () => {
    if (bulkSelected.size === 0) return;
    
    const confirmMessage = `Are you sure you want to approve ${bulkSelected.size} swap request(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const swapId of bulkSelected) {
        await reviewMutation.mutateAsync({
          swapId,
          decision: 'APPROVE',
          adminComments: 'Bulk approved by administrator',
        });
      }
      setBulkSelected(new Set());
    } catch (error) {
      console.error('Failed to bulk approve swap requests:', error);
    }
  };

  const getDaysOld = (dateString: string): number => {
    const requestDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - requestDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (daysOld: number): 'default' | 'warning' | 'error' => {
    if (daysOld >= 7) return 'error';
    if (daysOld >= 3) return 'warning';
    return 'default';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CircularProgress size={20} />
            <Typography variant="body2">Loading swap requests...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error Loading Swap Requests</AlertTitle>
        Unable to load pending swap requests. Please try again.
      </Alert>
    );
  }

  const pendingSwaps = swaps.filter(swap => swap.status === 'PENDING_ADMIN_APPROVAL');
  const recentSwaps = swaps.filter(swap => 
    swap.status === 'APPROVED' || swap.status === 'REJECTED'
  ).slice(0, 10);

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header with Statistics */}
        <Box>
          <Typography variant="h5" gutterBottom>
            Subject Swap Administration
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ flex: '1 1 200px' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AdminIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{pendingSwaps.length}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pending Review
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: '1 1 200px' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <WarningIcon color="warning" />
                  <Box>
                    <Typography variant="h6">
                      {pendingSwaps.filter(s => getDaysOld(s.requested_at) >= 3).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Overdue (3+ days)
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: '1 1 200px' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SwapIcon color="success" />
                  <Box>
                    <Typography variant="h6">
                      {swaps.filter(s => s.status === 'APPROVED').length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Approved Today
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: '1 1 200px' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ImpactIcon color="info" />
                  <Box>
                    <Typography variant="h6">
                      {pendingSwaps.reduce((sum, s) => sum + s.affected_students_count, 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Students Affected
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>

        {/* Bulk Actions */}
        {pendingSwaps.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={bulkSelected.size === pendingSwaps.length && pendingSwaps.length > 0}
                        indeterminate={bulkSelected.size > 0 && bulkSelected.size < pendingSwaps.length}
                        onChange={(e) => e.target.checked ? selectAllSwaps() : clearSelection()}
                      />
                    }
                    label={`${bulkSelected.size} selected`}
                  />
                  {bulkSelected.size > 0 && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<ApproveIcon />}
                      onClick={handleBulkApprove}
                      disabled={reviewMutation.isPending}
                    >
                      Bulk Approve ({bulkSelected.size})
                    </Button>
                  )}
                </Stack>
                <Button
                  variant="text"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  startIcon={showBulkActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  Bulk Actions
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Pending Requests Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Pending Approval ({pendingSwaps.length})
            </Typography>
            
            {pendingSwaps.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Pending Requests</AlertTitle>
                All swap requests have been reviewed.
              </Alert>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={bulkSelected.size === pendingSwaps.length}
                          indeterminate={bulkSelected.size > 0 && bulkSelected.size < pendingSwaps.length}
                          onChange={(e) => e.target.checked ? selectAllSwaps() : clearSelection()}
                        />
                      </TableCell>
                      <TableCell>Teachers</TableCell>
                      <TableCell>Subject Exchange</TableCell>
                      <TableCell align="center">Students Affected</TableCell>
                      <TableCell align="center">Priority</TableCell>
                      <TableCell align="center">Actions</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingSwaps.map((swap) => {
                      const daysOld = getDaysOld(swap.requested_at);
                      const priorityColor = getPriorityColor(daysOld);
                      const isExpanded = expandedRows.has(swap.id);
                      
                      return (
                        <React.Fragment key={swap.id}>
                          <TableRow hover>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={bulkSelected.has(swap.id)}
                                onChange={() => toggleBulkSelection(swap.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                <Typography variant="body2" fontWeight="medium">
                                  {formatTeacherName(swap.requester_teacher)} → {formatTeacherName(swap.target_teacher)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Requested {new Date(swap.requested_at).toLocaleDateString()}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip 
                                  label={swap.requester_subject.name} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                                <SwapIcon fontSize="small" color="action" />
                                <Chip 
                                  label={swap.target_subject.name} 
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined"
                                />
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="medium">
                                {swap.affected_students_count}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${daysOld} days`}
                                size="small"
                                color={priorityColor}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5}>
                                <Tooltip title="View Details">
                                  <IconButton 
                                    size="small"
                                    onClick={() => handleViewDetails(swap)}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Approve">
                                  <IconButton 
                                    size="small"
                                    color="success"
                                    onClick={() => handleReviewClick(swap, 'APPROVE')}
                                    disabled={reviewMutation.isPending}
                                  >
                                    <ApproveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton 
                                    size="small"
                                    color="error"
                                    onClick={() => handleReviewClick(swap, 'REJECT')}
                                    disabled={reviewMutation.isPending}
                                  >
                                    <RejectIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => toggleRowExpansion(swap.id)}
                              >
                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          
                          {/* Expanded Row Details */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Request Details
                                  </Typography>
                                  <Stack spacing={2}>
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        Reason:
                                      </Typography>
                                      <Typography variant="body2" sx={{ 
                                        p: 1, 
                                        bgcolor: 'grey.50', 
                                        borderRadius: 1,
                                        fontStyle: 'italic' 
                                      }}>
                                        "{swap.reason}"
                                      </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={4}>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Requester Email:
                                        </Typography>
                                        <Typography variant="body2">
                                          {swap.requester_teacher.email || 'Not provided'}
                                        </Typography>
                                      </Box>
                                      <Box>
                                        <Typography variant="body2" color="text.secondary">
                                          Target Email:
                                        </Typography>
                                        <Typography variant="body2">
                                          {swap.target_teacher.email || 'Not provided'}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                  </Stack>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Decisions */}
        {recentSwaps.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Decisions
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Teachers</TableCell>
                      <TableCell>Subject Exchange</TableCell>
                      <TableCell align="center">Decision</TableCell>
                      <TableCell align="center">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSwaps.map((swap) => (
                      <TableRow key={swap.id}>
                        <TableCell>
                          <Typography variant="body2">
                            {formatTeacherName(swap.requester_teacher)} → {formatTeacherName(swap.target_teacher)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontSize="0.8rem">
                              {swap.requester_subject.name}
                            </Typography>
                            <SwapIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontSize="0.8rem">
                              {swap.target_subject.name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getSwapStatusText(swap.status)}
                            color={getSwapStatusColor(swap.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption">
                            {swap.admin_reviewed_at ? 
                              new Date(swap.admin_reviewed_at).toLocaleDateString() : 
                              'N/A'
                            }
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Review Dialog */}
        <Dialog 
          open={reviewDialogOpen} 
          onClose={() => setReviewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <form onSubmit={handleSubmit(onSubmitReview)}>
            <DialogTitle>
              {watchedDecision === 'APPROVE' ? 'Approve' : 'Reject'} Swap Request
            </DialogTitle>
            <DialogContent>
              {selectedSwap && (
                <Stack spacing={3}>
                  <Alert severity={watchedDecision === 'APPROVE' ? 'success' : 'warning'}>
                    You are about to {watchedDecision.toLowerCase()} the swap request between{' '}
                    <strong>{formatTeacherName(selectedSwap.requester_teacher)}</strong> and{' '}
                    <strong>{formatTeacherName(selectedSwap.target_teacher)}</strong>.
                  </Alert>

                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Swap Details
                      </Typography>
                      <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                        <Stack direction="row" alignItems="center" spacing={3}>
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                              {selectedSwap.requester_teacher.first_name} Gives
                            </Typography>
                            <Chip 
                              label={selectedSwap.requester_subject.name} 
                              color="primary" 
                            />
                          </Box>
                          <SwapIcon color="action" fontSize="large" />
                          <Box textAlign="center">
                            <Typography variant="body2" color="text.secondary">
                              {selectedSwap.target_teacher.first_name} Gives
                            </Typography>
                            <Chip 
                              label={selectedSwap.target_subject.name} 
                              color="secondary" 
                            />
                          </Box>
                        </Stack>
                      </Box>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {selectedSwap.affected_students_count} students will be affected by this swap
                      </Typography>
                    </CardContent>
                  </Card>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Teacher's Reason:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      fontStyle: 'italic' 
                    }}>
                      "{selectedSwap.reason}"
                    </Typography>
                  </Box>

                  <TextField
                    {...register('admin_comments')}
                    label="Administrator Comments"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder={
                      watchedDecision === 'APPROVE' 
                        ? "Add any comments about the approval (optional)..."
                        : "Please explain why this request is being rejected..."
                    }
                    error={!!errors.admin_comments}
                    helperText={errors.admin_comments?.message}
                  />
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color={watchedDecision === 'APPROVE' ? 'success' : 'error'}
                disabled={reviewMutation.isPending}
                startIcon={
                  reviewMutation.isPending ? 
                    <CircularProgress size={16} /> : 
                    (watchedDecision === 'APPROVE' ? <ApproveIcon /> : <RejectIcon />)
                }
              >
                {reviewMutation.isPending ? 'Processing...' : `${watchedDecision === 'APPROVE' ? 'Approve' : 'Reject'} Request`}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Details Dialog (reusing from SwapRequestsPanel logic) */}
        <Dialog 
          open={detailsDialogOpen} 
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Swap Request Details
          </DialogTitle>
          <DialogContent>
            {selectedSwap && (
              <Stack spacing={3}>
                {/* Request Overview */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Request Overview
                    </Typography>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Requester:</strong></TableCell>
                          <TableCell>{formatTeacherName(selectedSwap.requester_teacher)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Target:</strong></TableCell>
                          <TableCell>{formatTeacherName(selectedSwap.target_teacher)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Status:</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={getSwapStatusText(selectedSwap.status)} 
                              color={getSwapStatusColor(selectedSwap.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Requested:</strong></TableCell>
                          <TableCell>{new Date(selectedSwap.requested_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Students Affected:</strong></TableCell>
                          <TableCell>{selectedSwap.affected_students_count}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Subject Exchange */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Subject Exchange
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="center" py={2}>
                      <Stack direction="row" alignItems="center" spacing={3}>
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedSwap.requester_teacher.first_name} Gives
                          </Typography>
                          <Chip 
                            label={`${selectedSwap.requester_subject.name} (${selectedSwap.requester_subject.code})`} 
                            color="primary" 
                          />
                        </Box>
                        <SwapIcon color="action" fontSize="large" />
                        <Box textAlign="center">
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {selectedSwap.target_teacher.first_name} Gives
                          </Typography>
                          <Chip 
                            label={`${selectedSwap.target_subject.name} (${selectedSwap.target_subject.code})`} 
                            color="secondary" 
                          />
                        </Box>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>

                {/* Reason */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Reason for Request
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      p: 2, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      fontStyle: 'italic' 
                    }}>
                      "{selectedSwap.reason}"
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
}