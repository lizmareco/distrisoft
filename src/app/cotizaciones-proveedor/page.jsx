"use client"

import React from "react"
import { useState } from "react"
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  Card,
  CardContent,
  Divider,
} from "@mui/material"
import { Add, Visibility, Search, Clear, Delete, ExpandMore, ExpandLess } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowBack } from "@mui/icons-material"
import { Checkbox } from "@mui/material"
import { useRootContext } from "@/src/app/context/root"


export default function CotizacionesProveedorPage() {
  const context = useRootContext()
  // Verificación de permisos
  const permisos = context.session?.permisos || []
  const hasPermission = permisos.find((permiso) => permiso === "VIEW_COTIZACIONPROVEEDOR")
  const [cotizacionesSeleccionadas, setCotizacionesSeleccionadas] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [cotizaciones, setCotizaciones] = useState([])
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cotizacionToDelete, setCotizacionToDelete] = useState(null)
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false)
  // Estados para el despliegue rápido
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [detallesCotizaciones, setDetallesCotizaciones] = useState({})
  const [loadingDetalles, setLoadingDetalles] = useState({})
  // Estado para IDs de proveedores seleccionados
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([])
  // Estado para filtro de estado
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE')

  // Ya no cargamos automáticamente las cotizaciones al inicio

  const loadAllCotizaciones = async () => {
    if (!hasPermission) return
    setLoading(true)
    try {
      const response = await fetch("/api/cotizaciones-proveedor")
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`)
      }
      const data = await response.json()
      setCotizaciones(data)
      setHasSearched(true)

      // Mostrar mensaje con la cantidad de cotizaciones encontradas
      if (data.length === 0) {
        setSnackbarMessage("No se encontraron cotizaciones")
        setSnackbarSeverity("info")
      } else {
        setSnackbarMessage(`Se encontraron ${data.length} cotizaciones`)
        setSnackbarSeverity("success")
      }
      setOpenSnackbar(true)
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error)
      setSnackbarMessage(`Error: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSeleccion = (id) => {
    const cotizacion = cotizaciones.find((c) => c.idCotizacionProveedor === id)
    if (!cotizacion) return
    const proveedorId = cotizacion.proveedor?.idProveedor
    // Solo permitir seleccionar cotizaciones PENDIENTES
    if (cotizacion.estado !== 'PENDIENTE') {
      setSnackbarMessage("Solo puede comparar cotizaciones con estado PENDIENTE.")
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
      return
    }
    // Si ya está seleccionada, quitarla
    if (cotizacionesSeleccionadas.includes(id)) {
      setCotizacionesSeleccionadas((prev) => prev.filter((cid) => cid !== id))
      setProveedoresSeleccionados((prev) => prev.filter((pid) => pid !== proveedorId))
    } else {
      // Si el proveedor ya está seleccionado, mostrar error y no permitir
      if (proveedoresSeleccionados.includes(proveedorId)) {
        setSnackbarMessage("Solo puede comparar cotizaciones de proveedores distintos.")
        setSnackbarSeverity("error")
        setOpenSnackbar(true)
        return
      }
      setCotizacionesSeleccionadas((prev) => [...prev, id])
      setProveedoresSeleccionados((prev) => [...prev, proveedorId])
    }
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/cotizaciones-proveedor?search=${encodeURIComponent(searchTerm.trim())}`)

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      setCotizaciones(data)

      if (data.length === 0) {
        setSnackbarMessage("No se encontraron cotizaciones")
        setSnackbarSeverity("info")
        setOpenSnackbar(true)
      } else {
        setSnackbarMessage(`Se encontraron ${data.length} cotizaciones`)
        setSnackbarSeverity("success")
        setOpenSnackbar(true)
      }
    } catch (error) {
      console.error("Error al buscar cotizaciones:", error)
      setSnackbarMessage(`Error al buscar cotizaciones: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleVerCotizacion = (id) => {
    router.push(`/cotizaciones-proveedor/${id}`)
  }

  const handleDeleteClick = (cotizacion) => {
    setCotizacionToDelete(cotizacion)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setCotizacionToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!cotizacionToDelete) return

    setProcesandoEliminacion(true)
    try {
      // Obtener el token de autenticación
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

      const headers = {
        "Content-Type": "application/json",
      }

      // Añadir el token de autorización si existe
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`
      }

      // Cambiar el estado a RECHAZADA en vez de eliminar
      const response = await fetch(`/api/cotizaciones-proveedor/${cotizacionToDelete.idCotizacionProveedor}/estado`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ estado: "RECHAZADA" })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al rechazar la cotización")
      }

      // Actualizar la lista de cotizaciones
      setCotizaciones(cotizaciones.filter((c) => c.idCotizacionProveedor !== cotizacionToDelete.idCotizacionProveedor))

      setSnackbarMessage("Cotización rechazada exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)
    } catch (error) {
      console.error("Error al rechazar cotización:", error)
      setSnackbarMessage(`Error: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setProcesandoEliminacion(false)
      handleCloseDeleteDialog()
    }
  }

  const getEstadoChipColor = (estado) => {
    switch (estado) {
      case "APROBADA":
        return "success"
      case "RECHAZADA":
        return "error"
      case "PENDIENTE":
      default:
        return "warning"
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Fecha no disponible"
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateString)
      return "Fecha inválida"
    }
  }

  const getProveedorNombre = (cotizacion) => {
    if (!cotizacion.proveedor) return "N/A"

    // Si tiene empresa, mostrar la razón social
    if (cotizacion.proveedor.empresa?.razonSocial) {
      return cotizacion.proveedor.empresa.razonSocial
    }

    // Si tiene empresa pero no razón social, mostrar el contacto
    if (cotizacion.proveedor.empresa?.contacto) {
      return cotizacion.proveedor.empresa.contacto
    }

    // Si no hay información disponible
    return "Sin información"
  }

  // Cargar detalles de cotización proveedor
  const cargarDetallesCotizacion = async (idCotizacion) => {
    if (detallesCotizaciones[idCotizacion]) return
    try {
      setLoadingDetalles((prev) => ({ ...prev, [idCotizacion]: true }))
      const response = await fetch(`/api/cotizaciones-proveedor/${idCotizacion}`)
      if (response.ok) {
        const data = await response.json()
        setDetallesCotizaciones((prev) => ({ ...prev, [idCotizacion]: data }))
      }
    } catch (error) {
      // No hacer nada especial, el error se muestra en el render
    } finally {
      setLoadingDetalles((prev) => ({ ...prev, [idCotizacion]: false }))
    }
  }

  // Manejar expansión/contracción de filas
  const handleToggleRow = (idCotizacion) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(idCotizacion)) {
      newExpandedRows.delete(idCotizacion)
    } else {
      newExpandedRows.add(idCotizacion)
      cargarDetallesCotizacion(idCotizacion)
    }
    setExpandedRows(newExpandedRows)
  }

  // Filtrar cotizaciones según el estado seleccionado
  const cotizacionesFiltradas = cotizaciones.filter(c => c.estado === filtroEstado)

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
        Volver a Gestión
      </Button>
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={1}>
        <Button component={Link} href="/ordenes-compra" variant="contained" color="secondary">
          Ir a Órdenes de Compra
        </Button>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Cotizaciones de Proveedores
        </Typography>
        <Button startIcon={<Add />} component={Link} href="/cotizaciones-proveedor/nueva" variant="contained">
          Nueva Cotización
        </Button>
      </Box>

      <Paper sx={{ padding: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar por ID o Proveedor"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: (
                  <IconButton edge="end" onClick={() => setSearchTerm("")} title="Limpiar búsqueda">
                    <Clear />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2}>
              <Button variant="contained" color="primary" onClick={handleSearch}>
                Buscar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" gap={2} mb={2}>
        <Button
          variant={filtroEstado === 'PENDIENTE' ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => setFiltroEstado('PENDIENTE')}
        >
          Ver Pendientes
        </Button>
        <Button
          variant={filtroEstado === 'APROBADA' ? 'contained' : 'outlined'}
          color="success"
          onClick={() => setFiltroEstado('APROBADA')}
        >
          Ver Aprobadas
        </Button>
        <Button
          variant={filtroEstado === 'RECHAZADA' ? 'contained' : 'outlined'}
          color="error"
          onClick={() => setFiltroEstado('RECHAZADA')}
        >
          Ver Rechazadas
        </Button>
      </Box>

      {/* Botón de comparar cotizaciones (arriba) */}
      {cotizacionesSeleccionadas.length >= 2 && (
        <Box my={2} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => router.push(`/cotizaciones-proveedor/comparar?ids=${cotizacionesSeleccionadas.join(",")}`)}
          >
            Comparar Cotizaciones Seleccionadas
          </Button>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : hasSearched ? (
        cotizacionesFiltradas.length > 0 ? (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>ID</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Monto Total</TableCell>
                    <TableCell>Validez</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                    <TableCell>Seleccionar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cotizacionesFiltradas.map((cotizacion) => {
                    const isExpanded = expandedRows.has(cotizacion.idCotizacionProveedor)
                    const detalles = detallesCotizaciones[cotizacion.idCotizacionProveedor]
                    const isLoadingDetalles = loadingDetalles[cotizacion.idCotizacionProveedor]
                    return (
                      <React.Fragment key={cotizacion.idCotizacionProveedor}>
                        <TableRow>
                          {/* Botón de expandir/colapsar a la izquierda */}
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleRow(cotizacion.idCotizacionProveedor)}
                              disabled={isLoadingDetalles}
                              color="primary"
                              title={isExpanded ? "Ocultar detalles" : "Ver detalles rápidos"}
                            >
                              {isExpanded ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                          <TableCell>{cotizacion.idCotizacionProveedor}</TableCell>
                          <TableCell>{formatDate(cotizacion.fechaCotizacionProveedor)}</TableCell>
                          <TableCell>{getProveedorNombre(cotizacion)}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                              cotizacion.montoTotal || 0,
                            )}
                          </TableCell>
                          <TableCell>{cotizacion.validez || "N/A"} días</TableCell>
                          <TableCell>
                            <Chip
                              label={cotizacion.estado || "PENDIENTE"}
                              color={getEstadoChipColor(cotizacion.estado)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex">
                              <IconButton
                                color="primary"
                                onClick={() => handleVerCotizacion(cotizacion.idCotizacionProveedor)}
                                title="Ver cotización"
                                size="small"
                              >
                                <Visibility />
                              </IconButton>
                              {cotizacion.estado === "PENDIENTE" && (
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(cotizacion)}
                                  title="Eliminar cotización"
                                  size="small"
                                >
                                  <Delete />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={cotizacionesSeleccionadas.includes(cotizacion.idCotizacionProveedor)}
                              onChange={() => handleToggleSeleccion(cotizacion.idCotizacionProveedor)}
                              color="primary"
                            />
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
                                        Detalle de la Cotización #{cotizacion.idCotizacionProveedor}
                                      </Typography>
                                      <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                          <Typography variant="subtitle2" color="textSecondary">
                                            Proveedor:
                                          </Typography>
                                          <Typography variant="body2">
                                            {detalles.proveedor?.empresa?.razonSocial || "N/A"}
                                          </Typography>
                                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                            RUC:
                                          </Typography>
                                          <Typography variant="body2">
                                            {detalles.proveedor?.empresa?.ruc || "N/A"}
                                          </Typography>
                                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                            Contacto:
                                          </Typography>
                                          <Typography variant="body2">
                                            {detalles.proveedor?.empresa?.contacto || "N/A"}
                                          </Typography>
                                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                            Teléfono:
                                          </Typography>
                                          <Typography variant="body2">
                                            {detalles.proveedor?.empresa?.telefono || "N/A"}
                                          </Typography>
                                        </Grid>
                                        <Grid item xs={12} md={6}>
                                          <Typography variant="subtitle2" color="textSecondary">
                                            Fecha:
                                          </Typography>
                                          <Typography variant="body2">
                                            {formatDate(detalles.fechaCotizacionProveedor)}
                                          </Typography>
                                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                            Estado:
                                          </Typography>
                                          <Typography variant="body2">
                                            {detalles.estado || "PENDIENTE"}
                                          </Typography>
                                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                            Validez:
                                          </Typography>
                                          <Typography variant="body2">
                                            {detalles.validez || "N/A"} días
                                          </Typography>
                                        </Grid>
                                      </Grid>
                                      <Divider sx={{ my: 2 }} />
                                      <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        Materias Primas Cotizadas
                                      </Typography>
                                      {detalles.detallesCotizacionProv && detalles.detallesCotizacionProv.length > 0 ? (
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Materia Prima</TableCell>
                                              <TableCell align="right">Precio Unitario</TableCell>
                                              <TableCell align="right">Cantidad</TableCell>
                                              <TableCell align="right">Subtotal</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {detalles.detallesCotizacionProv.map((detalle, index) => (
                                              <TableRow key={detalle.idDetalleCotizacionProv || index}>
                                                <TableCell>{detalle.materiaPrima?.nombreMateriaPrima || "N/A"}</TableCell>
                                                <TableCell align="right">
                                                  {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                                                    detalle.precioUnitario || 0,
                                                  )}
                                                </TableCell>
                                                <TableCell align="right">{detalle.cantidad}</TableCell>
                                                <TableCell align="right">
                                                  {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                                                    detalle.subtotal || 0,
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                            <TableRow>
                                              <TableCell colSpan={3} align="right">
                                                <strong>TOTAL:</strong>
                                              </TableCell>
                                              <TableCell align="right">
                                                <strong>
                                                  {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                                                    detalles.montoTotal || 0,
                                                  )}
                                                </strong>
                                              </TableCell>
                                            </TableRow>
                                          </TableBody>
                                        </Table>
                                      ) : (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                          No hay detalles disponibles para esta cotización
                                        </Alert>
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
            {/* Botón de comparar cotizaciones (abajo) */}
            {cotizacionesSeleccionadas.length >= 2 && (
              <Box my={2} display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => router.push(`/cotizaciones-proveedor/comparar?ids=${cotizacionesSeleccionadas.join(",")}`)}
                >
                  Comparar Cotizaciones Seleccionadas
                </Button>
              </Box>
            )}
          </>
        ) : (
          <Alert severity="info">No se encontraron cotizaciones que coincidan con la búsqueda</Alert>
        )
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Ingrese un ID de cotización o nombre de proveedor para buscar, o haga clic en "Mostrar Todos"
        </Alert>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Eliminar Cotización</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar la cotización #{cotizacionToDelete?.idCotizacionProveedor}? Esta acción
            no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={procesandoEliminacion}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
            disabled={procesandoEliminacion}
          >
            {procesandoEliminacion ? <CircularProgress size={24} color="inherit" /> : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>

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
    </Container>
  )
}
