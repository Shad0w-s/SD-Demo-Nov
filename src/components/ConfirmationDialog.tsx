'use client'

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import { CheckCircle } from '@mui/icons-material'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  message: string
  onClose: () => void
}

export default function ConfirmationDialog({ open, title, message, onClose }: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  )
}

