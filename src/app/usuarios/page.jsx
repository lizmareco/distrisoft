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
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import PersonIcon from "@mui/icons-material/Person"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function UsuariosPage() {
  const router = useRouter()
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
        setUsuarios(datos.usuarios || [])
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
        <Button component={Link} href="/dashboard" startIcon={<ArrowBackIcon />} variant="outlined">
          Volver al Dashboard
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

        {error && (
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
        )}

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
        </TableContainer>
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

