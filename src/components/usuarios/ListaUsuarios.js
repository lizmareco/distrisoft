"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"

export default function ListaUsuarios() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
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
        const respuesta = await fetch("/api/usuarios")
        if (!respuesta.ok) {
          throw new Error("Error al cargar usuarios")
        }
        const datos = await respuesta.json()
        setUsuarios(datos.usuarios || [])
      } catch (error) {
        console.error("Error:", error)
        setError("No se pudieron cargar los usuarios. Por favor, intenta de nuevo más tarde.")
      } finally {
        setCargando(false)
      }
    }

    cargarUsuarios()
  }, [])

  // Navegar a la página de crear usuario
  const irACrearUsuario = () => {
    router.push("/usuarios/nuevo")
  }

  // Navegar a la página de editar usuario
  const irAEditarUsuario = (id) => {
    router.push(`/usuarios/editar/${id}`)
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
      const respuesta = await fetch(`/api/usuarios/${usuarioAEliminar.id}`, {
        method: "DELETE",
      })

      if (!respuesta.ok) {
        throw new Error("Error al eliminar usuario")
      }

      // Actualizar la lista de usuarios
      setUsuarios(usuarios.filter((u) => u.id !== usuarioAEliminar.id))

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

  if (cargando) {
    return <Typography>Cargando usuarios...</Typography>
  }

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Lista de Usuarios</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={irACrearUsuario}>
          Nuevo Usuario
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Apellido</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.id}</TableCell>
                  <TableCell>{usuario.nombre}</TableCell>
                  <TableCell>{usuario.apellido}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.rol}</TableCell>
                  <TableCell>{usuario.activo ? "Activo" : "Inactivo"}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => irAEditarUsuario(usuario.id)} title="Editar">
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

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar al usuario {usuarioAEliminar?.nombre} {usuarioAEliminar?.apellido}?
            Esta acción no se puede deshacer.
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
    </>
  )
}

