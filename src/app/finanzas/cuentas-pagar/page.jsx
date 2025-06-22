"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
} from "@mui/material"
import {
  AccountBalance,
  Warning,
  CheckCircle,
  Schedule,
  Payment as PaymentIcon,
  Search as SearchIcon,
  ArrowBack,
  ExpandMore,
  Receipt,
  History,
} from "@mui/icons-material"
import VisorFacturaProveedor from "@/src/components/facturas/VisorFacturaProveedor"
import Link from "next/link"
import { useRootContext } from "@/src/app/context/root"

export default function CuentasPorPagarPage() {
  const router = useRouter()
    // Verificación de permisos
  const context = useRootContext()  
  const permisos = context.session?.permisos || []
  const hasPermission = permisos.find((permiso) => permiso === "VIEW_CUENTAPORPAGAR") || context.session?.isAdmin
  const [cuentas, setCuentas] = useState([])
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [filtros, setFiltros] = useState({
    estado: "",
    proveedor: "",
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

  // Estados para el diálogo de pago
  const [dialogoPagoAbierto, setDialogoPagoAbierto] = useState(false)
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null)
  const [cargandoPago, setCargandoPago] = useState(false)
  const [datosPago, setDatosPago] = useState({
    montoPago: "",
    fechaPago: new Date().toISOString().split("T")[0],
    idMetodoPago: "",
    observacion: "",
    comprobantePago: "",
  })

  // Estados para diálogos adicionales
  const [openVisorFactura, setOpenVisorFactura] = useState(false)
  const [openHistorialPagos, setOpenHistorialPagos] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [historialPagos, setHistorialPagos] = useState([])

  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  const [metodosPago, setMetodosPago] = useState([])
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  useEffect(() => {
    cargarMetodosPago()
  }, [])

  const cargarCuentas = async (nuevaPagina = paginacion.pagina) => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtros.estado) params.append("estado", filtros.estado)
      if (filtros.proveedor) params.append("proveedor", filtros.proveedor)
      if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde)
      if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta)

      // Parámetros de paginación
      params.append("pagina", nuevaPagina.toString())
      params.append("limite", paginacion.registrosPorPagina.toString())

      const respuesta = await fetch(`/api/finanzas/cuentas-pagar?${params.toString()}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        
        // Ordenar por fecha de emisión descendente (más nuevas primero)
        const cuentasOrdenadas = (datos.data || []).sort((a, b) => {
          try {
            // Manejar diferentes formatos de fecha
            const fechaA = a.fechaEmision ? new Date(a.fechaEmision) : new Date(0)
            const fechaB = b.fechaEmision ? new Date(b.fechaEmision) : new Date(0)
            
            // Verificar que las fechas sean válidas
            if (isNaN(fechaA.getTime()) || isNaN(fechaB.getTime())) {
              console.warn('Fecha inválida encontrada:', { a: a.fechaEmision, b: b.fechaEmision })
              return 0
            }
            
            return fechaB.getTime() - fechaA.getTime() // Orden descendente
          } catch (error) {
            console.error('Error al ordenar fechas:', error)
            return 0
          }
        })
        
        console.log('Cuentas ordenadas por fecha (más nuevas primero):', 
          cuentasOrdenadas.slice(0, 3).map(c => ({ 
            nroFactura: c.nroFactura, 
            fechaEmision: c.fechaEmision,
            fechaFormateada: new Date(c.fechaEmision).toLocaleDateString()
          }))
        )
        
        setCuentas(cuentasOrdenadas)
        setResumen(datos.resumen || {})

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
      console.error("Error al cargar cuentas por pagar:", error)
      mostrarSnackbar("Error al cargar cuentas por pagar", "error")
    } finally {
      setCargando(false)
    }
  }

  const cargarMetodosPago = async () => {
    try {
      const respuesta = await fetch("/api/finanzas/metodos-pago")
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setMetodosPago(datos.data || [])
      }
    } catch (error) {
      console.error("Error al cargar métodos de pago:", error)
    }
  }

  const handleBuscar = () => {
    setBusquedaRealizada(true)
    setPaginacion((prev) => ({ ...prev, pagina: 1 }))
    cargarCuentas(1)
  }

  const handleCambioPagina = (event, nuevaPagina) => {
    if (busquedaRealizada) {
      setPaginacion((prev) => ({ ...prev, pagina: nuevaPagina }))
      cargarCuentas(nuevaPagina)
    }
  }

  const abrirDialogoPago = (cuenta) => {
    setCuentaSeleccionada(cuenta)
    setDatosPago({
      montoPago: "",
      fechaPago: new Date().toISOString().split("T")[0],
      idMetodoPago: "",
      observacion: `Pago de factura ${cuenta.nroFactura}`,
      comprobantePago: "",
    })
    setDialogoPagoAbierto(true)
  }

  const cerrarDialogoPago = () => {
    setDialogoPagoAbierto(false)
    setCuentaSeleccionada(null)
    setDatosPago({
      montoPago: "",
      fechaPago: new Date().toISOString().split("T")[0],
      idMetodoPago: "",
      observacion: "",
      comprobantePago: "",
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
      const respuesta = await fetch("/api/finanzas/pagos-proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idFacturaProveedor: cuentaSeleccionada.idFacturaProveedor,
          montoPago: montoPago,
          fechaPago: datosPago.fechaPago,
          idMetodoPago: datosPago.idMetodoPago,
          comprobantePago: datosPago.comprobantePago,
          observacion: datosPago.observacion,
        }),
      })

      if (respuesta.ok) {
        const resultado = await respuesta.json()
        mostrarSnackbar("Pago registrado exitosamente", "success")
        cerrarDialogoPago()
        // Recargar la lista
        cargarCuentas()
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

  const verHistorialPagos = async (cuenta) => {
    try {
      const respuesta = await fetch(`/api/finanzas/pagos-proveedores?idFactura=${cuenta.idFacturaProveedor}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setHistorialPagos(datos.data || [])
        setCuentaSeleccionada(cuenta)
        setOpenHistorialPagos(true)
      }
    } catch (error) {
      console.error("Error al cargar historial de pagos:", error)
      mostrarSnackbar("Error al cargar historial de pagos", "error")
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
    if (estado === "Pagada") return "success"
    if (diasVencido > 0) return "error"
    if (diasVencido > -7) return "warning"
    return "info"
  }

  const getEstadoIcon = (estado, diasVencido) => {
    if (estado === "Pagada") return <CheckCircle />
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
      fechaPago: new Date().toISOString().split("T")[0],
      idMetodoPago: "",
      observacion: `Pago ${monto === cuenta.saldoRestante ? "total" : "parcial"} de factura ${cuenta.nroFactura}`,
      comprobantePago: "",
    })
    setDialogoPagoAbierto(true)
  }

  const handleVerFactura = (cuenta) => {
    setFacturaSeleccionada(cuenta.idFacturaProveedor)
    setOpenVisorFactura(true)
  }

  const handleVerHistorial = (cuenta) => {
    verHistorialPagos(cuenta)
  }
  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Cuentas por Pagar
        </Typography>
      </Box>

      {/* Resumen */}
      {resumen && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total por Pagar
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      ₲ {resumen.totalPorPagar?.toLocaleString("es-PY") || "0"}
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
                      {resumen.totalCuentas || 0}
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
                      {resumen.cuentasVencidas || 0}
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
                  <AccountBalance color="error" sx={{ mr: 2 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Monto Vencido
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      ₲ {resumen.montoVencido?.toLocaleString("es-PY") || "0"}
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
                label="Buscar Proveedor"
                value={filtros.proveedor}
                onChange={(e) => setFiltros({ ...filtros, proveedor: e.target.value })}
                placeholder="Razón social..."
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
                  <MenuItem value="pagada">Pagada</MenuItem>
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
                startIcon={cargando ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {cargando ? "Buscando..." : "Buscar"}
              </Button>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFiltros({ estado: "", proveedor: "", fechaDesde: "", fechaHasta: "" })
                  setBusquedaRealizada(false)
                  setCuentas([])
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
            Mostrando {cuentas.length} de {paginacion.totalRegistros} cuentas
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

      {/* Lista de cuentas por pagar */}
      {cargando ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : !busquedaRealizada ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Use los filtros y haga clic en "Buscar" para ver las cuentas por pagar.
            </Typography>
          </CardContent>
        </Card>
      ) : cuentas.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              No se encontraron cuentas por pagar con los criterios seleccionados.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {/* Encabezados de columnas */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 2 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Fecha Emisión
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Factura
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Proveedor
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Vencimiento
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Monto
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Estado
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                    Acciones
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {cuentas.map((cuenta) => (
            <Accordion key={cuenta.idCuentaPagar} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={2}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatearFecha(cuenta.fechaEmision)}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      #{cuenta.nroFactura}
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2">{cuenta.proveedor}</Typography>
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
                        abrirDialogoPago(cuenta)
                      }}
                      sx={{
                        cursor: cuenta.saldoRestante === 0 ? "default" : "pointer",
                        opacity: cuenta.saldoRestante === 0 ? 0.5 : 1,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <PaymentIcon color={cuenta.saldoRestante === 0 ? "disabled" : "primary"} fontSize="small" />
                    </Box>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Detalles de la Cuenta por Pagar
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>Proveedor:</strong> {cuenta.proveedor}
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
                      startIcon={<PaymentIcon />}
                      onClick={() => abrirDialogoPago(cuenta)}
                      disabled={cuenta.saldoRestante === 0}
                    >
                      Registrar Pago
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePagoRapido(cuenta, cuenta.saldoRestante)}
                      disabled={cuenta.saldoRestante === 0}
                      startIcon={<PaymentIcon />}
                    >
                      Pago Total
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePagoRapido(cuenta, cuenta.saldoRestante / 2)}
                      disabled={cuenta.saldoRestante === 0}
                      startIcon={<PaymentIcon />}
                    >
                      50%
                    </Button>
                    <Button variant="outlined" startIcon={<Receipt />} onClick={() => handleVerFactura(cuenta)}>
                      Ver Factura
                    </Button>
                    <Button variant="outlined" startIcon={<History />} onClick={() => handleVerHistorial(cuenta)}>
                      Historial de Pagos
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
      <Dialog open={dialogoPagoAbierto} onClose={cerrarDialogoPago} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Pago</DialogTitle>
        <DialogContent>
          {cuentaSeleccionada && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Factura Nro. {cuentaSeleccionada.nroFactura}</strong>
                    <br />
                    Proveedor: {cuentaSeleccionada.proveedor}
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
                <TextField
                  fullWidth
                  label="Fecha de Pago"
                  type="date"
                  value={datosPago.fechaPago}
                  onChange={(e) => setDatosPago({ ...datosPago, fechaPago: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={datosPago.idMetodoPago}
                    onChange={(e) => setDatosPago({ ...datosPago, idMetodoPago: e.target.value })}
                    label="Método de Pago"
                  >
                    {metodosPago.map((metodo) => (
                      <MenuItem key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                        {metodo.descMetodoPago}
                      </MenuItem>
                    ))}
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
                  value={datosPago.observacion}
                  onChange={(e) => setDatosPago({ ...datosPago, observacion: e.target.value })}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoPago} disabled={cargandoPago}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={registrarPago}
            disabled={cargandoPago}
            startIcon={cargandoPago ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            {cargandoPago ? "Registrando..." : "Registrar Pago"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para historial de pagos */}
      <Dialog open={openHistorialPagos} onClose={() => setOpenHistorialPagos(false)} maxWidth="md" fullWidth>
        <DialogTitle>Historial de Pagos</DialogTitle>
        <DialogContent>
          {cuentaSeleccionada && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Factura: {cuentaSeleccionada.nroFactura}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Proveedor: {cuentaSeleccionada.proveedor}
              </Typography>

              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Método</TableCell>
                      <TableCell>Comprobante</TableCell>
                      <TableCell>Observación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historialPagos.map((pago) => (
                      <TableRow key={pago.idPago}>
                        <TableCell>{new Date(pago.fechaPago).toLocaleDateString("es-PY")}</TableCell>
                        <TableCell>₲ {pago.montoPago.toLocaleString("es-PY")}</TableCell>
                        <TableCell>{pago.metodoPago.descMetodoPago}</TableCell>
                        <TableCell>{pago.comprobantePago}</TableCell>
                        <TableCell>{pago.observaciones}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistorialPagos(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>

      {/* Diálogos adicionales */}
      <VisorFacturaProveedor
        open={openVisorFactura}
        onClose={() => setOpenVisorFactura(false)}
        facturaId={facturaSeleccionada}
      />
    </Container>
  )
}
