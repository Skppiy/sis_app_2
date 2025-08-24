import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

type CrudModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  children?: React.ReactNode;
};

export const CrudModal: React.FC<CrudModalProps> = ({ title, open, onClose, onSubmit, children }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>{children ?? <em>Form fields go here</em>}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSubmit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
};

