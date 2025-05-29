"use client"

import { useState } from "react"
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
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
  CircularProgress,
  Pagination,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import {
  Payment,
  Warning,
  CheckCircle,
  Schedule,
  ExpandMore,
  Search,
  AccountBalance,
  TrendingDown,
  Receipt,
  History,
} from "@mui/icons-material"
import VisorFactura from "@/src/components/facturas/VisorFactura"
import HistorialPagos from "@/src/components/pagos/HistorialPagos"
import Link from "next/link"
import ArrowBack from "@mui/icons-material/ArrowBack"

export default function CuentasPorCobrarPage() {
  const [cuentasPorCobrar, setCuentasPorCobrar] = useState([])
  const [cargando, setCargando] = useState(false)
  const [resumen, setResumen] = useState(null)
  const [filtros, setFiltros] = useState({
    estado: "",
    cliente: "",
    fechaDesde: "",
    fechaHasta: "",
  })

  // Estados para paginación
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 10,
  })

  // Estados para diálogo de pago
  const [openPagoDialog, setOpenPagoDialog] = useState(false)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  const [cargandoPago, setCargandoPago] = useState(false)
  const [datosPago, setDatosPago] = useState({
    montoPago: "",
    idMetodoPago: 1,
    comprobantePago: "",
    observaciones: "",
  })

  // Estados para diálogos adicionales
  const [openVisorFactura, setOpenVisorFactura] = useState(false)
  const [openHistorialPagos, setOpenHistorialPagos] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)

  // Agregar después de los estados para diálogos adicionales

  // Estados para snackbar
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Estado para búsqueda realizada
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Cargar cuentas por cobrar
  const cargarCuentasPorCobrar = async (nuevaPagina = paginacion.pagina) => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtros.estado) params.append("estado", filtros.estado)
      if (filtros.cliente) params.append("cliente", filtros.cliente)
      if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde)
      if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta)

      // Parámetros de paginación
      params.append("pagina", nuevaPagina.toString())
      params.append("limite", paginacion.registrosPorPagina.toString())

      const respuesta = await fetch(`/api/finanzas/cuentas-cobrar?${params.toString()}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setCuentasPorCobrar(datos.data || [])
        setResumen(datos.resumen)

        if (datos.meta) {
          setPaginacion((prev) => ({
            ...prev,
            pagina: datos.meta.page,
            totalPaginas: datos.meta.totalPages,
            totalRegistros: datos.meta.total,
          }))
        }
      }
    } catch (error) {
      console.error("Error al cargar cuentas por cobrar:", error)
      mostrarSnackbar("Error al cargar cuentas por cobrar", "error")
    } finally {
      setCargando(false)
    }
  }

  const handleBuscar = () => {
    setBusquedaRealizada(true)
    setPaginacion((prev) => ({ ...prev, pagina: 1 }))
    cargarCuentasPorCobrar(1)
  }

  const handleCambioPagina = (event, nuevaPagina) => {
    if (busquedaRealizada) {
      setPaginacion((prev) => ({ ...prev, pagina: nuevaPagina }))
      cargarCuentasPorCobrar(nuevaPagina)
    }
  }

  const handleRegistrarPago = (cuenta) => {
    setCuentaSeleccionada(cuenta)
    setDatosPago({
      montoPago: "",
      idMetodoPago: 1,
      comprobantePago: "",
      observaciones: `Pago de factura #${cuenta.nroFactura}`,
    })
    setOpenPagoDialog(true)
  }

  const handleClosePagoDialog = () => {
    setOpenPagoDialog(false)
    setCuentaSeleccionada(null)
    setDatosPago({
      montoPago: "",
      idMetodoPago: 1,
      comprobantePago: "",
      observaciones: "",
    })
  }

  const registrarPago = async () => {
    if (!cuentaSeleccionada || !datosPago.montoPago) {
      mostrarSnackbar("Debe ingresar el monto del pago", "warning")
      return
    }

    const montoPago = Number.parseFloat(datosPago.montoPago)
    if (montoPago <= 0) {
      mostrarSnackbar("El monto debe ser mayor a cero", "warning")
      return
    }

    if (montoPago > cuentaSeleccionada.saldoRestante) {
      mostrarSnackbar("El monto no puede ser mayor al saldo restante", "warning")
      return
    }

    setCargandoPago(true)
    try {
      const respuesta = await fetch("/api/finanzas/pagos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nroFactura: cuentaSeleccionada.nroFactura,
          montoPago: montoPago,
          idMetodoPago: datosPago.idMetodoPago,
          comprobantePago: datosPago.comprobantePago,
          observaciones: datosPago.observaciones,
        }),
      })

      if (respuesta.ok) {
        const resultado = await respuesta.json()
        mostrarSnackbar("Pago registrado exitosamente", "success")
        handleClosePagoDialog()
        // Recargar la lista
        cargarCuentasPorCobrar()
      } else {
        const error = await respuesta.json()
        mostrarSnackbar(error.error || "Error al registrar pago", "error")
      }
    } catch (error) {
      console.error("Error al registrar pago:", error)
      mostrarSnackbar("Error al registrar pago", "error")
    } finally {
      setCargandoPago(false)
    }
  }

  const mostrarSnackbar = (mensaje, tipo) => {
    setSnackbar({
      abierto: true,
      mensaje,
      tipo,
    })
  }

  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  const getEstadoColor = (estado, diasVencido) => {
    if (estado === "Cobrada") return "success"
    if (diasVencido > 0) return "error"
    if (diasVencido > -7) return "warning"
    return "info"
  }

  const getEstadoIcon = (estado, diasVencido) => {
    if (estado === "Cobrada") return <CheckCircle />
    if (diasVencido > 0) return <Warning />
    if (diasVencido > -7) return <Schedule />
    return <CheckCircle />
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-PY")
  }

  const handlePagoRapido = (cuenta, monto) => {
    setCuentaSeleccionada(cuenta)
    setDatosPago({
      montoPago: monto.toString(),
      idMetodoPago: 1,
      comprobantePago: "",
      observaciones: `Pago ${monto === cuenta.saldoRestante ? "total" : "parcial"} de factura #${cuenta.nroFactura}`,
    })
    setOpenPagoDialog(true)
  }

  const handleVerFactura = (cuenta) => {
    setFacturaSeleccionada(cuenta.nroFactura)
    setOpenVisorFactura(true)
  }

  const handleVerHistorial = (cuenta) => {
    setFacturaSeleccionada(cuenta.nroFactura)
    setOpenHistorialPagos(true)
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} href="/dashboard" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
      </Button>
      <Typography variant="h4" component="h1" gutterBottom>
        Cuentas por Cobrar
      </Typography>

      {/* Resumen */}
      {resumen && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance color="primary" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total por Cobrar
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ₲ {resumen.totalPorCobrar.toLocaleString("es-PY")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="warning" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Cuentas Pendientes
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {resumen.totalCuentas}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Warning color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Cuentas Vencidas
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {resumen.cuentasVencidas}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingDown color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Monto Vencido
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      ₲ {resumen.montoVencido.toLocaleString("es-PY")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alertas */}
      {resumen && resumen.cuentasVencidas > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Tienes {resumen.cuentasVencidas} cuentas vencidas por un monto de ₲{" "}
          {resumen.montoVencido.toLocaleString("es-PY")} que requieren atención inmediata.
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros de Búsqueda
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Buscar Cliente"
                value={filtros.cliente}
                onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                placeholder="Nombre o apellido..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                  label="Estado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="vigente">Vigente</MenuItem>
                  <MenuItem value="vencida">Vencida</MenuItem>
                  <MenuItem value="cobrada">Cobrada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Fecha Desde"
                type="date"
                size="small"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Fecha Hasta"
                type="date"
                size="small"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleBuscar}
                disabled={cargando}
                fullWidth
                startIcon={cargando ? <CircularProgress size={20} /> : <Search />}
              >
                {cargando ? "Buscando..." : "Buscar"}
              </Button>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFiltros({ estado: "", cliente: "", fechaDesde: "", fechaHasta: "" })
                  setBusquedaRealizada(false)
                  setCuentasPorCobrar([])
                }}
                fullWidth
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información de paginación */}
      {busquedaRealizada && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {cuentasPorCobrar.length} de {paginacion.totalRegistros} cuentas
            {paginacion.totalPaginas > 1 && ` (Página ${paginacion.pagina} de ${paginacion.totalPaginas})`}
          </Typography>
          {paginacion.totalPaginas > 1 && (
            <Pagination
              count={paginacion.totalPaginas}
              page={paginacion.pagina}
              onChange={handleCambioPagina}
              color="primary"
              size="small"
            />
          )}
        </Box>
      )}

      {/* Lista de cuentas por cobrar */}
      {cargando ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : !busquedaRealizada ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Use los filtros y haga clic en "Buscar" para ver las cuentas por cobrar.
            </Typography>
          </CardContent>
        </Card>
      ) : cuentasPorCobrar.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              No se encontraron cuentas por cobrar con los criterios seleccionados.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {cuentasPorCobrar.map((cuenta) => (
            <Accordion key={cuenta.idCuentaCobrar} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={1}>
                    {getEstadoIcon(cuenta.estadoCuenta, cuenta.diasVencido)}
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Factura #{cuenta.nroFactura}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatearFecha(cuenta.fechaEmision)}
                    </Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2">{cuenta.cliente}</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">Vence: {formatearFecha(cuenta.fechaVencimiento)}</Typography>
                    {cuenta.diasVencido > 0 && (
                      <Typography variant="caption" color="error">
                        {cuenta.diasVencido} días vencida
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" fontWeight="bold">
                      ₲ {cuenta.montoOriginal.toLocaleString("es-PY")}
                    </Typography>
                    <Typography variant="body2" color="error" fontWeight="bold">
                      Saldo: ₲ {cuenta.saldoRestante.toLocaleString("es-PY")}
                    </Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Chip
                      label={cuenta.estadoCuenta}
                      color={getEstadoColor(cuenta.estadoCuenta, cuenta.diasVencido)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={1}>
                    <Box
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRegistrarPago(cuenta)
                      }}
                      sx={{
                        cursor: cuenta.saldoRestante === 0 ? "default" : "pointer",
                        opacity: cuenta.saldoRestante === 0 ? 0.5 : 1,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <Payment color={cuenta.saldoRestante === 0 ? "disabled" : "primary"} fontSize="small" />
                    </Box>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Detalles de la Cuenta por Cobrar
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Cliente:</strong> {cuenta.cliente}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Estado de Factura:</strong> {cuenta.estadoFactura}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Estado de Cuenta:</strong> {cuenta.estadoCuenta}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Monto Original:</strong> ₲ {cuenta.montoOriginal.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Total Pagos:</strong> ₲ {cuenta.totalPagos.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="error" fontWeight="bold">
                        <strong>Saldo Restante:</strong> ₲ {cuenta.saldoRestante.toLocaleString("es-PY")}
                      </Typography>
                    </Grid>
                  </Grid>

                  {cuenta.ultimoPago && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Último Pago:
                      </Typography>
                      <Typography variant="body2">
                        {formatearFecha(cuenta.ultimoPago.fecha)} - ₲ {cuenta.ultimoPago.monto.toLocaleString("es-PY")}{" "}
                        ({cuenta.ultimoPago.metodoPago})
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Payment />}
                      onClick={() => handleRegistrarPago(cuenta)}
                      disabled={cuenta.saldoRestante === 0}
                    >
                      Registrar Cobro
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePagoRapido(cuenta, cuenta.saldoRestante)}
                      disabled={cuenta.saldoRestante === 0}
                      startIcon={<Payment />}
                    >
                      Cobro Total
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePagoRapido(cuenta, cuenta.saldoRestante / 2)}
                      disabled={cuenta.saldoRestante === 0}
                      startIcon={<Payment />}
                    >
                      50%
                    </Button>
                    <Button variant="outlined" startIcon={<Receipt />} onClick={() => handleVerFactura(cuenta)}>
                      Ver Factura
                    </Button>
                    <Button variant="outlined" startIcon={<History />} onClick={() => handleVerHistorial(cuenta)}>
                      Historial de Cobros
                    </Button>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Paginación inferior */}
      {busquedaRealizada && paginacion.totalPaginas > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={paginacion.totalPaginas}
            page={paginacion.pagina}
            onChange={handleCambioPagina}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Dialog para registrar pago */}
      <Dialog open={openPagoDialog} onClose={handleClosePagoDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent>
          {cuentaSeleccionada && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Factura Nro. {cuentaSeleccionada.nroFactura}</strong>
                    <br />
                    Cliente: {cuentaSeleccionada.cliente}
                    <br />
                    Saldo pendiente: ₲ {cuentaSeleccionada.saldoRestante.toLocaleString("es-PY")}
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monto del Pago"
                  type="number"
                  value={datosPago.montoPago}
                  onChange={(e) => setDatosPago({ ...datosPago, montoPago: e.target.value })}
                  inputProps={{
                    max: cuentaSeleccionada.saldoRestante,
                    min: 0,
                    step: "0.01",
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={datosPago.idMetodoPago}
                    onChange={(e) => setDatosPago({ ...datosPago, idMetodoPago: e.target.value })}
                    label="Método de Pago"
                  >
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
                  value={datosPago.comprobantePago}
                  onChange={(e) => setDatosPago({ ...datosPago, comprobantePago: e.target.value })}
                  placeholder="Número de comprobante, referencia, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={3}
                  value={datosPago.observaciones}
                  onChange={(e) => setDatosPago({ ...datosPago, observaciones: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePagoDialog} disabled={cargandoPago}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={registrarPago}
            disabled={cargandoPago}
            startIcon={cargandoPago ? <CircularProgress size={20} /> : <Payment />}
          >
            {cargandoPago ? "Registrando..." : "Registrar Pago"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>

      {/* Diálogos adicionales */}
      <VisorFactura
        open={openVisorFactura}
        onClose={() => setOpenVisorFactura(false)}
        nroFactura={facturaSeleccionada}
      />

      <HistorialPagos
        open={openHistorialPagos}
        onClose={() => setOpenHistorialPagos(false)}
        nroFactura={facturaSeleccionada}
      />
    </Container>
  )
}
