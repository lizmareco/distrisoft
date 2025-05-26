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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material"
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  MonetizationOn,
  Assignment,
  Payment,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Close as CloseIcon,
} from "@mui/icons-material"

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

  const irADashboard = () => {
    // TODO: Implementar navegación al dashboard financiero
    console.log("Ir al dashboard financiero")
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Gestión Financiera
        </Typography>
        <Button variant="outlined" startIcon={<DashboardIcon />} onClick={irADashboard} color="primary">
          Dashboard Financiero
        </Button>
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
          <Tab label="Cuentas por Cobrar" icon={<TrendingUp />} />
          <Tab label="Cuentas por Pagar" icon={<TrendingDown />} />
          <Tab label="Gestión de Caja" icon={<MonetizationOn />} />
          <Tab label="Pagos" icon={<Payment />} />
        </Tabs>
      </Paper>

      {/* Contenido de las pestañas */}
      <TabPanel value={tabValue} index={0}>
        <FacturacionClientes />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <FacturasProveedores />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <CuentasPorCobrar />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <CuentasPorPagar />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <GestionCaja />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <GestionPagos />
      </TabPanel>
    </Container>
  )
}

// Componente para Facturación de Clientes con funcionalidad completa
function FacturacionClientes() {
  const [facturas, setFacturas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [filtros, setFiltros] = useState({
    tipo: "",
    estado: "",
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

  // Estados para visualización de factura
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [dialogoVisualizacion, setDialogoVisualizacion] = useState(false)
  const [cargandoFactura, setCargandoFactura] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Nuevo estado para controlar si se ha realizado una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Cargar facturas al inicializar
  // Comentar esta línea para evitar carga automática
  // useEffect(() => {
  //   cargarFacturas()
  // }, [paginacion.pagina])

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
      const respuesta = await fetch(`/api/finanzas/facturas-clientes/${factura.nroFactura}?tipo=${factura.tipo}`)
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setFacturaSeleccionada(datos.data)
        setDialogoVisualizacion(true)
      } else {
        mostrarSnackbar("Error al cargar detalles de la factura", "error")
      }
    } catch (error) {
      console.error("Error al cargar factura:", error)
      mostrarSnackbar("Error al cargar detalles de la factura", "error")
    } finally {
      setCargandoFactura(false)
    }
  }

  const imprimirFactura = async (factura) => {
    try {
      mostrarSnackbar("Generando PDF...", "info")

      const respuesta = await fetch(`/api/finanzas/facturas-clientes/${factura.nroFactura}/pdf?tipo=${factura.tipo}`)

      if (respuesta.ok) {
        const blob = await respuesta.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `factura-${factura.nroFactura}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        mostrarSnackbar("PDF generado exitosamente", "success")
      } else {
        mostrarSnackbar("Error al generar PDF", "error")
      }
    } catch (error) {
      console.error("Error al generar PDF:", error)
      mostrarSnackbar("Error al generar PDF", "error")
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
      case "enviado":
        return "info"
      case "cobrado":
        return "success"
      case "cancelada":
        return "error"
      default:
        return "default"
    }
  }

  const getTipoColor = (tipo) => {
    return tipo === "contado" ? "success" : "warning"
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
                    <MenuItem value="enviado">Enviado</MenuItem>
                    <MenuItem value="cobrado">Cobrado</MenuItem>
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
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nro. Factura</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Fecha Emisión</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Monto Total</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {facturas.map((factura) => (
                        <TableRow key={`${factura.tipo}-${factura.nroFactura}`}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              #{factura.nroFactura}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={factura.tipo.toUpperCase()} color={getTipoColor(factura.tipo)} size="small" />
                          </TableCell>
                          <TableCell>{new Date(factura.fechaEmision).toLocaleDateString("es-PY")}</TableCell>
                          <TableCell>{factura.cliente}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              ₲ {factura.montoTotal.toLocaleString("es-PY")}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={factura.estado} color={getEstadoColor(factura.estado)} size="small" />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                size="small"
                                color="primary"
                                title="Ver detalles"
                                onClick={() => verFactura(factura)}
                                disabled={cargandoFactura}
                              >
                                {cargandoFactura ? <CircularProgress size={20} /> : <VisibilityIcon />}
                              </IconButton>
                              <IconButton
                                size="small"
                                color="secondary"
                                title="Imprimir PDF"
                                onClick={() => imprimirFactura(factura)}
                              >
                                <PrintIcon />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

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
          </CardContent>
        </Card>
      </Grid>

      {/* Diálogo para visualizar factura */}
      <Dialog open={dialogoVisualizacion} onClose={() => setDialogoVisualizacion(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Factura #{facturaSeleccionada?.nroFactura}</Typography>
            <IconButton onClick={() => setDialogoVisualizacion(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {facturaSeleccionada && (
            <Box>
              {/* Encabezado de la factura */}
              <Box sx={{ border: "2px solid #000", p: 2, mb: 2, position: "relative", minHeight: 120 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      mr: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src="/logo.png"
                      alt="Logo Las Niñas"
                      style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "contain",
                        filter: "grayscale(100%)",
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, textAlign: "center", pr: "200px" }}>
                    <Typography variant="h5" fontWeight="bold">
                      DISTRIBUIDORA 'LAS NIÑAS'
                    </Typography>
                    <Typography variant="body2">de Victor Manuel Barreto Barrios</Typography>
                    <Typography variant="body2">ELABORACIÓN DE COMIDAS Y PLATOS PREPARADOS</Typography>
                    <Typography variant="body2">COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE
                    </Typography>
                    <Typography variant="body2">TELÉFONO: (0993) 540-258</Typography>
                  </Box>
                </Box>

                {/* Cuadro unificado en la esquina superior derecha */}
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    border: "2px solid #000",
                    p: 2,
                    bgcolor: "#f5f5f5",
                    width: 180,
                  }}
                >
                  <Box sx={{ mb: 1, pb: 1, borderBottom: "1px solid #000" }}>
                    <Typography variant="body2" fontWeight="bold">
                      R.U.C.
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      4006624-0
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1, pb: 1, borderBottom: "1px solid #000" }}>
                    <Typography variant="body2" fontWeight="bold">
                      TIMBRADO Nº
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      17184746
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1, pb: 1, borderBottom: "1px solid #000" }}>
                    <Typography variant="body2" fontWeight="bold">
                      FACTURA
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      Nº 001-001-{String(facturaSeleccionada.nroFactura).padStart(7, "0")}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      CONDICIÓN DE VENTA
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-around", mt: 1 }}>
                      <Box>
                        <input type="checkbox" checked={facturaSeleccionada.tipo === "contado"} readOnly />
                        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                          CONTADO
                        </Typography>
                      </Box>
                      <Box>
                        <input type="checkbox" checked={facturaSeleccionada.tipo === "credito"} readOnly />
                        <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                          CRÉDITO
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Información de la factura */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={8}>
                  <Box sx={{ border: "1px solid #000", p: 2, height: "100%" }}>
                    <Typography variant="body2" fontWeight="bold">
                      FECHA DE EMISIÓN:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {new Date(facturaSeleccionada.fechaEmision).toLocaleDateString("es-PY")}
                    </Typography>

                    <Typography variant="body2" fontWeight="bold">
                      NOMBRE O RAZÓN SOCIAL:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {facturaSeleccionada.cliente.nombre}
                    </Typography>

                    <Typography variant="body2" fontWeight="bold">
                      R.U.C.:
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {facturaSeleccionada.cliente.documento || "N/A"}
                    </Typography>

                    <Typography variant="body2" fontWeight="bold">
                      DIRECCIÓN:
                    </Typography>
                    <Typography variant="body1">{facturaSeleccionada.cliente.direccion || "N/A"}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={4}>
                  {/* Espacio vacío para mantener el layout */}
                </Grid>
              </Grid>

              {/* Tabla de productos */}
              <TableContainer sx={{ border: "1px solid #000", mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                        CANT.
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                        DESCRIPCIÓN
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                        PRECIO UNITARIO
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                        EXENTAS
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                        5%
                      </TableCell>
                      <TableCell sx={{ border: "1px solid #000", fontWeight: "bold", textAlign: "center" }}>
                        10%
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {facturaSeleccionada.detalles?.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ border: "1px solid #000", textAlign: "center" }}>{detalle.cantidad}</TableCell>
                        <TableCell sx={{ border: "1px solid #000" }}>{detalle.descripcion}</TableCell>
                        <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}>
                          ₲ {detalle.precioUnitario.toLocaleString("es-PY")}
                        </TableCell>
                        <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}></TableCell>
                        <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}></TableCell>
                        <TableCell sx={{ border: "1px solid #000", textAlign: "right" }}>
                          ₲ {detalle.subtotal.toLocaleString("es-PY")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totales */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ border: "1px solid #000", p: 2 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                      LIQUIDACIÓN DEL I.V.A.
                    </Typography>
                    {(() => {
                      // Solo calcular IVA 10%
                      const subtotalIva10 = facturaSeleccionada.detalles?.reduce((sum, d) => sum + d.subtotal, 0) || 0
                      const ivaCalculado10 = subtotalIva10 * 0.1
                      const totalIva = ivaCalculado10

                      return (
                        <>
                          <Typography variant="body2">Sub Total Exentas: ₲ 0</Typography>
                          <Typography variant="body2">Sub Total 5%: ₲ 0</Typography>
                          <Typography variant="body2">
                            Sub Total 10%: ₲ {subtotalIva10.toLocaleString("es-PY")}
                          </Typography>
                          <hr />
                          <Typography variant="body2">I.V.A. 5%: ₲ 0</Typography>
                          <Typography variant="body2">
                            I.V.A. 10%: ₲ {ivaCalculado10.toLocaleString("es-PY")}
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            TOTAL I.V.A.: ₲ {totalIva.toLocaleString("es-PY")}
                          </Typography>
                        </>
                      )
                    })()}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ border: "1px solid #000", p: 2, height: "100%" }}>
                    <Typography variant="body1" fontWeight="bold">
                      TOTAL GENERAL Gs.
                    </Typography>
                    <Box
                      sx={{
                        border: "2px solid #000",
                        p: 1,
                        textAlign: "center",
                        bgcolor: "#f5f5f5",
                        mt: 1,
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        ₲ {facturaSeleccionada.montoTotal.toLocaleString("es-PY")}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoVisualizacion(false)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              imprimirFactura(facturaSeleccionada)
              setDialogoVisualizacion(false)
            }}
          >
            Imprimir PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

// Componentes simplificados para las otras pestañas
function FacturasProveedores() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Facturas de Proveedores
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Gestión de facturas de proveedores - Próximamente disponible
        </Typography>
      </CardContent>
    </Card>
  )
}

function CuentasPorCobrar() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cuentas por Cobrar
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Gestión de facturas pendientes de cobro - Próximamente disponible
        </Typography>
      </CardContent>
    </Card>
  )
}

function CuentasPorPagar() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Cuentas por Pagar
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Gestión de facturas pendientes de pago - Próximamente disponible
        </Typography>
      </CardContent>
    </Card>
  )
}

function GestionCaja() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Gestión de Caja
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Control de caja y movimientos - Próximamente disponible
        </Typography>
      </CardContent>
    </Card>
  )
}

function GestionPagos() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Gestión de Pagos
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Registro de pagos y cobros - Próximamente disponible
        </Typography>
      </CardContent>
    </Card>
  )
}
