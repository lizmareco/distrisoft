"use client"

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, type = "delete" }) {
  // Configuración según el tipo de diálogo
  const getConfig = () => {
    switch (type) {
      case "delete":
        return {
          icon: <DeleteIcon sx={{ fontSize: 40, color: "error.main" }} />,
          confirmColor: "error",
          confirmText: "Eliminar",
        }
      default:
        return {
          icon: null,
          confirmColor: "primary",
          confirmText: "Aceptar",
        }
    }
  }

  const config = getConfig()

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2,
          minWidth: { xs: "90%", sm: 400 },
        },
      }}
    >
      <DialogTitle id="alert-dialog-title" sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={2}>
          {config.icon}
          <Typography variant="h6">{title}</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" sx={{ mb: 2 }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={config.confirmColor}
          autoFocus
          sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
        >
          {config.confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

