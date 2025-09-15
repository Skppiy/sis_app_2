// src/features/academics/components/SwapRequestsPanel.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Collapse,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  Send as SendIcon,
  CallReceived as ReceivedIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Check as AcceptIcon,
  Close as DeclineIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SwapResponse, SwapResponseSchema, getSwapStatusColor, getSwapStatusText } from '@/schemas/academics';
import { 
  useTeacherSwaps,
  useRespondToSwap,
  useCancelSwapRequest,
  formatTeacherName,
  getSwapDirectionText,
  canCancelSwap,
  canRespondToSwap,
} from '../hooks/useTeacherSwaps';
import type { SwapRequest } from '../services/teacherSwaps';

type Props = {
  teacherId: string;
  teacherName?: string;
};

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
      id={`swap-tabpanel-${index}`}
      aria-labelledby={`swap-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function SwapRequestsPanel({ teacherId, teacherName }: Props) {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const { data: swaps = [], isLoading, error } = useTeacherSwaps(teacherId);
  const respondMutation = useRespondToSwap();
  const cancelMutation = useCancelSwapRequest();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(SwapResponseSchema),
    defaultValues: {
      response: 'ACCEPT' as const,
      comments: '',
    },
  });

  // Categorize swaps
  const sentSwaps = swaps.filter(swap => swap.requester_teacher.id === teacherId);
  const receivedSwaps = swaps.filter(swap => swap.target_teacher.id === teacherId);
  const completedSwaps = swaps.filter(swap => 
    swap.status === 'APPROVED' || swap.status === 'REJECTED' || swap.status === 'CANCELLED'
  );

  const pendingSentCount = sentSwaps.filter(swap => 
    swap.status === 'PENDING_TARGET_RESPONSE' || swap.status === 'PENDING_ADMIN_APPROVAL'
  ).length;

  const pendingReceivedCount = receivedSwaps.filter(swap => 
    swap.status === 'PENDING_TARGET_RESPONSE'
  ).length;

  const toggleCardExpansion = (swapId: string) => {
    const newExpanded = new Set(expandedCards);
    if (expandedCards.has(swapId)) {
      newExpanded.delete(swapId);
    } else {
      newExpanded.add(swapId);
    }
    setExpandedCards(newExpanded);
  };

  const handleViewDetails = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setDetailsDialogOpen(true);
  };

  const handleRespondClick = (swap: SwapRequest) => {
    setSelectedSwap(swap);
    setResponseDialogOpen(true);
    reset({ response: 'ACCEPT', comments: '' });
  };

  const handleCancelClick = async (swap: SwapRequest) => {
    if (confirm('Are you sure you want to cancel this swap request?')) {
      try {
        await cancelMutation.mutateAsync(swap.id);
      } catch (error) {
        console.error('Failed to cancel swap request:', error);
      }
    }
  };

  const onSubmitResponse = async (data: SwapResponse) => {
    if (!selectedSwap) return;
    
    try {
      await respondMutation.mutateAsync({
        swapId: selectedSwap.id,
        response: data.response,
        comments: data.comments,
      });
      setResponseDialogOpen(false);
      setSelectedSwap(null);
    } catch (error) {
      console.error('Failed to respond to swap request:', error);
    }
  };

  const renderSwapCard = (swap: SwapRequest) => {
    const isExpanded = expandedCards.has(swap.id);
    const direction = getSwapDirectionText(swap, teacherId);
    const statusColor = getSwapStatusColor(swap.status);
    const statusText = getSwapStatusText(swap.status);

    return (
      <Card key={swap.id} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <SwapIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {direction.direction === 'sent' ? 'Swap Request to' : 'Swap Request from'} {formatTeacherName(direction.otherTeacher)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {direction.yourSubject.name} ↔ {direction.theirSubject.name}
                  </Typography>
                </Box>
              </Stack>
              <Stack alignItems="flex-end" spacing={1}>
                <Chip 
                  label={statusText} 
                  color={statusColor}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {new Date(swap.requested_at).toLocaleDateString()}
                </Typography>
              </Stack>
            </Stack>

            {/* Quick Info */}
            <Stack direction="row" spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary">Your Subject</Typography>
                <Typography variant="body2">{direction.yourSubject.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Their Subject</Typography>
                <Typography variant="body2">{direction.theirSubject.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Students Affected</Typography>
                <Typography variant="body2">{swap.affected_students_count}</Typography>
              </Box>
            </Stack>

            {/* Reason Preview */}
            <Box>
              <Typography variant="caption" color="text.secondary">Reason</Typography>
              <Typography variant="body2" sx={{ 
                display: '-webkit-box',
                WebkitLineClamp: isExpanded ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {swap.reason}
              </Typography>
              {swap.reason.length > 100 && (
                <Button 
                  size="small" 
                  onClick={() => toggleCardExpansion(swap.id)}
                  startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                >
                  {isExpanded ? 'Show Less' : 'Show More'}
                </Button>
              )}
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                startIcon={<ViewIcon />}
                onClick={() => handleViewDetails(swap)}
              >
                Details
              </Button>

              {canRespondToSwap(swap, teacherId) && (
                <>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<AcceptIcon />}
                    onClick={() => handleRespondClick(swap)}
                    disabled={respondMutation.isPending}
                  >
                    Respond
                  </Button>
                </>
              )}

              {canCancelSwap(swap, teacherId) && (
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => handleCancelClick(swap)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    );
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
        Unable to load your swap requests. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Subject Swap Requests
          </Typography>
          {teacherName && (
            <Typography variant="body2" color="text.secondary">
              {teacherName}
            </Typography>
          )}
        </Box>

        {/* Tabs */}
        <Box>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SendIcon />
                  <span>Sent Requests</span>
                  {pendingSentCount > 0 && (
                    <Badge badgeContent={pendingSentCount} color="primary" />
                  )}
                </Stack>
              }
            />
            <Tab 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ReceivedIcon />
                  <span>Received Requests</span>
                  {pendingReceivedCount > 0 && (
                    <Badge badgeContent={pendingReceivedCount} color="error" />
                  )}
                </Stack>
              }
            />
            <Tab 
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <HistoryIcon />
                  <span>History</span>
                </Stack>
              }
            />
          </Tabs>

          {/* Sent Requests Tab */}
          <TabPanel value={currentTab} index={0}>
            {sentSwaps.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Sent Requests</AlertTitle>
                You haven't sent any swap requests yet.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {sentSwaps.map(renderSwapCard)}
              </Stack>
            )}
          </TabPanel>

          {/* Received Requests Tab */}
          <TabPanel value={currentTab} index={1}>
            {receivedSwaps.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Received Requests</AlertTitle>
                You haven't received any swap requests yet.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {receivedSwaps.map(renderSwapCard)}
              </Stack>
            )}
          </TabPanel>

          {/* History Tab */}
          <TabPanel value={currentTab} index={2}>
            {completedSwaps.length === 0 ? (
              <Alert severity="info">
                <AlertTitle>No Completed Swaps</AlertTitle>
                No completed swap requests to show.
              </Alert>
            ) : (
              <Stack spacing={2}>
                {completedSwaps.map(renderSwapCard)}
              </Stack>
            )}
          </TabPanel>
        </Box>

        {/* Response Dialog */}
        <Dialog 
          open={responseDialogOpen} 
          onClose={() => setResponseDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <form onSubmit={handleSubmit(onSubmitResponse)}>
            <DialogTitle>
              Respond to Swap Request
            </DialogTitle>
            <DialogContent>
              {selectedSwap && (
                <Stack spacing={3}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      {formatTeacherName(selectedSwap.requester_teacher)} wants to swap their{' '}
                      <strong>{selectedSwap.requester_subject.name}</strong> with your{' '}
                      <strong>{selectedSwap.target_subject.name}</strong>.
                    </Typography>
                  </Alert>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Their Reason:
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
                    {...register('comments')}
                    label="Your Comments (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="Add any comments about your decision..."
                    error={!!errors.comments}
                    helperText={errors.comments?.message}
                  />
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setResponseDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="outlined"
                color="error"
                onClick={() => reset({ response: 'DECLINE', comments: '' })}
                disabled={respondMutation.isPending}
              >
                Decline
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="success"
                onClick={() => reset({ response: 'ACCEPT', comments: '' })}
                disabled={respondMutation.isPending}
              >
                {respondMutation.isPending ? 'Responding...' : 'Accept'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Details Dialog */}
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
                {/* Basic Info */}
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Request Overview
                    </Typography>
                    <TableContainer>
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
                          {selectedSwap.target_response_at && (
                            <TableRow>
                              <TableCell><strong>Responded:</strong></TableCell>
                              <TableCell>{new Date(selectedSwap.target_response_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          )}
                          {selectedSwap.admin_reviewed_at && (
                            <TableRow>
                              <TableCell><strong>Admin Review:</strong></TableCell>
                              <TableCell>{new Date(selectedSwap.admin_reviewed_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
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

                {/* Admin Comments */}
                {selectedSwap.admin_comments && (
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                        Administrator Comments
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        p: 2, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        fontStyle: 'italic' 
                      }}>
                        "{selectedSwap.admin_comments}"
                      </Typography>
                    </CardContent>
                  </Card>
                )}
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