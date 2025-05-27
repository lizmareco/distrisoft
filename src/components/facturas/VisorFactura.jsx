"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material"
import { Close as CloseIcon, Visibility as VisibilityIcon, Download as DownloadIcon } from "@mui/icons-material"
import VistaPreviaFactura from "./VistaPrevia"

export default function VisorFactura({ open, onClose, nroFactura }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

  const handleVerPrevia = () => {
    setMostrarVistaPrevia(true)
  }

  const handleCerrarPrevia = () => {
    setMostrarVistaPrevia(false)
  }

  const handleDescargar = async () => {
    if (!nroFactura) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/finanzas/facturas-clientes/${nroFactura}/pdf`)

      if (!response.ok) {
        throw new Error("Error al generar PDF")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `factura-${nroFactura}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error al descargar:", error)
      setError("Error al descargar el PDF de la factura")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Factura #{nroFactura}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ textAlign: "center", py: 3 }}>
          <Typography variant="body1" gutterBottom>
            ¿Qué deseas hacer con la factura #{nroFactura}?
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 3 }}>
            <Button variant="contained" startIcon={<VisibilityIcon />} onClick={handleVerPrevia} fullWidth size="large">
              Ver Vista Previa
            </Button>

            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleDescargar}
              disabled={loading}
              fullWidth
              size="large"
            >
              {loading ? "Descargando..." : "Descargar PDF"}
            </Button>
          </Box>
        </Box>

        {/* Componente de Vista Previa */}
        <VistaPreviaFactura open={mostrarVistaPrevia} onClose={handleCerrarPrevia} facturaId={nroFactura} />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
}
