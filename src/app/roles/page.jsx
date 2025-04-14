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
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rolADesactivar, setRolADesactivar] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(true) // Mostrar roles inactivos por defecto
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  const cargarRoles = async () => {
    try {
      setLoading(true)
      // Incluir parámetro para indicar si queremos incluir roles inactivos
      const response = await fetch(`/api/roles?includeInactive=${includeInactive}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al cargar roles: ${response.status}`)
      }

      const data = await response.json()
      setRoles(data.roles || [])
      setError(null)
    } catch (error) {
      setError(error.message || "Error al cargar los roles")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRoles()
  }, [includeInactive])

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver al Dashboard
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

      {/* Switch para mostrar/ocultar roles inactivos */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControlLabel
          control={<Switch checked={includeInactive} onChange={handleIncludeInactiveChange} color="primary" />}
          label="Mostrar roles inactivos"
        />
      </Box>

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay roles registrados
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((rol) => (
                  <TableRow
                    key={rol.idRol}
                    sx={{
                      opacity: rol.estadoRol === "INACTIVO" ? 0.7 : 1,
                      backgroundColor: rol.estadoRol === "INACTIVO" ? "rgba(0, 0, 0, 0.04)" : "inherit",
                    }}
                  >
                    <TableCell>{rol.idRol}</TableCell>
                    <TableCell>{rol.nombreRol}</TableCell>
                    <TableCell>
                      <Chip
                        label={rol.estadoRol}
                        color={rol.estadoRol === "ACTIVO" ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: "medium" }}
                      />
                    </TableCell>
                    <TableCell>
                      {rol.permisos && rol.permisos.length > 0
                        ? rol.permisos.map((permiso) => (
                            <Chip
                              key={permiso.idPermiso}
                              label={permiso.nombrePermiso}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ m: 0.3 }}
                            />
                          ))
                        : "Sin permisos"}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => irAEditarRol(rol.idRol)} title="Editar">
                        <EditIcon />
                      </IconButton>
                      {rol.estadoRol === "ACTIVO" && (
                        <IconButton color="error" onClick={() => confirmarDesactivar(rol)} title="Desactivar">
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
