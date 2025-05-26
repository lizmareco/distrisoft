"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
} from "@mui/material"
import { Payment, Visibility, Warning, CheckCircle } from "@mui/icons-material"

export default function CuentasPorCobrarPage() {
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([])
  const [openPagoDialog, setOpenPagoDialog] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)

  // Datos de ejemplo
  const cuentasEjemplo = [
    {
      nroFactura: 1002,
      cliente: "María González",
      fechaEmision: "2024-01-16",
      fechaVencimiento: "2024-02-16",
      montoTotal: 250000,
      montoPagado: 0,
      saldoRestante: 250000,
      diasVencimiento: 5,
      estado: "Pendiente",
    },
    {
      nroFactura: 1003,
      cliente: "Carlos López",
      fechaEmision: "2024-01-10",
      fechaVencimiento: "2024-02-10",
      montoTotal: 180000,
      montoPagado: 90000,
      saldoRestante: 90000,
      diasVencimiento: -1,
      estado: "Vencida",
    },
    {
      nroFactura: 1004,
      cliente: "Ana Martínez",
      fechaEmision: "2024-01-20",
      fechaVencimiento: "2024-02-20",
      montoTotal: 320000,
      montoPagado: 100000,
      saldoRestante: 220000,
      diasVencimiento: 9,
      estado: "Pendiente",
    },
  ]

  useEffect(() => {
    setCuentasPorCobrar(cuentasEjemplo)
  }, [])

  const handleRegistrarPago = (factura) => {
    setFacturaSeleccionada(factura)
    setOpenPagoDialog(true)
  }

  const handleClosePagoDialog = () => {
    setOpenPagoDialog(false)
    setFacturaSeleccionada(null)
  }

  const getEstadoColor = (estado, diasVencimiento) => {
    if (estado === "Vencida" || diasVencimiento < 0) return "error"
    if (diasVencimiento <= 3) return "warning"
    return "success"
  }

  const getEstadoIcon = (estado, diasVencimiento) => {
    if (estado === "Vencida" || diasVencimiento < 0) return <Warning />
    if (diasVencimiento <= 3) return <Warning />
    return <CheckCircle />
  }

  const totalPorCobrar = cuentasPorCobrar.reduce((sum, cuenta) => sum + cuenta.saldoRestante, 0)
  const facturasPendientes = cuentasPorCobrar.filter((c) => c.saldoRestante > 0).length
  const facturasVencidas = cuentasPorCobrar.filter((c) => c.diasVencimiento < 0).length

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cuentas por Cobrar
      </Typography>

      {/* Resumen */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total por Cobrar
              </Typography>
              <Typography variant="h4" color="primary">
                ₲ {totalPorCobrar.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Facturas Pendientes
              </Typography>
              <Typography variant="h4" color="warning.main">
                {facturasPendientes}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Facturas Vencidas
              </Typography>
              <Typography variant="h4" color="error.main">
                {facturasVencidas}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {facturasVencidas > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Tienes {facturasVencidas} facturas vencidas que requieren atención inmediata.
        </Alert>
      )}

      {/* Tabla de cuentas por cobrar */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nro. Factura</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha Emisión</TableCell>
              <TableCell>Fecha Vencimiento</TableCell>
              <TableCell>Monto Total</TableCell>
              <TableCell>Monto Pagado</TableCell>
              <TableCell>Saldo Restante</TableCell>
              <TableCell>Días para Vencimiento</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cuentasPorCobrar.map((cuenta) => (
              <TableRow key={cuenta.nroFactura}>
                <TableCell>{cuenta.nroFactura}</TableCell>
                <TableCell>{cuenta.cliente}</TableCell>
                <TableCell>{cuenta.fechaEmision}</TableCell>
                <TableCell>{cuenta.fechaVencimiento}</TableCell>
                <TableCell>₲ {cuenta.montoTotal.toLocaleString()}</TableCell>
                <TableCell>₲ {cuenta.montoPagado.toLocaleString()}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={cuenta.saldoRestante > 0 ? "error.main" : "success.main"}
                  >
                    ₲ {cuenta.saldoRestante.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {getEstadoIcon(cuenta.estado, cuenta.diasVencimiento)}
                    <Typography
                      variant="body2"
                      sx={{ ml: 1 }}
                      color={cuenta.diasVencimiento < 0 ? "error.main" : "text.primary"}
                    >
                      {cuenta.diasVencimiento < 0
                        ? `${Math.abs(cuenta.diasVencimiento)} días vencida`
                        : `${cuenta.diasVencimiento} días`}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={cuenta.estado}
                    color={getEstadoColor(cuenta.estado, cuenta.diasVencimiento)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleRegistrarPago(cuenta)}
                    disabled={cuenta.saldoRestante === 0}
                  >
                    <Payment />
                  </IconButton>
                  <IconButton size="small" color="secondary">
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para registrar pago */}
      <Dialog open={openPagoDialog} onClose={handleClosePagoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent>
          {facturaSeleccionada && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Factura Nro. {facturaSeleccionada.nroFactura} - {facturaSeleccionada.cliente}
                  <br />
                  Saldo pendiente: ₲ {facturaSeleccionada.saldoRestante.toLocaleString()}
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monto del Pago"
                  type="number"
                  inputProps={{
                    max: facturaSeleccionada.saldoRestante,
                    min: 0,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Fecha del Pago"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select label="Método de Pago">
                    <MenuItem value={1}>Efectivo</MenuItem>
                    <MenuItem value={2}>Transferencia Bancaria</MenuItem>
                    <MenuItem value={3}>Cheque</MenuItem>
                    <MenuItem value={4}>Tarjeta de Crédito</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Comprobante de Pago"
                  placeholder="Número de comprobante, referencia, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Observaciones" multiline rows={3} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePagoDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleClosePagoDialog}>
            Registrar Pago
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
