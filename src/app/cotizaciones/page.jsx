"use client"

import React, { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Autocomplete,
  Collapse,
  Card,
  CardContent,
} from "@mui/material"
import { Add, Visibility, ArrowBack, Search, Clear, FilterList, List, Person, ExpandMore, ExpandLess, PictureAsPdf, ShoppingCart } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRootContext } from "@/src/app/context/root"
import { Delete } from "@mui/icons-material"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import DialogActions from "@mui/material/DialogActions"

export default function CotizacionesPage() {
  const router = useRouter()
  const context = useRootContext()

  // Estados
  const [cotizaciones, setCotizaciones] = useState([])
  const [estados, setEstados] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false)
  const [cotizacionAEliminar, setCotizacionAEliminar] = useState(null)

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    cliente: null,
    idCotizacion: "",
    idEstado: "",
  })

  // Estado para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  // Estados para el desplegable
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [detallesCotizaciones, setDetallesCotizaciones] = useState({})
  const [loadingDetalles, setLoadingDetalles] = useState({})

  // Estado para generación de PDF
  const [generandoPDF, setGenerandoPDF] = useState({})

  // Verificación de permisos
  const permisos = context.session?.permisos || []
  const hasPermission = permisos.find((permiso) => permiso === "VIEW_COTIZACIONCLIENTE")

  // Cargar estados al montar el componente
  useEffect(() => {
    if (!hasPermission) return

    const cargarEstados = async () => {
      try {
        const response = await fetch("/api/estados-cotizacion")
        if (response.ok) {
          const data = await response.json()
          setEstados(data)
        } else {
          console.warn("No se pudieron cargar los estados de cotización")
        }
      } catch (error) {
        console.error("Error al cargar estados:", error)
      }
    }

    cargarEstados()
  }, [hasPermission])

  // Buscar clientes cuando se escribe en el campo
  const buscarClientes = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientes([])
      return
    }

    try {
      setLoadingClientes(true)
      const response = await fetch(`/api/clientes/con-cotizaciones?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Función para cargar detalles de una cotización
  const cargarDetallesCotizacion = async (idCotizacion) => {
    if (detallesCotizaciones[idCotizacion]) {
      return // Ya están cargados
    }

    try {
      setLoadingDetalles(prev => ({ ...prev, [idCotizacion]: true }))
      const response = await fetch(`/api/cotizaciones/${idCotizacion}`)
      if (response.ok) {
        const data = await response.json()
        setDetallesCotizaciones(prev => ({
          ...prev,
          [idCotizacion]: data
        }))
      } else {
        console.error("Error al cargar detalles de la cotización")
      }
    } catch (error) {
      console.error("Error al cargar detalles:", error)
    } finally {
      setLoadingDetalles(prev => ({ ...prev, [idCotizacion]: false }))
    }
  }

  // Manejar expansión/contracción de filas
  const handleToggleRow = (idCotizacion) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(idCotizacion)) {
      newExpandedRows.delete(idCotizacion)
    } else {
      newExpandedRows.add(idCotizacion)
      // Cargar detalles si no están cargados
      cargarDetallesCotizacion(idCotizacion)
    }
    setExpandedRows(newExpandedRows)
  }

  // Función para generar y descargar PDF
  const handleGenerarPDF = async (idCotizacion) => {
    try {
      setGenerandoPDF(prev => ({ ...prev, [idCotizacion]: true }))
      setSnackbarMessage("Generando PDF, por favor espere...")
      setSnackbarSeverity("info")
      setOpenSnackbar(true)

      const response = await fetch(`/api/cotizaciones/${idCotizacion}/pdf`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al generar el PDF")
      }

      // Crear blob y descargar
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `cotizacion-${idCotizacion}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSnackbarMessage("PDF generado y descargado exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)
    } catch (error) {
      console.error("Error al generar PDF:", error)
      setSnackbarMessage("Error al generar PDF: " + error.message)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setGenerandoPDF(prev => ({ ...prev, [idCotizacion]: false }))
    }
  }

  // Función para buscar cotizaciones
  const buscarCotizaciones = async (mostrarTodas = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (mostrarTodas) {
        params.append("mostrarTodas", "true")
      } else {
        if (filtros.cliente) {
          if (typeof filtros.cliente === "object" && filtros.cliente.idCliente) {
            params.append("idCliente", filtros.cliente.idCliente)
          } else if (typeof filtros.cliente === "string" && filtros.cliente.trim()) {
            params.append("cliente", filtros.cliente.trim())
          }
        }
        if (filtros.idCotizacion.trim()) {
          params.append("idCotizacion", filtros.idCotizacion.trim())
        }
        if (filtros.idEstado) {
          params.append("idEstado", filtros.idEstado)
        }
      }

      console.log("Buscando con parámetros:", params.toString())

      const response = await fetch(`/api/cotizaciones?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Error al buscar cotizaciones")
      }

      const data = await response.json()
      setCotizaciones(data)
      setHasSearched(true)

      // Limpiar estados de expansión y detalles al hacer nueva búsqueda
      setExpandedRows(new Set())
      setDetallesCotizaciones({})
      setLoadingDetalles({})
      setGenerandoPDF({})

      // Mostrar mensaje según resultados
      if (data.length === 0) {
        if (filtros.cliente && typeof filtros.cliente === "object") {
          setSnackbarMessage("El cliente existe pero no tiene cotizaciones registradas")
        } else if (mostrarTodas) {
          setSnackbarMessage("No hay cotizaciones registradas")
        } else {
          setSnackbarMessage("No se encontraron cotizaciones que coincidan con los filtros")
        }
        setSnackbarSeverity("info")
        setOpenSnackbar(true)
      } else {
        setSnackbarMessage(`Se encontraron ${data.length} cotizaciones`)
        setSnackbarSeverity("success")
        setOpenSnackbar(true)
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      setSnackbarMessage("Error al buscar cotizaciones: " + error.message)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))

    // Si es el campo cliente y es texto, buscar clientes
    if (campo === "cliente" && typeof valor === "string") {
      buscarClientes(valor)
    }
  }

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarCotizaciones()
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      cliente: null,
      idCotizacion: "",
      idEstado: "",
    })
    setClientes([])
    setCotizaciones([])
    setHasSearched(false)
    setError(null)
    setExpandedRows(new Set())
    setDetallesCotizaciones({})
    setLoadingDetalles({})
    setGenerandoPDF({})
  }

  // Verificar si hay filtros aplicados
  const hayFiltros = () => {
    return filtros.cliente || filtros.idCotizacion.trim() || filtros.idEstado
  }

  const handleNuevaCotizacion = () => {
    router.push("/cotizaciones/nueva")
  }

  const handleIrAPedidos = () => {
    router.push("/pedidos")
  }

  const handleVerCotizacion = (id) => {
    router.push(`/cotizaciones/${id}`)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  const getEstadoChipColor = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning"
      case "aprobada":
        return "success"
      case "rechazada":
        return "error"
      case "vencida":
        return "default"
      default:
        return "primary"
    }
  }

  // Formatear cliente para mostrar en el autocomplete
  const formatearCliente = (cliente) => {
    const nombre = `${cliente.persona?.nombre || ""} ${cliente.persona?.apellido || ""}`.trim()
    const empresa = cliente.empresa?.razonSocial || ""
    const documento = cliente.persona?.nroDocumento || ""

    return `${nombre}${empresa ? ` - ${empresa}` : ""} (${documento})`
  }

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  const handleOpenConfirmDialog = (cotizacion) => {
    setCotizacionAEliminar(cotizacion)
    setOpenConfirmDialog(true)
  }

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false)
    setCotizacionAEliminar(null)
  }

  const handleEliminarCotizacion = async () => {
    if (!cotizacionAEliminar) return
    try {
      setLoading(true)
      const response = await fetch(`/api/cotizaciones/${cotizacionAEliminar.idCotizacionCliente}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (!response.ok) throw new Error("Error al eliminar cotización")
      setSnackbarMessage("Cotización eliminada correctamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)
      buscarCotizaciones()
    } catch (error) {
      setSnackbarMessage("Error al eliminar cotización: " + error.message)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
      handleCloseConfirmDialog()
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cotizaciones Clientes
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<ShoppingCart />} 
            onClick={handleIrAPedidos}
          >
            Ir a Pedidos
          </Button>
          <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNuevaCotizacion}>
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      {/* Panel de filtros */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <FilterList sx={{ mr: 1 }} />
          Filtros de Búsqueda
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Búsqueda por cliente con autocomplete */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={clientes}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option
                return formatearCliente(option)
              }}
              loading={loadingClientes}
              value={filtros.cliente}
              onChange={(event, newValue) => {
                handleFiltroChange("cliente", newValue)
              }}
              onInputChange={(event, newInputValue, reason) => {
                // Solo buscar si el usuario está escribiendo (no al seleccionar)
                if (reason === "input") {
                  handleFiltroChange("cliente", newInputValue)
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Búsqueda por cliente"
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {loadingClientes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText="Escriba nombre, apellido o documento del cliente"
                />
              )}
            />
          </Grid>

          {/* ID de Cotización */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ID de Cotización"
              type="number"
              value={filtros.idCotizacion}
              onChange={(e) => handleFiltroChange("idCotizacion", e.target.value)}
              onKeyPress={handleKeyPress}
              helperText="Número exacto de la cotización"
            />
          </Grid>

          {/* Estado */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.idEstado}
                label="Estado"
                onChange={(e) => handleFiltroChange("idEstado", e.target.value)}
              >
                <MenuItem value="">
                  <em>Todos los estados</em>
                </MenuItem>
                {estados.map((estado) => (
                  <MenuItem key={estado.idEstadoCotizacionCliente} value={estado.idEstadoCotizacionCliente}>
                    {estado.descEstadoCotizacionCliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Botones de acción */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => buscarCotizaciones()}
                disabled={loading || !hayFiltros()}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              >
                {loading ? "Buscando..." : "Buscar"}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={() => buscarCotizaciones(true)}
                disabled={loading}
                startIcon={<List />}
              >
                Mostrar Todas
              </Button>

              <Button variant="outlined" onClick={limpiarFiltros} disabled={loading} startIcon={<Clear />}>
                Limpiar Filtros
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : hasSearched ? (
        cotizaciones.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="50px"></TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Monto Total</TableCell>
                  <TableCell>Validez</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cotizaciones.map((cotizacion) => {
                  const isExpanded = expandedRows.has(cotizacion.idCotizacionCliente)
                  const detalles = detallesCotizaciones[cotizacion.idCotizacionCliente]
                  const isLoadingDetalles = loadingDetalles[cotizacion.idCotizacionCliente]

                  return (
                    <React.Fragment key={cotizacion.idCotizacionCliente}>
                      <TableRow>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleRow(cotizacion.idCotizacionCliente)}
                            disabled={isLoadingDetalles}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </TableCell>
                        <TableCell>{cotizacion.idCotizacionCliente}</TableCell>
                        <TableCell>{format(new Date(cotizacion.fechaCotizacion), "dd/MM/yyyy", { locale: es })}</TableCell>
                        <TableCell>
                          {cotizacion.cliente?.persona?.nombre} {cotizacion.cliente?.persona?.apellido}
                          {cotizacion.cliente?.empresa && ` - ${cotizacion.cliente.empresa.razonSocial}`}
                        </TableCell>
                        <TableCell>
                          {cotizacion.usuario?.persona?.nombre} {cotizacion.usuario?.persona?.apellido}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            cotizacion.montoTotal,
                          )}
                        </TableCell>
                        <TableCell>{cotizacion.validez} días</TableCell>
                        <TableCell>
                          <Chip
                            label={cotizacion.estadoCotizacionCliente?.descEstadoCotizacionCliente || "Pendiente"}
                            color={getEstadoChipColor(
                              cotizacion.estadoCotizacionCliente?.descEstadoCotizacionCliente || "pendiente",
                            )}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => handleVerCotizacion(cotizacion.idCotizacionCliente)}
                            title="Ver cotización"
                            size="small"
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => handleGenerarPDF(cotizacion.idCotizacionCliente)}
                            title="Descargar PDF"
                            size="small"
                            disabled={generandoPDF[cotizacion.idCotizacionCliente]}
                          >
                            {generandoPDF[cotizacion.idCotizacionCliente] ? (
                              <CircularProgress size={20} />
                            ) : (
                              <PictureAsPdf />
                            )}
                          </IconButton>
                          {/* Mostrar solo si es PENDIENTE */}
                          {cotizacion.estadoCotizacionCliente?.idEstadoCotizacionCliente === 1 && (
                            <IconButton
                              color="error"
                              onClick={() => handleOpenConfirmDialog(cotizacion)}
                              title="Eliminar cotización"
                              size="small"
                              disabled={loading}
                            >
                              <Delete />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 1 }}>
                              {isLoadingDetalles ? (
                                <Box display="flex" justifyContent="center" p={2}>
                                  <CircularProgress size={24} />
                                </Box>
                              ) : detalles ? (
                                <Card variant="outlined">
                                  <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                      Detalle de la Cotización #{cotizacion.idCotizacionCliente}
                                    </Typography>
                                    <Grid container spacing={2}>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                          Cliente:
                                        </Typography>
                                        <Typography variant="body2">
                                          {detalles.cliente?.persona?.nombre} {detalles.cliente?.persona?.apellido}
                                          {detalles.cliente?.empresa && ` - ${detalles.cliente.empresa.razonSocial}`}
                                        </Typography>
                                        {detalles.cliente?.persona?.nroDocumento && (
                                          <>
                                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                              Documento:
                                            </Typography>
                                            <Typography variant="body2">
                                              {detalles.cliente.persona.nroDocumento}
                                            </Typography>
                                          </>
                                        )}
                                      </Grid>
                                      <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" color="textSecondary">
                                          Vendedor:
                                        </Typography>
                                        <Typography variant="body2">
                                          {detalles.usuario?.persona?.nombre} {detalles.usuario?.persona?.apellido}
                                        </Typography>
                                        <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                          Fecha de Cotización:
                                        </Typography>
                                        <Typography variant="body2">
                                          {format(new Date(detalles.fechaCotizacion), "dd/MM/yyyy", { locale: es })}
                                        </Typography>
                                      </Grid>
                                    </Grid>
                                    
                                    {detalles.detalleCotizacionCliente && detalles.detalleCotizacionCliente.length > 0 && (
                                      <>
                                        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                          Productos Cotizados
                                        </Typography>
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Producto</TableCell>
                                              <TableCell align="right">Cantidad</TableCell>
                                              <TableCell align="right">Precio Unitario</TableCell>
                                              <TableCell align="right">Subtotal</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {detalles.detalleCotizacionCliente.map((detalle, index) => {
                                              const precioUnitario = detalle.subtotal / detalle.cantidad
                                              return (
                                                <TableRow key={`${cotizacion.idCotizacionCliente}-detalle-${index}`}>
                                                  <TableCell>{detalle.producto?.nombreProducto}</TableCell>
                                                  <TableCell align="right">{detalle.cantidad}</TableCell>
                                                  <TableCell align="right">
                                                    {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(precioUnitario)}
                                                  </TableCell>
                                                  <TableCell align="right">
                                                    {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(detalle.subtotal)}
                                                  </TableCell>
                                                </TableRow>
                                              )
                                            })}
                                            <TableRow>
                                              <TableCell colSpan={3} align="right">
                                                <strong>TOTAL:</strong>
                                              </TableCell>
                                              <TableCell align="right">
                                                <strong>
                                                  {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(detalles.montoTotal)}
                                                </strong>
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      </>
                                    )}
                                  </CardContent>
                                </Card>
                              ) : (
                                <Alert severity="error">
                                  No se pudieron cargar los detalles de la cotización
                                </Alert>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            {filtros.cliente && typeof filtros.cliente === "object" && filtros.cliente.idCliente
              ? "El cliente existe pero no tiene cotizaciones registradas"
              : "No se encontraron cotizaciones que coincidan con los filtros aplicados"}
          </Alert>
        )
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Use los filtros para buscar cotizaciones específicas o haga clic en "Mostrar Todas" para ver todas las
          cotizaciones
        </Alert>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} variant="filled" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Está seguro que desea eliminar la cotización
          {cotizacionAEliminar ? ` #${cotizacionAEliminar.idCotizacionCliente}` : ""}? Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="secondary" variant="outlined">
            Cancelar
          </Button>
          <Button
            onClick={handleEliminarCotizacion}
            color="error"
            variant="contained"
            disabled={loading}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
