"use client"

import { useState, useEffect } from "react"
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Pagination,
  Stack,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import PersonIcon from "@mui/icons-material/Person"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRootContext } from "@/src/app/context/root"

export default function UsuariosPage() {
  const router = useRouter()
  const { session } = useRootContext()
  const permisos = session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_USUARIO") || session?.isAdmin

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })
  const [filtroUsuario, setFiltroUsuario] = useState("")
  const [filtroPersona, setFiltroPersona] = useState("")
  const [filtroRol, setFiltroRol] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [roles, setRoles] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [paginacion, setPaginacion] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const estadosUsuario = [
    { value: "", label: "Todos" },
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
    { value: "BLOQUEADO", label: "Bloqueado" },
    { value: "VENCIDO", label: "Vencido" },
  ]

  // Cargar usuarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        console.log("Intentando cargar usuarios desde:", "/api/usuarios")
        setLoading(true)
        const respuesta = await fetch("/api/usuarios", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        })
        console.log("Respuesta recibida:", respuesta.status, respuesta.statusText)

        if (!respuesta.ok) {
          const errorData = await respuesta.json().catch(() => ({}))
          console.error("Error en respuesta:", errorData)
          throw new Error(`Error al cargar usuarios: ${respuesta.status} ${respuesta.statusText}`)
        }

        const datos = await respuesta.json()
        console.log("Datos recibidos:", datos)
        
        // Verificar si la respuesta tiene formato de paginación
        if (datos && datos.usuarios && Array.isArray(datos.usuarios)) {
          setUsuarios(datos.usuarios)
          setPaginacion(datos.pagination || {
            page: 1,
            pageSize: datos.usuarios.length,
            totalItems: datos.usuarios.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          })
        } else if (Array.isArray(datos)) {
          // Formato antiguo sin paginación
          setUsuarios(datos)
          setPaginacion({
            page: 1,
            pageSize: datos.length,
            totalItems: datos.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          })
        } else {
          setUsuarios([])
          setPaginacion({
            page: 1,
            pageSize: 0,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false,
          })
        }
        setError(null)
      } catch (error) {
        console.error("Error detallado:", error)
        setError("No se pudieron cargar los usuarios. Por favor, intenta de nuevo más tarde.")
      } finally {
        setLoading(false)
      }
    }

    cargarUsuarios()
  }, [])

  // Cargar roles para el filtro
  useEffect(() => {
    const fetchRoles = async () => {
      const res = await fetch("/api/rol")
      const data = await res.ok ? await res.json() : []
      setRoles(Array.isArray(data) ? data : data.roles || [])
    }
    fetchRoles()
  }, [])

  // Navegar a la página de crear usuario
  const irACrearUsuario = () => {
    router.push("/usuarios/formulario")
  }

  // Navegar a la página de editar usuario
  const irAEditarUsuario = (id) => {
    router.push(`/usuarios/formulario?id=${id}`)
  }

  // Abrir diálogo de confirmación para eliminar
  const confirmarEliminar = (usuario) => {
    setUsuarioAEliminar(usuario)
    setDialogoAbierto(true)
  }

  // Cerrar diálogo de confirmación
  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setUsuarioAEliminar(null)
  }

  // Eliminar usuario
  const eliminarUsuario = async () => {
    if (!usuarioAEliminar) return

    try {
      const respuesta = await fetch(`/api/usuarios/${usuarioAEliminar.idUsuario}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!respuesta.ok) {
        throw new Error("Error al eliminar usuario")
      }

      // Actualizar la lista de usuarios
      setUsuarios(usuarios.filter((u) => u.idUsuario !== usuarioAEliminar.idUsuario))

      // Mostrar mensaje de éxito
      setSnackbar({
        abierto: true,
        mensaje: "Usuario eliminado exitosamente",
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al eliminar usuario",
        tipo: "error",
      })
    } finally {
      cerrarDialogo()
    }
  }

  // Cerrar snackbar
  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  // Función para determinar el color del chip de estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "ACTIVO":
        return "success"
      case "BLOQUEADO":
        return "error"
      case "INACTIVO":
        return "default"
      case "VENCIDO":
        return "warning"
      default:
        return "primary"
    }
  }

  const cargarUsuarios = async (params = {}) => {
    try {
      setLoading(true)
      setHasSearched(true)
      const searchParams = new URLSearchParams()
      if (params.nombreUsuario) searchParams.append("nombreUsuario", params.nombreUsuario)
      if (params.persona) searchParams.append("persona", params.persona)
      if (params.rol) searchParams.append("rol", params.rol)
      if (params.estado) searchParams.append("estado", params.estado)
      if (params.all) searchParams.append("all", params.all)
      if (params.page) searchParams.append("page", params.page)
      if (params.pageSize) searchParams.append("pageSize", params.pageSize)
      
      const respuesta = await fetch(`/api/usuarios?${searchParams.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })
      const datos = await respuesta.json()
      
      // Verificar si la respuesta tiene formato de paginación
      if (datos && datos.usuarios && Array.isArray(datos.usuarios)) {
        setUsuarios(datos.usuarios)
        setPaginacion(datos.pagination || {
          page: 1,
          pageSize: datos.usuarios.length,
          totalItems: datos.usuarios.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else if (Array.isArray(datos)) {
        // Formato antiguo sin paginación
        setUsuarios(datos)
        setPaginacion({
          page: 1,
          pageSize: datos.length,
          totalItems: datos.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else {
        setUsuarios([])
        setPaginacion({
          page: 1,
          pageSize: 0,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
      setError(null)
    } catch (error) {
      setError("No se pudieron cargar los usuarios. Por favor, intenta de nuevo más tarde.")
    } finally {
      setLoading(false)
    }
  }

  const handleBuscar = (e) => {
    e.preventDefault()
    cargarUsuarios({
      nombreUsuario: filtroUsuario,
      persona: filtroPersona,
      rol: filtroRol,
      estado: filtroEstado,
      page: 1,
      pageSize: paginacion.pageSize,
    })
  }

  const handleMostrarTodos = () => {
    setFiltroUsuario("")
    setFiltroPersona("")
    setFiltroRol("")
    setFiltroEstado("")
    cargarUsuarios({ 
      all: "true", 
      page: 1, 
      pageSize: paginacion.pageSize 
    })
  }

  const handleLimpiarFiltros = () => {
    setFiltroUsuario("")
    setFiltroPersona("")
    setFiltroRol("")
    setFiltroEstado("")
    setUsuarios([])
    setHasSearched(false)
    setPaginacion({
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    })
  }

  // Manejar cambio de página
  const handlePageChange = (event, newPage) => {
    cargarUsuarios({
      nombreUsuario: filtroUsuario,
      persona: filtroPersona,
      rol: filtroRol,
      estado: filtroEstado,
      page: newPage,
      pageSize: paginacion.pageSize,
    })
  }

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3} mt={2}>
        <Button component={Link} href="/" startIcon={<ArrowBackIcon />} variant="outlined">
          Volver a Gestión
        </Button>
      </Box>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" component="h1">
            Gestión de Usuarios
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={irACrearUsuario}>
            Nuevo Usuario
          </Button>
        </Box>

        <form onSubmit={handleBuscar} style={{ marginBottom: 24 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField label="Usuario" value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Persona (nombre o apellido)" value={filtroPersona} onChange={e => setFiltroPersona(e.target.value)} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Rol</InputLabel>
                <Select value={filtroRol} label="Rol" onChange={e => setFiltroRol(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {roles.map(rol => (
                    <MenuItem key={rol.idRol} value={rol.idRol}>{rol.nombreRol}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select value={filtroEstado} label="Estado" onChange={e => setFiltroEstado(e.target.value)}>
                  {estadosUsuario.map(e => (
                    <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
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
          <Alert severity="info">Utilice los filtros de búsqueda para visualizar los usuarios.</Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <Button
              variant="outlined"
              size="small"
              sx={{ ml: 2 }}
              onClick={() => {
                setLoading(true)
                fetch("/api/usuarios")
                  .then((response) => {
                    if (!response.ok) throw new Error("Error al recargar datos")
                    return response.json()
                  })
                  .then((data) => {
                    setUsuarios(data.usuarios || [])
                    setError(null)
                  })
                  .catch((err) => {
                    console.error("Error al recargar:", err)
                    setError(err.message)
                  })
                  .finally(() => {
                    setLoading(false)
                  })
              }}
            >
              Reintentar
            </Button>
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Persona</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.idUsuario}>
                      <TableCell>{usuario.idUsuario}</TableCell>
                      <TableCell>{usuario.nombreUsuario}</TableCell>
                      <TableCell>
                        {usuario.persona ? (
                          <Chip
                            icon={<PersonIcon />}
                            label={`${usuario.persona.nombre} ${usuario.persona.apellido}`}
                            variant="outlined"
                            size="small"
                          />
                        ) : (
                          <Typography variant="caption" color="error">
                            Sin asignar
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{usuario.rol?.nombreRol || usuario.idRol}</TableCell>
                      <TableCell>
                        <Chip label={usuario.estado} color={getEstadoColor(usuario.estado)} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => irAEditarUsuario(usuario.idUsuario)} title="Editar">
                          <EditIcon />
                        </IconButton>
                        <IconButton color="error" onClick={() => confirmarEliminar(usuario)} title="Eliminar">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Controles de paginación */}
            {hasSearched && paginacion && paginacion.totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <Stack spacing={2}>
                  <Pagination
                    count={paginacion.totalPages || 1}
                    page={paginacion.page || 1}
                    onChange={handlePageChange}
                    color="primary"
                    disabled={loading}
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Mostrando {usuarios ? usuarios.length : 0} de {paginacion.totalItems || 0} usuarios (Página{" "}
                    {paginacion.page || 1} de {paginacion.totalPages || 1})
                  </Typography>
                </Stack>
              </Box>
            )}
          </TableContainer>
        )}
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar al usuario {usuarioAEliminar?.nombreUsuario}? Esta acción no se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} color="primary">
            Cancelar
          </Button>
          <Button onClick={eliminarUsuario} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Container>
  )
}

