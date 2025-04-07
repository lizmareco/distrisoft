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
  const [rolAEliminar, setRolAEliminar] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  useEffect(() => {
    const cargarRoles = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/roles", {
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

    cargarRoles()
  }, [])

  const irACrearRol = () => {
    router.push("/roles/formulario")
  }

  const irAEditarRol = (id) => {
    router.push(`/roles/formulario?id=${id}`)
  }

  const confirmarEliminar = (rol) => {
    setRolAEliminar(rol)
    setDialogoAbierto(true)
  }

  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setRolAEliminar(null)
  }

  const eliminarRol = async () => {
    if (!rolAEliminar) return

    try {
      const response = await fetch(`/api/roles/${rolAEliminar.idRol}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Error al eliminar rol")
      }

      setRoles(roles.filter((r) => r.idRol !== rolAEliminar.idRol))
      setSnackbar({
        abierto: true,
        mensaje: "Rol eliminado exitosamente",
        tipo: "success",
      })
    } catch (error) {
      setSnackbar({
        abierto: true,
        mensaje: error.message || "Error al eliminar rol",
        tipo: "error",
      })
    } finally {
      cerrarDialogo()
    }
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

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre del Rol</TableCell>
                <TableCell>Permisos</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay roles registrados
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((rol) => (
                  <TableRow key={rol.idRol}>
                    <TableCell>{rol.idRol}</TableCell>
                    <TableCell>{rol.nombreRol}</TableCell>
                    <TableCell>
                      {rol.permisos && rol.permisos.length > 0
                        ? rol.permisos.map((permiso) => (
                            <Chip
                              key={permiso.idPermiso}
                              label={permiso.nombrePermiso}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))
                        : "Sin permisos"}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => irAEditarRol(rol.idRol)} title="Editar">
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => confirmarEliminar(rol)} title="Eliminar">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el rol {rolAEliminar?.nombreRol}? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} color="primary">
            Cancelar
          </Button>
          <Button onClick={eliminarRol} color="error">
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

