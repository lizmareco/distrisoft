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
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import SearchIcon from "@mui/icons-material/Search"
import { format } from "date-fns"

export default function ListaPedidos() {
  const router = useRouter()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Cargar pedidos
  useEffect(() => {
    const cargarPedidos = async () => {
      try {
        setCargando(true)
        const respuesta = await fetch("/api/pedidos")

        if (!respuesta.ok) {
          throw new Error(`Error al cargar pedidos: ${respuesta.status}`)
        }

        const datos = await respuesta.json()
        setPedidos(datos || [])
      } catch (error) {
        console.error("Error:", error)
        setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo más tarde.")
      } finally {
        setCargando(false)
      }
    }

    cargarPedidos()
  }, [])

  // Navegar a la página de crear pedido
  const irACrearPedido = () => {
    router.push("/pedidos/nuevo")
  }

  // Navegar a la página de ver pedido
  const irAVerPedido = (id) => {
    router.push(`/pedidos/${id}`)
  }

  // Navegar a la página de editar pedido
  const irAEditarPedido = (id) => {
    router.push(`/pedidos/editar/${id}`)
  }

  // Abrir diálogo de confirmación para eliminar
  const confirmarEliminar = (pedido) => {
    setPedidoAEliminar(pedido)
    setDialogoAbierto(true)
  }

  // Cerrar diálogo de confirmación
  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setPedidoAEliminar(null)
  }

  // Eliminar pedido
  const eliminarPedido = async () => {
    if (!pedidoAEliminar) return

    try {
      const respuesta = await fetch(`/api/pedidos/${pedidoAEliminar.idPedido}`, {
        method: "DELETE",
      })

      if (!respuesta.ok) {
        throw new Error("Error al eliminar pedido")
      }

      // Actualizar la lista de pedidos
      setPedidos(pedidos.filter((p) => p.idPedido !== pedidoAEliminar.idPedido))

      // Mostrar mensaje de éxito
      setSnackbar({
        abierto: true,
        mensaje: "Pedido eliminado exitosamente",
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al eliminar pedido",
        tipo: "error",
      })
    } finally {
      cerrarDialogo()
    }
  }

  // Filtrar pedidos según término de búsqueda
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const terminoBusqueda = busqueda.toLowerCase()
    return (
      pedido.idPedido.toString().includes(terminoBusqueda) ||
      (pedido.cliente?.persona?.nombre || "").toLowerCase().includes(terminoBusqueda) ||
      (pedido.cliente?.persona?.apellido || "").toLowerCase().includes(terminoBusqueda) ||
      (pedido.estadoPedido?.descEstadoPedido || "").toLowerCase().includes(terminoBusqueda) // Usar descEstadoPedido en lugar de nombre
    )
  })

  // Función para determinar el color del chip de estado
  const getEstadoColor = (estado) => {
    if (!estado) return "default"

    const nombreEstado = estado.descEstadoPedido?.toLowerCase() || "" // Usar descEstadoPedido en lugar de nombre

    if (nombreEstado.includes("pendiente")) return "warning"
    if (nombreEstado.includes("proceso")) return "info"
    if (nombreEstado.includes("completado") || nombreEstado.includes("entregado")) return "success"
    if (nombreEstado.includes("cancelado")) return "error"

    return "default"
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    try {
      return format(new Date(fecha), "dd/MM/yyyy")
    } catch (error) {
      return "Fecha inválida"
    }
  }

  // Cerrar snackbar
  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Typography color="error">{error}</Typography>
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Buscar pedidos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ width: "50%" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={irACrearPedido}>
          Nuevo Pedido
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay pedidos registrados
                </TableCell>
              </TableRow>
            ) : (
              pedidosFiltrados.map((pedido) => (
                <TableRow key={pedido.idPedido}>
                  <TableCell>{pedido.idPedido}</TableCell>
                  <TableCell>{formatearFecha(pedido.fechaPedido)}</TableCell>
                  <TableCell>
                    {pedido.cliente ? (
                      pedido.cliente.persona ? (
                        `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`
                      ) : (
                        "Cliente sin persona"
                      )
                    ) : (
                      <Typography variant="caption" color="error">
                        Sin asignar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={pedido.estadoPedido?.descEstadoPedido || "Desconocido"} // Usar descEstadoPedido en lugar de nombre
                      color={getEstadoColor(pedido.estadoPedido)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>${pedido.montoTotal?.toFixed(2) || "0.00"}</TableCell>
                  <TableCell>
                    <IconButton color="info" onClick={() => irAVerPedido(pedido.idPedido)} title="Ver detalles">
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="primary" onClick={() => irAEditarPedido(pedido.idPedido)} title="Editar">
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => confirmarEliminar(pedido)} title="Eliminar">
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
            ¿Estás seguro de que deseas eliminar el pedido #{pedidoAEliminar?.idPedido}? Esta acción no se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} color="primary">
            Cancelar
          </Button>
          <Button onClick={eliminarPedido} color="error">
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
