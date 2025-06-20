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
  IconButton,
  Card,
  CardContent,
  Grid,
} from "@mui/material"
import {
  Close as CloseIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"

export default function HistorialPagos({ open, onClose, nroFactura }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [historial, setHistorial] = useState([])
  const [resumen, setResumen] = useState(null)
  const [infoFactura, setInfoFactura] = useState(null)

  useEffect(() => {
    if (open && nroFactura) {
      cargarHistorial()
    }
  }, [open, nroFactura])

  const cargarHistorial = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/finanzas/pagos/historial/${nroFactura}`)

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error al cargar historial")
      }

      setHistorial(data.data.historial || [])
      setResumen(data.data.resumen || null)
      setInfoFactura(data.data.factura || null)
    } catch (error) {
      console.error("Error al cargar historial:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-PY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatearMonto = (monto) => {
    return `₲ ${Number(monto).toLocaleString("es-PY")}`
  }

  // Función para formatear el número de factura
  const formatearNroFactura = (nroFactura) => {
    if (typeof nroFactura !== "string" && typeof nroFactura !== "number") return nroFactura;
    const nro = nroFactura.toString().replace(/[^0-9]/g, "");
    if (nro.length > 7) return nroFactura;
    return `001-001-${nro.padStart(7, "0")}`;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Historial de Cobros - Factura #{formatearNroFactura(nroFactura)}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando historial de pagos...
            </Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button size="small" onClick={cargarHistorial} sx={{ ml: 2 }} startIcon={<RefreshIcon />}>
              Reintentar
            </Button>
          </Alert>
        ) : (
          <Box>
            {/* Información de la factura */}
            {infoFactura && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Información de la Factura
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Cliente:</strong> {infoFactura.cliente}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Fecha Emisión:</strong> {formatearFecha(infoFactura.fechaEmision)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Monto Total:</strong> {formatearMonto(infoFactura.montoTotal)}
                      </Typography>
                      {resumen && (
                        <Typography variant="body2">
                          <strong>Total Cobrado:</strong> {formatearMonto(resumen.totalPagado)}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Resumen de pagos */}
            {resumen && (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <PaymentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="primary">
                        {resumen.cantidadPagos}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cobros Realizados
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <ReceiptIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="success.main">
                        {formatearMonto(resumen.totalPagado)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Cobrado
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card>
                    <CardContent sx={{ textAlign: "center" }}>
                      <PersonIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6" color="info.main">
                        {resumen.ultimoPago ? formatearFecha(resumen.ultimoPago.fechaPago) : "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Último Cobro
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {/* Tabla de historial */}
            {historial.length === 0 ? (
              <Alert severity="info">
                No se encontraron pagos para esta factura.
                {infoFactura && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    La factura #{formatearNroFactura(nroFactura)} aún no tiene pagos registrados.
                  </Typography>
                )}
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Monto</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Método</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Comprobante</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Operador</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historial.map((pago, index) => (
                      <TableRow key={pago.idPago} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
                        <TableCell>
                          <Typography variant="body2">{formatearFecha(pago.fechaPago)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={formatearMonto(pago.montoPago)}
                            color="success"
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{pago.metodoPago}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{pago.comprobantePago || "-"}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{pago.operador}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200, wordWrap: "break-word" }}>
                            {pago.observaciones?.replace(`#${nroFactura}`, `#${formatearNroFactura(nroFactura)}`)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button variant="outlined" onClick={cargarHistorial} disabled={loading} startIcon={<RefreshIcon />}>
          Actualizar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
