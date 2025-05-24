"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Grid,
  Pagination,
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"
import EditIcon from "@mui/icons-material/Edit"
import ClearIcon from "@mui/icons-material/Clear"

export default function ListaOrdenesProduccionPage() {
  const router = useRouter()
  const [ordenes, setOrdenes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [cargandoUsuarios, setCargandoUsuarios] = useState(true)
  const [error, setError] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [guardando, setGuardando] = useState(false)
  const [datosIniciales, setDatosIniciales] = useState(false)

  // Filtros
  const [filtros, setFiltros] = useState({
    idOrden: "",
    idPedido: "",
    estado: "",
    operador: "",
    busquedaGeneral: "",
  })

  // Paginación
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  })

  const estados = [
    { id: 1, nombre: "EN PROCESO", color: "warning" },
    { id: 2, nombre: "FINALIZADO", color: "success" },
  ]

  // Cargar usuarios al inicio
  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setCargandoUsuarios(true)
      const respuesta = await fetch("/api/usuarios")
      if (respuesta.ok) {
        const datos = await respuesta.json()
        console.log("Usuarios cargados:", datos)
        // Manejar la estructura { usuarios: [...] }
        if (datos.usuarios && Array.isArray(datos.usuarios)) {
          setUsuarios(datos.usuarios)
        } else if (Array.isArray(datos)) {
          setUsuarios(datos)
        }
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
    } finally {
      setCargandoUsuarios(false)
    }
  }

  const buscarOrdenes = async (page = 1) => {
    try {
      setCargando(true)
      setError(null)

      // Construir parámetros de búsqueda
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", paginacion.limit.toString())

      if (filtros.idOrden) params.append("idOrden", filtros.idOrden)
      if (filtros.idPedido) params.append("idPedido", filtros.idPedido)
      if (filtros.estado) params.append("estado", filtros.estado)
      if (filtros.operador) params.append("operador", filtros.operador)
      if (filtros.busquedaGeneral) params.append("search", filtros.busquedaGeneral)

      const respuesta = await fetch(`/api/ordenes-produccion/buscar?${params}`)
      if (!respuesta.ok) {
        throw new Error("Error al buscar órdenes de producción")
      }

      const datos = await respuesta.json()
      setOrdenes(datos.ordenes || [])
      setPaginacion({
        ...paginacion,
        page: datos.meta?.page || 1,
        total: datos.meta?.total || 0,
        totalPages: datos.meta?.totalPages || 0,
      })
      setDatosIniciales(true)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      setOrdenes([])
    } finally {
      setCargando(false)
    }
  }

  const listarTodas = async () => {
    setFiltros({
      idOrden: "",
      idPedido: "",
      estado: "",
      operador: "",
      busquedaGeneral: "",
    })
    await buscarOrdenes(1)
  }

  const limpiarFiltros = () => {
    setFiltros({
      idOrden: "",
      idPedido: "",
      estado: "",
      operador: "",
      busquedaGeneral: "",
    })
    setOrdenes([])
    setDatosIniciales(false)
    setPaginacion({ ...paginacion, page: 1, total: 0, totalPages: 0 })
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ ...filtros, [campo]: valor })
  }

  const handlePageChange = (event, newPage) => {
    buscarOrdenes(newPage)
  }

  const abrirDialogoEstado = (orden) => {
    setOrdenSeleccionada(orden)
    setNuevoEstado(orden.idEstadoOrdenProd)
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setOrdenSeleccionada(null)
    setNuevoEstado("")
  }

  const actualizarEstado = async () => {
    if (!ordenSeleccionada || !nuevoEstado) return

    try {
      setGuardando(true)
      const respuesta = await fetch(`/api/ordenes-produccion/${ordenSeleccionada.idOrdenProduccion}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idEstadoOrdenProd: Number.parseInt(nuevoEstado) }),
      })

      if (!respuesta.ok) {
        throw new Error("Error al actualizar estado")
      }

      // Recargar órdenes manteniendo la página actual
      await buscarOrdenes(paginacion.page)
      cerrarDialogo()
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha || fecha === "1900-01-01T00:00:00.000Z") return "Pendiente"
    return new Date(fecha).toLocaleDateString()
  }

  const getEstadoColor = (idEstado) => {
    const estado = estados.find((e) => e.id === idEstado)
    return estado?.color || "default"
  }

  const getEstadoNombre = (idEstado) => {
    const estado = estados.find((e) => e.id === idEstado)
    return estado?.nombre || "Desconocido"
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Título */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontSize: "28px",
          fontWeight: 400,
          color: "#333",
          mb: 3,
          borderBottom: "1px solid #eaeaea",
          paddingBottom: "8px",
        }}
      >
        Órdenes de Producción
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Panel de filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filtros de Búsqueda
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="ID Orden"
              value={filtros.idOrden}
              onChange={(e) => handleFiltroChange("idOrden", e.target.value)}
              type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="ID Pedido"
              value={filtros.idPedido}
              onChange={(e) => handleFiltroChange("idPedido", e.target.value)}
              type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange("estado", e.target.value)}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                {estados.map((estado) => (
                  <MenuItem key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Operador</InputLabel>
              <Select
                value={filtros.operador}
                onChange={(e) => handleFiltroChange("operador", e.target.value)}
                label="Operador"
                disabled={cargandoUsuarios}
              >
                <MenuItem value="">Todos</MenuItem>
                {usuarios.map((usuario) => (
                  <MenuItem key={usuario.idUsuario} value={usuario.idUsuario}>
                    {usuario.persona ? `${usuario.persona.nombre} ${usuario.persona.apellido}` : usuario.nombreUsuario}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Búsqueda general"
              value={filtros.busquedaGeneral}
              onChange={(e) => handleFiltroChange("busquedaGeneral", e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
              <Button variant="contained" onClick={() => buscarOrdenes(1)} disabled={cargando} fullWidth>
                {cargando ? <CircularProgress size={20} /> : "Buscar"}
              </Button>
              <Button variant="outlined" onClick={listarTodas} disabled={cargando} fullWidth>
                Listar Todas
              </Button>
              <Button variant="text" startIcon={<ClearIcon />} onClick={limpiarFiltros} disabled={cargando} fullWidth>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Mensaje inicial */}
      {!datosIniciales && !cargando && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Utiliza los filtros de búsqueda para encontrar órdenes específicas o haz clic en "Listar Todas" para ver todas
          las órdenes (máximo 50 por página).
        </Alert>
      )}

      {/* Información de resultados */}
      {datosIniciales && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {ordenes.length} de {paginacion.total} órdenes
          </Typography>
          {paginacion.totalPages > 1 && (
            <Pagination
              count={paginacion.totalPages}
              page={paginacion.page}
              onChange={handlePageChange}
              color="primary"
              disabled={cargando}
            />
          )}
        </Box>
      )}

      {/* Tabla de órdenes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID Orden</TableCell>
              <TableCell>ID Pedido</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell>Operador</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : ordenes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {datosIniciales
                    ? "No se encontraron órdenes con los filtros aplicados"
                    : "Realiza una búsqueda para ver las órdenes"}
                </TableCell>
              </TableRow>
            ) : (
              ordenes.map((orden) => (
                <TableRow key={orden.idOrdenProduccion}>
                  <TableCell>{orden.idOrdenProduccion}</TableCell>
                  <TableCell>{orden.pedidoCliente?.idPedido}</TableCell>
                  <TableCell>{formatearFecha(orden.fechaInicioProd)}</TableCell>
                  <TableCell>{formatearFecha(orden.fechaFinProd)}</TableCell>
                  <TableCell>
                    {orden.usuario?.persona
                      ? `${orden.usuario.persona.nombre} ${orden.usuario.persona.apellido}`
                      : orden.usuario?.nombreUsuario || "No asignado"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getEstadoNombre(orden.idEstadoOrdenProd)}
                      color={getEstadoColor(orden.idEstadoOrdenProd)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => abrirDialogoEstado(orden)}
                      disabled={orden.idEstadoOrdenProd === 2}
                    >
                      Cambiar Estado
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación inferior */}
      {paginacion.totalPages > 1 && datosIniciales && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={paginacion.totalPages}
            page={paginacion.page}
            onChange={handlePageChange}
            color="primary"
            disabled={cargando}
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Diálogo para cambiar estado */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Estado de Orden de Producción</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Orden #{ordenSeleccionada?.idOrdenProduccion} - Pedido #{ordenSeleccionada?.pedidoCliente?.idPedido}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} label="Nuevo Estado">
              {estados.map((estado) => (
                <MenuItem key={estado.id} value={estado.id}>
                  {estado.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {nuevoEstado === 2 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Al cambiar a "FINALIZADO", se registrará automáticamente la fecha de finalización.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo}>Cancelar</Button>
          <Button
            onClick={actualizarEstado}
            variant="contained"
            disabled={guardando || nuevoEstado === ordenSeleccionada?.idEstadoOrdenProd}
          >
            {guardando ? <CircularProgress size={20} /> : "Actualizar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
