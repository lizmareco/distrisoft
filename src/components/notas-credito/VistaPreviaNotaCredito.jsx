import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  IconButton,
} from "@mui/material"
import { Close as CloseIcon, Print as PrintIcon } from "@mui/icons-material"

export default function VistaPreviaNotaCredito({ open, onClose, notaId }) {
  const [datosNota, setDatosNota] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    if (open && notaId) {
      cargarDatosNota()
    }
  }, [open, notaId])

  const cargarDatosNota = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/finanzas/notas-credito/${notaId}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Error al cargar la nota de crédito")
      if (!data.data) throw new Error("No se recibieron datos de la nota de crédito")
      setDatosNota(data.data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImprimir = async () => {
    if (!notaId) return
    try {
      const response = await fetch(`/api/finanzas/notas-credito/${notaId}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (error) {
      console.error("Error al generar PDF:", error)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Cargando nota de crédito...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography color="error" variant="h6" gutterBottom>
              Error al cargar la nota de crédito
            </Typography>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
            <Button onClick={onClose} variant="outlined" sx={{ mt: 2 }}>
              Cerrar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (!datosNota) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>No se pudieron cargar los datos de la nota de crédito</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  // Formato visual similar al ejemplo proporcionado
  const nroFacturaFormateado = datosNota.nroFacturaOrigen
    ? `001-001-${String(datosNota.nroFacturaOrigen).padStart(7, "0")}`
    : "-"

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Vista Previa - Nota de Crédito {datosNota.nroNota}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Paper sx={{ p: 3, border: "2px solid #000", fontFamily: "Arial, sans-serif", backgroundColor: "#fff", fontSize: "12px" }}>
          {/* Encabezado principal */}
          <Box sx={{ border: "2px solid #000", mb: 2, display: "flex", minHeight: "120px" }}>
            {/* Sección izquierda - Información de la empresa */}
            <Box sx={{ flex: 1, p: 2, borderRight: "2px solid #000" }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                  DISTRIBUIDORA 'LAS NIÑAS'
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  de Victor Manuel Barreto Barrios
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  ELABORACIÓN DE COMIDAS Y PLATOS PREPARADOS
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  TELÉFONO: (0993) 540-258
                </Typography>
              </Box>
            </Box>
            {/* Sección derecha - Datos de la nota de crédito */}
            <Box sx={{ width: "280px", p: 2, backgroundColor: "#f5f5f5" }}>
              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  TIMBRADO Nº
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {datosNota.empresa?.timbrado}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                  R.U.C.
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {datosNota.empresa?.ruc}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                  NOTA DE CRÉDITO
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Nº {datosNota.nroNota}
                </Typography>
              </Box>
              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Fecha de Emisión
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {new Date(datosNota.fechaEmision).toLocaleDateString("es-PY")}
                </Typography>
              </Box>
            </Box>
          </Box>
          {/* Información del cliente y motivo */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <Box sx={{ border: "1px solid #000", p: 1, height: "100%" }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Cliente o Razón Social:</strong> {datosNota.cliente?.nombre}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>R.U.C.:</strong> {datosNota.cliente?.ruc}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ border: "1px solid #000", p: 1, height: "100%", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 2 }}>
                  Comprobante de Venta:
                </Typography>
                <Typography variant="body2">{nroFacturaFormateado}</Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                  Motivo:
                </Typography>
                <Typography variant="body2">{datosNota.motivo}</Typography>
              </Box>
            </Grid>
          </Grid>
          {/* Tabla de detalles */}
          <TableContainer component={Box} sx={{ border: "1px solid #000", mb: 2 }}>
            <Table size="small" sx={{ "& td, & th": { border: "1px solid #000", fontSize: "0.75rem", p: 0.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "8%", textAlign: "center", fontWeight: "bold" }}>Cant.</TableCell>
                  <TableCell sx={{ width: "60%", textAlign: "center", fontWeight: "bold" }}>Descripción</TableCell>
                  <TableCell sx={{ width: "16%", textAlign: "center", fontWeight: "bold" }}>Precio Unitario</TableCell>
                  <TableCell sx={{ width: "16%", textAlign: "center", fontWeight: "bold" }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosNota.detalles?.map((detalle, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ textAlign: "center" }}>{detalle.cantidad}</TableCell>
                    <TableCell sx={{ textAlign: "left" }}>{detalle.descripcion}</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>₲ {detalle.precioUnitario.toLocaleString("es-PY")}</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>₲ {(detalle.cantidad * detalle.precioUnitario).toLocaleString("es-PY")}</TableCell>
                  </TableRow>
                ))}
                {/* Filas vacías para completar el diseño */}
                {Array.from({ length: Math.max(0, 6 - (datosNota.detalles?.length || 0)) }).map((_, index) => (
                  <TableRow key={`empty-${index}`} sx={{ height: "25px" }}>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                  </TableRow>
                ))}
                {/* Fila de total */}
                <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                  <TableCell colSpan={3} sx={{ textAlign: "center", fontWeight: "bold" }}>
                    TOTAL A ACREDITAR:
                  </TableCell>
                  <TableCell sx={{ textAlign: "center", fontWeight: "bold", fontSize: "1rem" }}>
                    ₲ {datosNota.montoTotal?.toLocaleString("es-PY")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleImprimir} variant="contained" color="primary" startIcon={<PrintIcon />}>
          Imprimir PDF
        </Button>
        <Button onClick={onClose} variant="outlined">Cerrar</Button>
      </DialogActions>
    </Dialog>
  )
} 