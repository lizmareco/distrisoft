"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  FormControlLabel,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Link from "next/link"
import { useRootContext } from "@/src/app/context/root"

export default function RolesPage() {
  const router = useRouter()
  const { session } = useRootContext()
  const permisos = session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_ROL") || session?.isAdmin

  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rolADesactivar, setRolADesactivar] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(true) // Mostrar roles inactivos por defecto
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })
  const [filtroNombre, setFiltroNombre] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [filtroPermiso, setFiltroPermiso] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [estadosRol] = useState([
    { value: "", label: "Todos" },
    { value: "ACTIVO", label: "Activo" },
    { value: "INACTIVO", label: "Inactivo" },
  ])

  const cargarRoles = async (params = {}) => {
    try {
      setLoading(true)
      setHasSearched(true)
      const searchParams = new URLSearchParams()
      if (params.nombreRol) searchParams.append("nombreRol", params.nombreRol)
      if (params.estadoRol) searchParams.append("estadoRol", params.estadoRol)
      if (params.permiso) searchParams.append("permiso", params.permiso)
      if (includeInactive) searchParams.append("includeInactive", "true")
      const response = await fetch(`/api/roles?${searchParams.toString()}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })
      if (!response.ok) throw new Error(`Error al cargar roles: ${response.status}`)
      const data = await response.json()
      setRoles(data.roles || [])
      setError(null)
    } catch (error) {
      setError(error.message || "Error al cargar los roles")
    } finally {
      setLoading(false)
    }
  }

  const irACrearRol = () => {
    router.push("/roles/formulario")
  }

  const irAEditarRol = (id) => {
    router.push(`/roles/formulario?id=${id}`)
  }

  const confirmarDesactivar = (rol) => {
    setRolADesactivar(rol)
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setRolADesactivar(null)
  }

  const desactivarRol = async () => {
    if (!rolADesactivar) return

    try {
      const response = await fetch(`/api/roles/${rolADesactivar.idRol}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estadoRol: "INACTIVO",
          permisos: rolADesactivar.permisos.map((p) => p.idPermiso),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al desactivar rol")
      }

      // Actualizar la lista de roles después de desactivar
      setRoles(roles.map((r) => (r.idRol === rolADesactivar.idRol ? { ...r, estadoRol: "INACTIVO" } : r)))

      setSnackbar({
        abierto: true,
        mensaje: "Rol desactivado exitosamente",
        tipo: "success",
      })
    } catch (error) {
      setSnackbar({
        abierto: true,
        mensaje: error.message || "Error al desactivar rol",
        tipo: "error",
      })
    } finally {
      cerrarDialogo()
    }
  }

  const handleIncludeInactiveChange = (event) => {
    setIncludeInactive(event.target.checked)
  }

  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  const handleBuscar = (e) => {
    e.preventDefault()
    cargarRoles({
      nombreRol: filtroNombre,
      estadoRol: filtroEstado,
      permiso: filtroPermiso,
    })
  }

  const handleMostrarTodos = () => {
    setFiltroNombre("")
    setFiltroEstado("")
    setFiltroPermiso("")
    cargarRoles({})
  }

  const handleLimpiarFiltros = () => {
    setFiltroNombre("")
    setFiltroEstado("")
    setFiltroPermiso("")
    setRoles([])
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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver a Gestión
          </Button>
          <Typography variant="h5" component="h1">
            Gestión de Roles
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={irACrearRol}>
          Nuevo Rol
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}


      <form onSubmit={handleBuscar} style={{ marginBottom: 24 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField label="Nombre del Rol" value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={filtroEstado} label="Estado" onChange={e => setFiltroEstado(e.target.value)}>
                {estadosRol.map(e => (
                  <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Permiso (buscar por nombre)" value={filtroPermiso} onChange={e => setFiltroPermiso(e.target.value)} fullWidth size="small" />
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
        <Alert severity="info">Utilice los filtros de búsqueda para visualizar los roles.</Alert>
      ) : roles.length === 0 ? (
        <Alert severity="info">No hay roles registrados</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nombre del Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((rol) => (
                  <TableRow key={rol.idRol}>
                    <TableCell>{rol.idRol}</TableCell>
                    <TableCell>{rol.nombreRol}</TableCell>
                    <TableCell>
                      <Chip label={rol.estadoRol} color={rol.estadoRol === "ACTIVO" ? "success" : "default"} size="small" />
                    </TableCell>
                    <TableCell>
                      {rol.permisos.map((permiso, idx) => {
                        const match = filtroPermiso && permiso.nombrePermiso.toLowerCase().includes(filtroPermiso.toLowerCase())
                        return (
                          <Chip
                            key={permiso.idPermiso}
                            label={permiso.nombrePermiso}
                            variant="outlined"
                            sx={{
                              m: 0.3,
                              borderColor: match ? "primary.main" : undefined,
                              color: match ? "primary.main" : undefined,
                              fontWeight: match ? "bold" : undefined,
                              backgroundColor: match ? "#e3f2fd" : undefined,
                            }}
                          />
                        )
                      })}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => irAEditarRol(rol.idRol)} size="small" title="Editar">
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => confirmarDesactivar(rol)}
                        disabled={rol.estadoRol !== "ACTIVO"}
                        size="small"
                        title="Desactivar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Diálogo de confirmación para desactivar */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo}>
        <DialogTitle>Confirmar desactivación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas desactivar el rol {rolADesactivar?.nombreRol}? Esto cambiará el estado del rol a
            INACTIVO.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} color="primary">
            Cancelar
          </Button>
          <Button onClick={desactivarRol} color="error">
            Desactivar
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
