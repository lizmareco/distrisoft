"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
} from "@mui/material"
import { Add, Edit, Delete, ArrowBack } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useRootContext } from "@/src/app/context/root"

export default function ListaProducto() {
  const router = useRouter()
  const [productos, setProductos] = useState([])
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })
  const [filtroId, setFiltroId] = useState("")
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroDescripcion, setFiltroDescripcion] = useState("")
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [tiposProducto, setTiposProducto] = useState([])
  const [estadosProducto, setEstadosProducto] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_PRODUCTO") || context.session?.isAdmin

  const fetchProductos = async (params = {}) => {
    try {
      setLoading(true)
      setHasSearched(true)
      const searchParams = new URLSearchParams()
      if (params.id) searchParams.append("id", params.id)
      if (params.nombre) searchParams.append("nombre", params.nombre)
      if (params.descripcion) searchParams.append("descripcion", params.descripcion)
      if (params.tipo) searchParams.append("tipo", params.tipo)
      if (params.estado) searchParams.append("estado", params.estado)
      if (params.all) searchParams.append("all", params.all)
      const response = await fetch(`/api/productos?${searchParams.toString()}`)
      if (!response.ok) throw new Error("Error al cargar productos")
      const data = await response.json()
      setProductos(data)
    } catch (error) {
      showSnackbar(`Error al cargar los productos: ${error.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [includeInactive])

  // Cargar tipos y estados para los filtros
  useEffect(() => {
    const fetchFiltros = async () => {
      const tiposRes = await fetch("/api/tipoproducto")
      const tipos = await tiposRes.ok ? await tiposRes.json() : []
      setTiposProducto(tipos)
      const estadosRes = await fetch("/api/estadoproducto")
      const estados = await estadosRes.ok ? await estadosRes.json() : []
      setEstadosProducto(estados)
    }
    fetchFiltros()
  }, [])

  const handleEdit = (producto) => {
    router.push(`/producto/formulario?id=${producto.idProducto}`)
  }

  const handleNew = () => {
    router.push("/producto/formulario")
  }

  const handleOpenDelete = (producto) => {
    setSelectedProducto(producto)
    setOpenDelete(true)
  }

  const handleCloseDelete = () => {
    setOpenDelete(false)
    setSelectedProducto(null)
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/productos/${selectedProducto.idProducto}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar producto")

      await fetchProductos()
      handleCloseDelete()
      showSnackbar("Producto eliminado correctamente", "success")
    } catch (error) {
      console.error("Error:", error)
      showSnackbar("Error al eliminar el producto", "error")
    }
  }

  const handleIncludeInactiveChange = (event) => {
    setIncludeInactive(event.target.checked)
  }

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    })
  }

  const handleBuscar = (e) => {
    e.preventDefault()
    fetchProductos({
      id: filtroId,
      nombre: filtroNombre,
      descripcion: filtroDescripcion,
      tipo: filtroTipo,
      estado: filtroEstado,
    })
  }

  const handleMostrarTodos = () => {
    setFiltroId("")
    setFiltroNombre("")
    setFiltroDescripcion("")
    setFiltroTipo("")
    setFiltroEstado("")
    fetchProductos({ all: "true" })
  }

  const handleLimpiarFiltros = () => {
    setFiltroId("")
    setFiltroNombre("")
    setFiltroDescripcion("")
    setFiltroTipo("")
    setFiltroEstado("")
    setProductos([])
    setHasSearched(false)
  }

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Productos
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNew}>
          Nuevo Producto
        </Button>
      </Box>

      <form onSubmit={handleBuscar} style={{ marginBottom: 24 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={2}>
            <TextField label="ID" value={filtroId} onChange={e => setFiltroId(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField label="Nombre" value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField label="Descripción" value={filtroDescripcion} onChange={e => setFiltroDescripcion(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select value={filtroTipo} label="Tipo" onChange={e => setFiltroTipo(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {tiposProducto.map(tipo => (
                  <MenuItem key={tipo.idTipoProducto} value={tipo.idTipoProducto}>{tipo.nombreTipoProducto}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={filtroEstado} label="Estado" onChange={e => setFiltroEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {estadosProducto.map(estado => (
                  <MenuItem key={estado.idEstadoProducto} value={estado.idEstadoProducto}>{estado.descEstadoProducto}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1} display="flex" alignItems="center">
            <Button type="submit" variant="outlined" fullWidth>Buscar</Button>
          </Grid>
          <Grid item xs={12} sm={1} display="flex" alignItems="center">
            <Button variant="text" onClick={handleMostrarTodos} fullWidth>Mostrar todos</Button>
          </Grid>
          <Grid item xs={12} sm={1} display="flex" alignItems="center">
            <Button variant="text" onClick={handleLimpiarFiltros} fullWidth>Limpiar filtros</Button>
          </Grid>
        </Grid>
      </form>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : !hasSearched && !loading ? (
        <Alert severity="info">Utilice los filtros de búsqueda para visualizar los productos.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Peso Unidad</TableCell>
                <TableCell>Precio Unitario</TableCell>
                <TableCell>Unidad de Medida</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length > 0 ? (
                productos.map((producto) => {
                  const isActive = producto.idEstadoProducto === 1 // Asumiendo que 1 es el ID del estado "Activo"
                  return (
                    <TableRow
                      key={producto.idProducto}
                      sx={{
                        opacity: isActive ? 1 : 0.7,
                        backgroundColor: isActive ? "inherit" : "rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <TableCell>{producto.idProducto}</TableCell>
                      <TableCell>{producto.nombreProducto}</TableCell>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>
                        {producto.tipoProducto?.nombreTipoProducto || producto.tipoProducto?.descTipoProducto || "N/A"}
                      </TableCell>
                      <TableCell>
                        {typeof producto.pesoUnidad === "number"
                          ? producto.pesoUnidad.toLocaleString("es-ES", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })
                          : producto.pesoUnidad}
                      </TableCell>
                      <TableCell>
                        {typeof producto.precioUnitario === "number"
                          ? producto.precioUnitario.toLocaleString("es-ES", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })
                          : producto.precioUnitario}
                      </TableCell>
                      <TableCell>
                        {producto.unidadMedida
                          ? `${producto.unidadMedida.descUnidadMedida} (${producto.unidadMedida.abreviatura})`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={producto.estadoProducto?.descEstadoProducto || "N/A"}
                          color={isActive ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => handleEdit(producto)} size="small" title="Editar">
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDelete(producto)}
                          disabled={!isActive}
                          size="small"
                          title="Eliminar"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el producto "{selectedProducto?.nombreProducto}"? Esta acción no se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
