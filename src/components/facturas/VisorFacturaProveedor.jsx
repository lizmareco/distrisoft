"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material"
import { Close as CloseIcon, Business, Receipt, CalendarToday, Payment } from "@mui/icons-material"

export default function VisorFacturaProveedor({ open, onClose, facturaId }) {
  const [factura, setFactura] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open && facturaId) {
      cargarFactura()
    }
  }, [open, facturaId])

  const cargarFactura = async () => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await fetch(`/api/finanzas/facturas-proveedores/${facturaId}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setFactura(datos.data)
      } else {
        setError("Error al cargar los datos de la factura")
      }
    } catch (error) {
      console.error("Error al cargar factura:", error)
      setError("Error al cargar los datos de la factura")
    } finally {
      setCargando(false)
    }
  }

  const getTipoColor = (tipo) => {
    return tipo === "contado" ? "success" : "warning"
  }

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "registrada":
        return "primary"
      case "verificada":
        return "info"
      case "pagada":
        return "success"
      case "anulada":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{factura ? `Factura ${factura.nroFactura}` : "Cargando factura..."}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {cargando ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : factura ? (
          <Box>
            {/* Información principal */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Business sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Datos del Proveedor</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold">
                    {factura.proveedor?.empresa?.razonSocial}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    RUC: {factura.proveedor?.empresa?.ruc}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {factura.proveedor?.empresa?.direccion}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Tel: {factura.proveedor?.empresa?.telefono}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: "100%" }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Receipt sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Datos de la Factura</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Número:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {factura.nroFactura}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Tipo:
                      </Typography>
                      <Chip label={factura.tipo?.toUpperCase()} color={getTipoColor(factura.tipo)} size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Estado:
                      </Typography>
                      <Chip label={factura.estado} color={getEstadoColor(factura.estado)} size="small" />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Orden de Compra:
                      </Typography>
                      <Typography variant="body1">#{factura.ordenCompra?.idOrdenCompra || "N/A"}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Información de fechas y condiciones */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <CalendarToday sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Fechas</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Fecha de Emisión:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(factura.fechaEmision).toLocaleDateString("es-PY")}
                      </Typography>
                    </Grid>
                    {factura.fechaVencimiento && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Fecha de Vencimiento:
                        </Typography>
                        <Typography variant="body1">
                          {new Date(factura.fechaVencimiento).toLocaleDateString("es-PY")}
                        </Typography>
                      </Grid>
                    )}
                    {factura.plazoPago && (
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Plazo de Pago:
                        </Typography>
                        <Typography variant="body1">{factura.plazoPago} días</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Payment sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h6">Condiciones de Pago</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">
                        Condición de Venta:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {factura.tipo === "contado" ? "AL CONTADO" : "A CRÉDITO"}
                      </Typography>
                    </Grid>
                    {factura.metodoPago && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          Método de Pago:
                        </Typography>
                        <Typography variant="body1">{factura.metodoPago.descMetodoPago}</Typography>
                      </Grid>
                    )}
                    {factura.comprobantePago && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">
                          Comprobante:
                        </Typography>
                        <Typography variant="body1">{factura.comprobantePago}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Detalles de materias primas */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detalles de Materias Primas
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Materia Prima</TableCell>
                      <TableCell align="center">Cantidad (kg)</TableCell>
                      <TableCell align="right">Precio por kilo (Gs)</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {factura.detalles?.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {detalle.detalleCotizacion?.materiaPrima?.nombreMateriaPrima}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {detalle.detalleCotizacion?.materiaPrima?.descMateriaPrima}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {((detalle.cantidadFacturada || 0) / 1000).toLocaleString("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell align="right">
                          ₲ {((detalle.precioUnitarioFinal || 0) * 1000).toLocaleString("es-PY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold">₲ {detalle.subtotalFinal?.toLocaleString("es-PY")}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Total */}
            <Paper sx={{ p: 2, backgroundColor: "grey.50" }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Total de la Factura:</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  ₲ {factura.montoTotal?.toLocaleString("es-PY")}
                </Typography>
              </Box>
            </Paper>

            {/* Observaciones */}
            {factura.observacion && (
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Observaciones
                </Typography>
                <Typography variant="body2">{factura.observacion}</Typography>
              </Paper>
            )}
          </Box>
        ) : (
          <Typography variant="body1" align="center" py={4}>
            No se encontraron datos de la factura
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
