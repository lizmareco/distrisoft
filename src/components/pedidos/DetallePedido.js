"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import EditIcon from "@mui/icons-material/Edit"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import PersonIcon from "@mui/icons-material/Person"
import InventoryIcon from "@mui/icons-material/Inventory"

export default function DetallePedido({ id }) {
  const router = useRouter()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Cargar datos del pedido
  useEffect(() => {
    const cargarPedido = async () => {
      try {
        setCargando(true)
        const respuesta = await fetch(`/api/pedidos/${id}`)

        if (!respuesta.ok) {
          throw new Error(`Error al cargar pedido: ${respuesta.status}`)
        }

        const datos = await respuesta.json()
        console.log("Datos del pedido recibidos:", datos) // Verificar estructura de datos
        setPedido(datos)
      } catch (error) {
        console.error("Error:", error)
        setError("No se pudo cargar el pedido. Por favor, intenta de nuevo más tarde.")
      } finally {
        setCargando(false)
      }
    }

    if (id) {
      cargarPedido()
    }
  }, [id])

  // Volver a la lista de pedidos
  const volverALista = () => {
    router.push("/pedidos")
  }

  // Ir a editar pedido
  const irAEditarPedido = () => {
    router.push(`/pedidos/editar/${id}`)
  }

  // Reemplazar la función formatearFecha con esta versión corregida:
  // Formatear fecha específicamente para el formato ISO
  const formatearFecha = (fechaStr) => {
    try {
      if (!fechaStr) return "No definida"

      // Crear un objeto Date a partir del string de fecha
      const fecha = new Date(fechaStr)

      // Verificar si la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.error("Fecha inválida:", fechaStr)
        return "Formato inválido"
      }

      // Formatear la fecha en formato dd/mm/yyyy
      const dia = fecha.getDate().toString().padStart(2, "0")
      const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
      const año = fecha.getFullYear()

      return `${dia}/${mes}/${año}`
    } catch (error) {
      console.error("Error al formatear fecha:", error, fechaStr)
      return "Error de formato"
    }
  }

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

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">{error}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={volverALista} sx={{ mt: 2 }}>
          Volver a la lista
        </Button>
      </Box>
    )
  }

  if (!pedido) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography>No se encontró el pedido solicitado.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={volverALista} sx={{ mt: 2 }}>
          Volver a la lista
        </Button>
      </Box>
    )
  }

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={volverALista}>
          Volver a la lista
        </Button>
        <Button variant="contained" startIcon={<EditIcon />} onClick={irAEditarPedido}>
          Editar Pedido
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <ShoppingCartIcon sx={{ mr: 1 }} /> Información del Pedido
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Número de Pedido</Typography>
            <Typography variant="body1" gutterBottom>
              #{pedido.idPedido}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Fecha de Pedido</Typography>
            <Typography variant="body1" gutterBottom>
              {formatearFecha(pedido.fechaPedido)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Fecha de Entrega</Typography>
            <Typography variant="body1" gutterBottom>
              {formatearFecha(pedido.fechaEntrega)}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Estado</Typography>
            <Chip
              label={pedido.estadoPedido?.descEstadoPedido || "Desconocido"} // Usar descEstadoPedido en lugar de nombre
              color={getEstadoColor(pedido.estadoPedido)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2">Total</Typography>
            <Typography variant="body1" gutterBottom>
              ₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Observaciones</Typography>
            <Typography variant="body1" gutterBottom>
              {pedido.observacion || "Sin observaciones"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <PersonIcon sx={{ mr: 1 }} /> Cliente
            </Typography>

            {pedido.cliente ? (
              <>
                {pedido.cliente.persona && (
                  <>
                    <Typography variant="subtitle2">Nombre</Typography>
                    <Typography variant="body1" gutterBottom>
                      {pedido.cliente.persona.nombre} {pedido.cliente.persona.apellido}
                    </Typography>

                    <Typography variant="subtitle2">Documento</Typography>
                    <Typography variant="body1" gutterBottom>
                      {pedido.cliente.persona.nroDocumento || "No especificado"}
                    </Typography>
                  </>
                )}
              </>
            ) : (
              <Typography color="error">Cliente no encontrado</Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <PersonIcon sx={{ mr: 1 }} /> Usuario
            </Typography>

            {pedido.usuario ? (
              <>
                <Typography variant="subtitle2">Nombre de Usuario</Typography>
                <Typography variant="body1" gutterBottom>
                  {pedido.usuario.nombreUsuario}
                </Typography>

                {pedido.usuario.persona && (
                  <>
                    <Typography variant="subtitle2">Nombre</Typography>
                    <Typography variant="body1" gutterBottom>
                      {pedido.usuario.persona.nombre} {pedido.usuario.persona.apellido}
                    </Typography>
                  </>
                )}
              </>
            ) : (
              <Typography color="error">Usuario no encontrado</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <InventoryIcon sx={{ mr: 1 }} /> Productos
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Precio Unit.</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pedido.pedidoDetalle && pedido.pedidoDetalle.length > 0 ? (
                pedido.pedidoDetalle.map((detalle) => (
                  <TableRow key={detalle.idPedidoDetalle}>
                    <TableCell>
                      {detalle.producto ? detalle.producto.nombreProducto : `Producto #${detalle.idProducto}`}
                    </TableCell>
                    <TableCell align="right">₲ {detalle.precioUnitario.toLocaleString("es-PY")}</TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell align="right">
                      ₲ {Math.round(detalle.cantidad * detalle.precioUnitario).toLocaleString("es-PY")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay productos en este pedido
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container justifyContent="flex-end">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" align="right">
                Total: ₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  )
}
