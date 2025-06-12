"use client"

import { useState } from "react"
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
  Tab,
  Tabs,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  CircularProgress,
  Pagination,
  Snackbar,
  Alert,
} from "@mui/material"
import {
  Receipt,
  Assignment,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Warning,
  CheckCircle,
  Schedule,
} from "@mui/icons-material"
import VistaPreviaFactura from "../../components/facturas/VistaPrevia"
import VisorFacturaProveedor from "../../components/facturas/VisorFacturaProveedor"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import CreditScoreSharpIcon from "@mui/icons-material/CreditScoreSharp"
import { Menu } from "@mui/material"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import VistaPreviaNotaCredito from "../../components/notas-credito/VistaPreviaNotaCredito"
import { useRootContext } from "@/src/app/context/root"

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`finanzas-tabpanel-${index}`}
      aria-labelledby={`finanzas-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function FinanzasPage() {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  // Obtener contexto para permisos
  const context = useRootContext()

  // Después de declarar todos los hooks, realizamos la verificación de permisos
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find((permiso) => permiso === "VIEW_NOTACREDITO") || context.session?.isAdmin

  // Definimos el contenido a renderizar según permisos
  const content = !hasPermission ? (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Alert severity="error">No tiene permisos para ver esta página</Alert>
    </Container>
  ) : (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
        Volver a Gestión
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión Financiera
        </Typography>
      </Box>
      {/* Navegación por pestañas */}
      <Paper sx={{ width: "100%", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Facturación Clientes" icon={<Receipt />} />
          <Tab label="Facturas Proveedores" icon={<Assignment />} />
        </Tabs>
      </Paper>
      {/* Contenido de las pestañas */}
      <TabPanel value={tabValue} index={0}>
        <FacturacionClientes />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <FacturasProveedores />
      </TabPanel>
    </Container>
  )

  return content
}

// Componente para Facturación de Clientes 
function FacturacionClientes() {
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [filtros, setFiltros] = useState({
    tipo: "",
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
  })
  const [anchorElNota, setAnchorElNota] = useState(null)
  const [facturaConNotas, setFacturaConNotas] = useState(null)
  const abrirMenuNotas = (event, factura) => {
    setAnchorElNota(event.currentTarget)
    setFacturaConNotas(factura)
  }
  const cerrarMenuNotas = () => {
    setAnchorElNota(null)
    setFacturaConNotas(null)
  }
  // Estados para paginación
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 10,
  })
  // Estados para vista previa
  const [vistaPreviaAbierta, setVistaPreviaAbierta] = useState(false)
  const [facturaParaPrevia, setFacturaParaPrevia] = useState(null)
  const [cargandoFactura, setCargandoFactura] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })
  // Nuevo estado para controlar si se ha realizado una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [vistaPreviaNotaAbierta, setVistaPreviaNotaAbierta] = useState(false)
  const [notaParaPrevia, setNotaParaPrevia] = useState(null)

  const cargarFacturas = async (nuevaPagina = paginacion.pagina) => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtros.tipo) params.append("tipo", filtros.tipo)
      if (filtros.estado) params.append("estado", filtros.estado)
      if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde)
      if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta)

      // Parámetros de paginación
      params.append("pagina", nuevaPagina.toString())
      params.append("limite", paginacion.registrosPorPagina.toString())

      const respuesta = await fetch(`/api/finanzas/facturas-clientes?${params.toString()}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setFacturas(datos.data || [])

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
      console.error("Error al cargar facturas:", error)
      mostrarSnackbar("Error al cargar facturas", "error")
    } finally {
      setCargando(false)
    }
  }

  const handleBuscar = () => {
    setBusquedaRealizada(true)
    setPaginacion((prev) => ({ ...prev, pagina: 1 }))
    cargarFacturas(1)
  }

  const handleCambioPagina = (event, nuevaPagina) => {
    if (busquedaRealizada) {
      setPaginacion((prev) => ({ ...prev, pagina: nuevaPagina }))
      cargarFacturas(nuevaPagina)
    }
  }

  const verFactura = async (factura) => {
    setCargandoFactura(true)
    try {
      setFacturaParaPrevia(factura.nroFactura)
      setVistaPreviaAbierta(true)
    } catch (error) {
      console.error("Error al cargar factura:", error)
      mostrarSnackbar(`Error al cargar detalles de la factura: ${error.message}`, "error")
    } finally {
      setCargandoFactura(false)
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

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "emitida":
        return "primary"
      case "enviada":
        return "info"
      case "cobrada":
        return "success"
      case "anulada":
        return "error"
      default:
        return "default"
    }
  }

  const getTipoColor = (tipo) => {
    return tipo === "contado" ? "success" : "warning"
  }

  const getEstadoCuentaIcon = (factura) => {
    if (factura.tipo === "contado") return <CheckCircle color="success" />
    if (factura.diasVencido > 0) return <Warning color="error" />
    if (factura.diasVencido > -7) return <Schedule color="warning" />
    return <CheckCircle color="success" />
  }

  return (
    <Grid container spacing={3}>
      {/* Filtros */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                    label="Tipo"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="contado">Contado</MenuItem>
                    <MenuItem value="credito">Crédito</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={filtros.estado}
                    onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                    label="Estado"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="emitida">Emitida</MenuItem>
                    <MenuItem value="enviada">Enviada</MenuItem>
                    <MenuItem value="cobrada">Cobrada</MenuItem>
                    <MenuItem value="anulada">Anulada</MenuItem>
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
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Lista de Facturas */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Facturas de Clientes</Typography>
              {paginacion.totalRegistros > 0 && (
                <Typography variant="body2" color="textSecondary">
                  Mostrando {(paginacion.pagina - 1) * paginacion.registrosPorPagina + 1} -{" "}
                  {Math.min(paginacion.pagina * paginacion.registrosPorPagina, paginacion.totalRegistros)} de{" "}
                  {paginacion.totalRegistros} facturas
                </Typography>
              )}
            </Box>

            {/* Cabecera de la tabla */}
            <Box sx={{ mb: 1, px: 2, py: 1, backgroundColor: "grey.100", borderRadius: 1 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Estado
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Número
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Fecha
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Cliente
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Monto
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Estado
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Acciones
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Lista de facturas */}
            <Box>
              {cargando ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : !busquedaRealizada ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Utilice los filtros y haga clic en "Buscar" para ver las facturas.
                </Typography>
              ) : facturas.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  No se encontraron facturas con los criterios seleccionados.
                </Typography>
              ) : (
                <>
                  {/* Lista simple de facturas */}
                  <Box>
                    {facturas.map((factura) => (
                      <Card key={factura.nroFactura} sx={{ mb: 1, position: "relative" }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={1}>
                              {getEstadoCuentaIcon(factura)}
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                #001-001-{String(factura.nroFactura).padStart(7, "0")}
                              </Typography>
                              <Chip
                                label={factura.tipo.toUpperCase()}
                                color={getTipoColor(factura.tipo)}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="body2">
                                {new Date(factura.fechaEmision).toLocaleDateString("es-PY")}
                              </Typography>
                              {factura.fechaVencimiento && (
                                <Typography variant="caption" color="textSecondary">
                                  Vence: {new Date(factura.fechaVencimiento).toLocaleDateString("es-PY")}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">{factura.cliente}</Typography>
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="body2" fontWeight="bold">
                                ₲ {factura.montoTotal.toLocaleString("es-PY")}
                              </Typography>
                              {factura.tipo === "credito" && factura.saldoRestante > 0 && (
                                <Typography variant="caption" color="error">
                                  Saldo: ₲ {factura.saldoRestante.toLocaleString("es-PY")}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={1}>
                              <Chip label={factura.estado} color={getEstadoColor(factura.estado)} size="small" />
                            </Grid>
                            <Grid item xs={1}>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                {/* Vista previa de factura */}
                                <IconButton
                                  size="small"
                                  color="primary"
                                  title="Vista previa"
                                  onClick={() => verFactura(factura)}
                                  disabled={cargandoFactura}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>

                                {/* Crear nueva nota de crédito */}
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  title="Generar Nota Crédito"
                                  component={Link}
                                  href={`/finanzas/notas-credito/nueva?nroFactura=${factura.nroFactura}`}
                                >
                                  <CreditScoreSharpIcon fontSize="small" />
                                </IconButton>

                                {/* Mostrar nota de crédito en PDF si existe */}
                                {factura.notasCredito?.length === 1 && (
                                  <IconButton
                                    size="small"
                                    color="success"
                                    title="Descargar Nota Crédito PDF"
                                    component="a"
                                    href={`/api/finanzas/notas-credito/${factura.notasCredito[0].idNotaCredito}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Assignment fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                        {/* Mostrar notas de crédito asociadas (solo para clientes) */}
                        {factura.notasCredito && factura.notasCredito.length > 0 && (
                          <Box sx={{ mt: 2, ml: 4 }}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                              Notas de Crédito Asociadas:
                            </Typography>
                            <Grid container spacing={1}>
                              {factura.notasCredito.map((nota) => (
                                <Grid item key={nota.idNotaCredito}>
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    startIcon={<Assignment />}
                                    onClick={() => {
                                      setNotaParaPrevia(nota.idNotaCredito)
                                      setVistaPreviaNotaAbierta(true)
                                    }}
                                    sx={{ mr: 1 }}
                                  >
                                    {nota.nroNota} - ₲ {nota.montoTotal.toLocaleString("es-PY")}
                                  </Button>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Box>

                  {/* Paginación */}
                  {paginacion.totalPaginas > 1 && (
                    <Box display="flex" justifyContent="center" mt={3}>
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
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Vista previa de factura */}
      {facturaParaPrevia && (
        <VistaPreviaFactura
          open={vistaPreviaAbierta}
          onClose={() => setVistaPreviaAbierta(false)}
          facturaId={facturaParaPrevia}
        />
      )}

      {/* Vista previa de nota de crédito */}
      {notaParaPrevia && (
        <VistaPreviaNotaCredito
          open={vistaPreviaNotaAbierta}
          onClose={() => setVistaPreviaNotaAbierta(false)}
          notaId={notaParaPrevia}
        />
      )}

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

// Componente para Facturas de Proveedores - NUEVO
function FacturasProveedores() {
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [filtros, setFiltros] = useState({
    tipo: "",
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

  // Estados para visor de factura
  const [visorAbierto, setVisorAbierto] = useState(false)
  const [facturaParaVisor, setFacturaParaVisor] = useState(null)
  const [cargandoFactura, setCargandoFactura] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Estado para controlar si se ha realizado una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  const cargarFacturas = async (nuevaPagina = paginacion.pagina) => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtros.tipo) params.append("tipo", filtros.tipo)
      if (filtros.estado) params.append("estado", filtros.estado)
      if (filtros.proveedor) params.append("proveedor", filtros.proveedor)
      if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde)
      if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta)

      const respuesta = await fetch(`/api/finanzas/facturas-proveedores?${params.toString()}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setFacturas(datos.data || [])

        // Calcular paginación simple
        const totalFacturas = datos.data?.length || 0
        const totalPaginas = Math.ceil(totalFacturas / paginacion.registrosPorPagina)

        setPaginacion((prev) => ({
          ...prev,
          totalPaginas,
          totalRegistros: totalFacturas,
        }))
      }
    } catch (error) {
      console.error("Error al cargar facturas de proveedores:", error)
      mostrarSnackbar("Error al cargar facturas", "error")
    } finally {
      setCargando(false)
    }
  }

  const handleBuscar = () => {
    setBusquedaRealizada(true)
    setPaginacion((prev) => ({ ...prev, pagina: 1 }))
    cargarFacturas(1)
  }

  const handleCambioPagina = (event, nuevaPagina) => {
    if (busquedaRealizada) {
      setPaginacion((prev) => ({ ...prev, pagina: nuevaPagina }))
    }
  }

  const verFactura = async (factura) => {
    setCargandoFactura(true)
    try {
      setFacturaParaVisor(factura.idFactura)
      setVisorAbierto(true)
    } catch (error) {
      console.error("Error al cargar factura:", error)
      mostrarSnackbar(`Error al cargar detalles de la factura: ${error.message}`, "error")
    } finally {
      setCargandoFactura(false)
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

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "registrada":
        return "primary"
      case "verificada":
        return "warning"
      case "pagada":
        return "success"
      case "anulada":
        return "error"
      default:
        return "default"
    }
  }

  const getTipoColor = (tipo) => {
    return tipo === "contado" ? "success" : "warning"
  }

  const getEstadoCuentaIcon = (factura) => {
    if (factura.tipo === "contado") return <CheckCircle color="success" />
    if (factura.estado?.toLowerCase() === "pagada") return <CheckCircle color="success" />
    if (factura.fechaVencimiento && new Date(factura.fechaVencimiento) < new Date()) {
      return <Warning color="error" />
    }
    return <Schedule color="warning" />
  }

  // Obtener facturas para la página actual
  const facturasPaginadas = facturas.slice(
    (paginacion.pagina - 1) * paginacion.registrosPorPagina,
    paginacion.pagina * paginacion.registrosPorPagina,
  )

  return (
    <Grid container spacing={3}>
      {/* Filtros */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
                    label="Tipo"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="contado">Contado</MenuItem>
                    <MenuItem value="credito">Crédito</MenuItem>
                  </Select>
                </FormControl>
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
                    <MenuItem value="Registrada">Registrada</MenuItem>
                    <MenuItem value="Verificada">Verificada</MenuItem>
                    <MenuItem value="Pagada">Pagada</MenuItem>
                    <MenuItem value="Anulada">Anulada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Proveedor"
                  size="small"
                  value={filtros.proveedor}
                  onChange={(e) => setFiltros({ ...filtros, proveedor: e.target.value })}
                  placeholder="Nombre del proveedor"
                />
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
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Lista de Facturas */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Facturas de Proveedores</Typography>
              {paginacion.totalRegistros > 0 && (
                <Typography variant="body2" color="textSecondary">
                  Mostrando {(paginacion.pagina - 1) * paginacion.registrosPorPagina + 1} -{" "}
                  {Math.min(paginacion.pagina * paginacion.registrosPorPagina, paginacion.totalRegistros)} de{" "}
                  {paginacion.totalRegistros} facturas
                </Typography>
              )}
            </Box>

            {/* Cabecera de la tabla */}
            <Box sx={{ mb: 1, px: 2, py: 1, backgroundColor: "grey.100", borderRadius: 1 }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Estado
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Número
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Fecha
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Proveedor
                  </Typography>
                </Grid>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Monto
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Estado
                  </Typography>
                </Grid>
                <Grid item xs={1}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Acciones
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Lista de facturas */}
            <Box>
              {cargando ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : !busquedaRealizada ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  Utilice los filtros y haga clic en "Buscar" para ver las facturas de proveedores.
                </Typography>
              ) : facturas.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                  No se encontraron facturas con los criterios seleccionados.
                </Typography>
              ) : (
                <>
                  {/* Lista de facturas */}
                  <Box>
                    {facturasPaginadas.map((factura) => (
                      <Card key={factura.idFactura} sx={{ mb: 1, position: "relative" }}>
                        <CardContent sx={{ pb: 1 }}>
                          <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={1}>
                              {getEstadoCuentaIcon(factura)}
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {factura.nroFactura}
                              </Typography>
                              <Chip
                                label={factura.tipo.toUpperCase()}
                                color={getTipoColor(factura.tipo)}
                                size="small"
                              />
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="body2">
                                {new Date(factura.fechaEmision).toLocaleDateString("es-PY")}
                              </Typography>
                              {factura.fechaVencimiento && (
                                <Typography variant="caption" color="textSecondary">
                                  Vence: {new Date(factura.fechaVencimiento).toLocaleDateString("es-PY")}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={3}>
                              <Typography variant="body2">{factura.proveedor}</Typography>
                              {factura.ordenCompra && (
                                <Typography variant="caption" color="textSecondary">
                                  Orden: #{factura.ordenCompra}
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={2}>
                              <Typography variant="body2" fontWeight="bold">
                                ₲ {factura.montoTotal.toLocaleString("es-PY")}
                              </Typography>
                              {factura.tipo === "credito" && factura.plazoPago && (
                                <Typography variant="caption" color="textSecondary">
                                  Plazo: {factura.plazoPago} días
                                </Typography>
                              )}
                            </Grid>
                            <Grid item xs={1}>
                              <Chip label={factura.estado} color={getEstadoColor(factura.estado)} size="small" />
                            </Grid>
                            <Grid item xs={1}>
                              {/* Botón de acción */}
                              <IconButton
                                size="small"
                                color="primary"
                                title="Ver factura"
                                onClick={() => verFactura(factura)}
                                disabled={cargandoFactura}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Grid>
                          </Grid>
                          {/* Mostrar notas de crédito asociadas */}
                          {factura.notasCredito && factura.notasCredito.length > 0 && (
                            <Box sx={{ mt: 2, ml: 4 }}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                Notas de Crédito Asociadas:
                              </Typography>
                              <Grid container spacing={1}>
                                {factura.notasCredito.map((nota) => (
                                  <Grid item key={nota.idNotaCredito}>
                                    <Button
                                      variant="outlined"
                                      color="success"
                                      size="small"
                                      startIcon={<Assignment />}
                                      onClick={() => {
                                        setNotaParaPrevia(nota.idNotaCredito)
                                        setVistaPreviaNotaAbierta(true)
                                      }}
                                      sx={{ mr: 1 }}
                                    >
                                      {nota.nroNota} - ₲ {nota.montoTotal.toLocaleString("es-PY")}
                                    </Button>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  {/* Paginación */}
                  {paginacion.totalPaginas > 1 && (
                    <Box display="flex" justifyContent="center" mt={3}>
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
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Visor de factura de proveedor */}
      {facturaParaVisor && (
        <VisorFacturaProveedor
          open={visorAbierto}
          onClose={() => setVisorAbierto(false)}
          facturaId={facturaParaVisor}
        />
      )}

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Grid>
  )
}
