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

export default function VistaPreviaNotaDebito({ open, onClose, notaId }) {
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
      const response = await fetch(`/api/finanzas/notas-debito/${notaId}`)
      const data = await response.json()
      if (!data.success) throw new Error(data.error || "Error al cargar la nota de débito")
      if (!data.data) throw new Error("No se recibieron datos de la nota de débito")
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
      const response = await fetch(`/api/finanzas/notas-debito/${notaId}/pdf`)
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
            <Typography>Cargando nota de débito...</Typography>
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
              Error al cargar la nota de débito
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
            <Typography>No se pudieron cargar los datos de la nota de débito</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  // Formato visual similar al ejemplo proporcionado
  const nroFacturaFormateado = datosNota.factura?.numero
    ? `001-001-${String(datosNota.factura.numero).padStart(7, "0")}`
    : "-"

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Vista Previa - Nota de Débito {datosNota.nota?.numero}</Typography>
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
            {/* Sección derecha - Datos de la nota de débito */}
            <Box sx={{ width: "280px", p: 2, backgroundColor: "#f5f5f5" }}>
              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  TIMBRADO Nº
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  12345678
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                  R.U.C.
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  80012345-1
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>
                  NOTA DE DÉBITO
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Nº {datosNota.nota?.numero}
                </Typography>
              </Box>
              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Fecha de Emisión
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {datosNota.nota?.fecha ? new Date(datosNota.nota.fecha).toLocaleDateString("es-PY") : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
          {/* Información del cliente y motivo */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <Box sx={{ border: "1px solid #000", p: 1, height: "100%" }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Cliente o Razón Social:</strong> {datosNota.factura?.cliente || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>R.U.C.:</strong> {datosNota.factura?.ruc || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ border: "1px solid #000", p: 1, height: "100%" }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Factura Origen:</strong> {nroFacturaFormateado}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Motivo:</strong> {datosNota.nota?.motivo || 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          {/* Tabla de detalles */}
          <TableContainer component={Paper} sx={{ mb: 2, border: "1px solid #000" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                    Concepto
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                    Cantidad
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                    Precio Unit.
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                    Subtotal
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                    Impuesto
                  </TableCell>
                  <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                    Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosNota.detalles?.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ border: "1px solid #000" }}>
                      {detalle.concepto || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #000", textAlign: "center" }}>
                      {detalle.cantidad || 0}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}>
                      ₲ {(detalle.precioUnitario || 0).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}>
                      ₲ {(detalle.subtotal || 0).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}>
                      ₲ {(detalle.montoImpuesto || 0).toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}>
                      ₲ {(detalle.totalItem || 0).toLocaleString("es-PY")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Total */}
          <Box sx={{ border: "2px solid #000", p: 2, textAlign: "right", backgroundColor: "#f5f5f5" }}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              TOTAL: ₲ {(datosNota.nota?.montoTotal || 0).toLocaleString("es-PY")}
            </Typography>
          </Box>
          {/* Información adicional */}
          <Box sx={{ mt: 2, p: 2, border: "1px solid #000", backgroundColor: "#f9f9f9" }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Usuario Emisor:</strong> {datosNota.nota?.usuarioEmisor || 'N/A'}
            </Typography>
            <Typography variant="body2">
              <strong>Observaciones:</strong> {datosNota.nota?.motivo || 'Sin observaciones'}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button onClick={handleImprimir} variant="contained" startIcon={<PrintIcon />}>
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  )
} 