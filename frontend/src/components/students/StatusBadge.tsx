import React from 'react';
import {
  Chip,
  ChipProps,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';

export type StatusType = 'active' | 'inactive' | 'pending' | 'warning';

interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
  text?: string;
  showIcon?: boolean;
}

const statusConfig = {
  active: {
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#d1fae5',
    icon: CheckCircleIcon,
    defaultText: 'Active',
  },
  inactive: {
    color: '#6b7280',
    bgColor: '#f9fafb',
    borderColor: '#e5e7eb',
    icon: CancelIcon,
    defaultText: 'Inactive',
  },
  pending: {
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    icon: ScheduleIcon,
    defaultText: 'Pending',
  },
  warning: {
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    icon: WarningIcon,
    defaultText: 'Warning',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  showIcon = true,
  size = 'small',
  sx,
  ...props
}) => {
  const theme = useTheme();
  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <Chip
      {...props}
      label={text || config.defaultText}
      size={size}
      icon={showIcon ? <IconComponent sx={{ fontSize: '16px !important' }} /> : undefined}
      sx={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        height: size === 'small' ? 24 : 32,
        '& .MuiChip-icon': {
          color: config.color,
          fontSize: size === 'small' ? 14 : 16,
        },
        '& .MuiChip-label': {
          px: 1,
        },
        ...sx,
      }}
    />
  );
};

// Convenience components for specific statuses
export const ActiveBadge: React.FC<Omit<StatusBadgeProps, 'status'>> = (props) => (
  <StatusBadge {...props} status="active" />
);

export const InactiveBadge: React.FC<Omit<StatusBadgeProps, 'status'>> = (props) => (
  <StatusBadge {...props} status="inactive" />
);

export const PendingBadge: React.FC<Omit<StatusBadgeProps, 'status'>> = (props) => (
  <StatusBadge {...props} status="pending" />
);

export const WarningBadge: React.FC<Omit<StatusBadgeProps, 'status'>> = (props) => (
  <StatusBadge {...props} status="warning" />
);

export default StatusBadge;