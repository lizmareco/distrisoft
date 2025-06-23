"use client"

import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Button,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  CreditCard as CreditCardIcon,
  Schedule as ScheduleIcon,
} from "@mui/icons-material"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import VisorFacturaProveedor from "./VisorFacturaProveedor"

export default function FacturasOrdenCompra({ idOrdenCompra }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedFactura, setExpandedFactura] = useState(null)
  const [visorFactura, setVisorFactura] = useState({ open: false, facturaId: null })

  useEffect(() => {
    if (idOrdenCompra) {
      fetchFacturas()
    }
  }, [idOrdenCompra])

  const fetchFacturas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/ordenes-compra/${idOrdenCompra}/facturas`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Error al cargar las facturas")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de red o servidor")
    } finally {
      setLoading(false)
    }
  }

  const handleExpandFactura = (facturaId) => {
    setExpandedFactura(expandedFactura === facturaId ? null : facturaId)
  }

  const handleVerFactura = (facturaId) => {
    setVisorFactura({ open: true, facturaId })
  }

  const getEstadoChipColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "registrada":
        return "default"
      case "pagada":
        return "success"
      case "parcial":
        return "warning"
      case "anulada":
        return "error"
      default:
        return "default"
    }
  }

  const getTipoChipColor = (tipo) => {
    return tipo === "contado" ? "primary" : "secondary"
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-PY", { 
      style: "currency", 
      currency: "PYG" 
    }).format(amount)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!data) {
    return (
      <Alert severity="info">
        No se encontraron datos de facturas para esta orden de compra.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Información de la orden de compra */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Información de la Orden de Compra #{data.ordenCompra.idOrdenCompra}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Fecha:</strong> {format(new Date(data.ordenCompra.fechaOrden), "dd/MM/yyyy", { locale: es })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Estado:</strong> {data.ordenCompra.estado}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Proveedor:</strong> {data.ordenCompra.proveedor.razonSocial}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>RUC:</strong> {data.ordenCompra.proveedor.ruc}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Monto Total Cotización:</strong> {formatCurrency(data.ordenCompra.montoTotalCotizacion)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen de facturas */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumen de Facturas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {data.totalFacturas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Facturas
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {formatCurrency(data.totalMontoFacturado)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto Facturado
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main">
                  {formatCurrency(data.totalPagosRealizados)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pagos Realizados
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {formatCurrency(data.totalSaldoPendiente)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Saldo Pendiente
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de facturas */}
      {data.facturas.length === 0 ? (
        <Alert severity="info">
          No hay facturas registradas para esta orden de compra.
        </Alert>
      ) : (
        <Paper sx={{ width: "100%", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nro. Factura</TableCell>
                  <TableCell>Fecha Emisión</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Monto Total</TableCell>
                  <TableCell>Saldo Pendiente</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.facturas.map((factura) => (
                  <React.Fragment key={factura.idFactura}>
                    <TableRow hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <ReceiptIcon color="primary" fontSize="small" />
                          {factura.nroFactura}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(factura.fechaEmision), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={factura.tipo.toUpperCase()}
                          color={getTipoChipColor(factura.tipo)}
                          size="small"
                          icon={factura.tipo === "contado" ? <PaymentIcon /> : <ScheduleIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={factura.estado}
                          color={getEstadoChipColor(factura.estado)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(factura.montoTotal)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={factura.saldoPendiente > 0 ? "error" : "success"}
                          fontWeight="bold"
                        >
                          {formatCurrency(factura.saldoPendiente)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Tooltip title="Ver factura">
                            <IconButton
                              size="small"
                              onClick={() => handleVerFactura(factura.idFactura)}
                              color="primary"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={expandedFactura === factura.idFactura ? "Ocultar detalles" : "Ver detalles"}>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandFactura(factura.idFactura)}
                              color="primary"
                            >
                              {expandedFactura === factura.idFactura ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    {/* Fila expandible con detalles */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expandedFactura === factura.idFactura} timeout="auto" unmountOnExit>
                          <Box sx={{ bgcolor: 'grey.50', p: 2 }}>
                            <Grid container spacing={2}>
                              {/* Información general */}
                              <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                  Información General
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Proveedor:</strong> {factura.proveedor.razonSocial}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>RUC:</strong> {factura.proveedor.ruc}
                                </Typography>
                                {factura.fechaVencimiento && (
                                  <Typography variant="body2">
                                    <strong>Fecha Vencimiento:</strong> {format(new Date(factura.fechaVencimiento), "dd/MM/yyyy", { locale: es })}
                                  </Typography>
                                )}
                                {factura.plazoPago && (
                                  <Typography variant="body2">
                                    <strong>Plazo de Pago:</strong> {factura.plazoPago} días
                                  </Typography>
                                )}
                                {factura.observacion && (
                                  <Typography variant="body2">
                                    <strong>Observación:</strong> {factura.observacion}
                                  </Typography>
                                )}
                              </Grid>

                              {/* Información de pagos */}
                              <Grid item xs={12} md={6}>
                                <Typography variant="h6" gutterBottom>
                                  Información de Pagos
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Monto Total:</strong> {formatCurrency(factura.montoTotal)}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Total Pagado:</strong> {formatCurrency(factura.totalPagos)}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>Saldo Pendiente:</strong> {formatCurrency(factura.saldoPendiente)}
                                </Typography>
                                {factura.cuentaPorPagar && (
                                  <>
                                    <Typography variant="body2">
                                      <strong>Estado Cuenta:</strong> {factura.cuentaPorPagar.estadoCuenta}
                                    </Typography>
                                    <Typography variant="body2">
                                      <strong>Días Vencido:</strong> {factura.cuentaPorPagar.diasVencido}
                                    </Typography>
                                  </>
                                )}
                              </Grid>

                              {/* Detalles de la factura */}
                              <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                  Detalles de Materias Primas
                                </Typography>
                                <TableContainer component={Paper} variant="outlined">
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Materia Prima</TableCell>
                                        <TableCell align="right">Cantidad</TableCell>
                                        <TableCell align="right">Precio Unitario</TableCell>
                                        <TableCell align="right">Subtotal</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {factura.detalles.map((detalle, index) => (
                                        <TableRow key={index}>
                                          <TableCell>{detalle.materiaPrima.nombreMateriaPrima}</TableCell>
                                          <TableCell align="right">{detalle.cantidadFacturada}</TableCell>
                                          <TableCell align="right">
                                            {formatCurrency(detalle.precioUnitarioFinal)}
                                          </TableCell>
                                          <TableCell align="right">
                                            {formatCurrency(detalle.subtotalFinal)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </Grid>

                              {/* Historial de pagos */}
                              {factura.pagos.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="h6" gutterBottom>
                                    Historial de Pagos
                                  </Typography>
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Fecha</TableCell>
                                          <TableCell>Método</TableCell>
                                          <TableCell align="right">Monto</TableCell>
                                          <TableCell>Comprobante</TableCell>
                                          <TableCell>Operador</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {factura.pagos.map((pago) => (
                                          <TableRow key={pago.idPago}>
                                            <TableCell>
                                              {format(new Date(pago.fechaPago), "dd/MM/yyyy", { locale: es })}
                                            </TableCell>
                                            <TableCell>{pago.metodoPago}</TableCell>
                                            <TableCell align="right">
                                              {formatCurrency(pago.montoPago)}
                                            </TableCell>
                                            <TableCell>{pago.comprobantePago || "N/A"}</TableCell>
                                            <TableCell>{pago.operador}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Visor de Factura */}
      <VisorFacturaProveedor
        open={visorFactura.open}
        onClose={() => setVisorFactura({ open: false, facturaId: null })}
        facturaId={visorFactura.facturaId}
      />
    </Box>
  )
} 