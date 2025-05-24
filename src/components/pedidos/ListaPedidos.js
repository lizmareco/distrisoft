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
  Tooltip,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import SearchIcon from "@mui/icons-material/Search"

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

  // Función para verificar si un pedido está en estado pendiente
  const esPedidoPendiente = (pedido) => {
    if (!pedido || !pedido.estadoPedido) return false
    const idEstado = pedido.estadoPedido.idEstadoPedido
    return idEstado === 1 || idEstado === "1"
  }

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
        console.log("Datos de pedidos recibidos:", datos) // Verificar estructura de datos
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

  // Abrir diálogo de confirmación para eliminar (solo si está pendiente)
  const confirmarEliminar = (pedido) => {
    if (!esPedidoPendiente(pedido)) {
      setSnackbar({
        abierto: true,
        mensaje: `No se puede eliminar el pedido #${pedido.idPedido} porque está en estado "${pedido.estadoPedido?.descEstadoPedido}". Solo se pueden eliminar pedidos pendientes.`,
        tipo: "warning",
      })
      return
    }

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

    // Verificar una vez más que el pedido esté pendiente
    if (!esPedidoPendiente(pedidoAEliminar)) {
      setSnackbar({
        abierto: true,
        mensaje: "No se puede eliminar este pedido porque ya no está en estado pendiente.",
        tipo: "error",
      })
      cerrarDialogo()
      return
    }

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

  // Reemplazar la función formatearFecha con una versión más simple y directa
  const formatearFecha = (fechaStr) => {
    try {
      if (!fechaStr) return "No definida"

      // Si la fecha ya viene en formato YYYY-MM-DD, simplemente invertir el orden
      if (typeof fechaStr === "string" && fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [año, mes, dia] = fechaStr.split("-")
        return `${dia}/${mes}/${año}`
      }

      // Para otros formatos, intentar extraer con regex
      const regex = /(\d{4})-(\d{2})-(\d{2})/
      const match = String(fechaStr).match(regex)

      if (match) {
        const año = match[1]
        const mes = match[2]
        const dia = match[3]
        return `${dia}/${mes}/${año}`
      }

      // Si todo falla, mostrar el string original
      return String(fechaStr)
    } catch (error) {
      console.error("Error al formatear fecha:", error, fechaStr)
      return String(fechaStr)
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
        Lista Pedidos
      </Typography>

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
              <TableCell>Fecha Pedido</TableCell>
              <TableCell>Fecha Entrega</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Observación</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedidosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No hay pedidos registrados
                </TableCell>
              </TableRow>
            ) : (
              pedidosFiltrados.map((pedido) => {
                const puedeEliminar = esPedidoPendiente(pedido)

                return (
                  <TableRow key={pedido.idPedido}>
                    <TableCell>{pedido.idPedido}</TableCell>
                    <TableCell>{formatearFecha(pedido.fechaPedido)}</TableCell>
                    <TableCell>{formatearFecha(pedido.fechaEntrega)}</TableCell>
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
                        label={pedido.estadoPedido?.descEstadoPedido || "Desconocido"}
                        color={getEstadoColor(pedido.estadoPedido)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {pedido.observacion ? (
                        <Tooltip title={pedido.observacion}>
                          <Typography noWrap sx={{ maxWidth: 150 }}>
                            {pedido.observacion}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin observaciones
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}</TableCell>
                    <TableCell>
                      {/* Botón Ver detalles - siempre habilitado */}
                      <IconButton color="info" onClick={() => irAVerPedido(pedido.idPedido)} title="Ver detalles">
                        <VisibilityIcon />
                      </IconButton>

                      {/* Botón Eliminar - solo habilitado si está pendiente */}
                      <Tooltip
                        title={
                          puedeEliminar
                            ? "Eliminar pedido"
                            : `No se puede eliminar. Estado: ${pedido.estadoPedido?.descEstadoPedido || "Desconocido"}`
                        }
                      >
                        <span>
                          <IconButton
                            color="error"
                            onClick={() => confirmarEliminar(pedido)}
                            disabled={!puedeEliminar}
                            sx={{
                              opacity: puedeEliminar ? 1 : 0.5,
                              cursor: puedeEliminar ? "pointer" : "not-allowed",
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })
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
