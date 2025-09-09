import React from 'react';
import {
  IconButton,
  Tooltip,
  Stack,
  Button,
  ButtonGroup,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onEnroll?: () => void;
  onView?: () => void;
  variant?: 'icons' | 'buttons' | 'compact';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onEdit,
  onDelete,
  onEnroll,
  onView,
  variant = 'icons',
  size = 'small',
  disabled = false,
  className,
}) => {
  const theme = useTheme();

  const buttonSize = size === 'small' ? 32 : size === 'medium' ? 40 : 48;
  const iconSize = size === 'small' ? 16 : size === 'medium' ? 20 : 24;

  if (variant === 'buttons') {
    return (
      <ButtonGroup
        variant="outlined"
        size={size}
        className={className}
        sx={{
          '& .MuiButton-root': {
            minWidth: 'auto',
            px: 1.5,
          },
        }}
      >
        {onView && (
          <Button
            onClick={onView}
            disabled={disabled}
            startIcon={<ViewIcon sx={{ fontSize: iconSize }} />}
          >
            View
          </Button>
        )}
        {onEnroll && (
          <Button
            onClick={onEnroll}
            disabled={disabled}
            startIcon={<PersonAddIcon sx={{ fontSize: iconSize }} />}
            color="primary"
          >
            Enroll
          </Button>
        )}
        {onEdit && (
          <Button
            onClick={onEdit}
            disabled={disabled}
            startIcon={<EditIcon sx={{ fontSize: iconSize }} />}
            color="info"
          >
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            onClick={onDelete}
            disabled={disabled}
            startIcon={<DeleteIcon sx={{ fontSize: iconSize }} />}
            color="error"
          >
            Delete
          </Button>
        )}
      </ButtonGroup>
    );
  }

  if (variant === 'compact') {
    return (
      <Stack direction="row" spacing={0.5} className={className}>
        {(onView || onEnroll || onEdit || onDelete) && (
          <Tooltip title="More actions">
            <IconButton
              size={size}
              disabled={disabled}
              sx={{
                width: buttonSize,
                height: buttonSize,
                bgcolor: alpha(theme.palette.action.hover, 0.8),
                '&:hover': {
                  bgcolor: alpha(theme.palette.action.hover, 1),
                },
              }}
            >
              <MoreIcon sx={{ fontSize: iconSize }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    );
  }

  // Default 'icons' variant
  return (
    <Stack direction="row" spacing={0.5} className={className}>
      {onView && (
        <Tooltip title="View Details" placement="top">
          <IconButton
            size={size}
            onClick={onView}
            disabled={disabled}
            sx={{
              width: buttonSize,
              height: buttonSize,
              bgcolor: alpha(theme.palette.action.active, 0.08),
              '&:hover': {
                bgcolor: alpha(theme.palette.action.active, 0.12),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <ViewIcon sx={{ fontSize: iconSize }} />
          </IconButton>
        </Tooltip>
      )}

      {onEnroll && (
        <Tooltip title="Enroll in Class" placement="top">
          <IconButton
            size={size}
            onClick={onEnroll}
            disabled={disabled}
            sx={{
              width: buttonSize,
              height: buttonSize,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <PersonAddIcon sx={{ fontSize: iconSize }} />
          </IconButton>
        </Tooltip>
      )}

      {onEdit && (
        <Tooltip title="Edit Student" placement="top">
          <IconButton
            size={size}
            onClick={onEdit}
            disabled={disabled}
            sx={{
              width: buttonSize,
              height: buttonSize,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              color: theme.palette.info.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.info.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <EditIcon sx={{ fontSize: iconSize }} />
          </IconButton>
        </Tooltip>
      )}

      {onDelete && (
        <Tooltip title="Delete Student" placement="top">
          <IconButton
            size={size}
            onClick={onDelete}
            disabled={disabled}
            sx={{
              width: buttonSize,
              height: buttonSize,
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: theme.palette.error.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.error.main, 0.2),
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <DeleteIcon sx={{ fontSize: iconSize }} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
};

export default ActionButtons;