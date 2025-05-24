"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"

export default function CrearOrdenProduccionPage({ params }) {
  const router = useRouter()
  const { id } = use(params)

  const [pedido, setPedido] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [verificacionStock, setVerificacionStock] = useState(null)

  const [formData, setFormData] = useState({
    operadorEncargado: "",
    observaciones: "",
  })

  // Cargar datos del pedido y verificar stock
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)

        // Cargar pedido
        const respuestaPedido = await fetch(`/api/pedidos/${id}`)
        if (!respuestaPedido.ok) {
          throw new Error("Error al cargar pedido")
        }
        const datosPedido = await respuestaPedido.json()
        setPedido(datosPedido)

        // Verificar stock nuevamente
        const respuestaStock = await fetch("/api/pedidos/verificar-stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idPedido: Number.parseInt(id) }),
        })

        if (!respuestaStock.ok) {
          throw new Error("Error al verificar stock")
        }

        const datosStock = await respuestaStock.json()
        setVerificacionStock(datosStock)

        if (!datosStock.stockSuficiente) {
          setError("No hay stock suficiente para crear la orden de producción")
          return
        }

        // Cargar usuarios para operadores
        const respuestaUsuarios = await fetch("/api/usuarios")
        if (respuestaUsuarios.ok) {
          const datosUsuarios = await respuestaUsuarios.json()
          console.log("Datos de usuarios recibidos:", datosUsuarios)

          // La API devuelve { usuarios: [...] }
          if (datosUsuarios.usuarios && Array.isArray(datosUsuarios.usuarios)) {
            setUsuarios(datosUsuarios.usuarios)
          } else {
            console.warn("Los datos de usuarios no tienen el formato esperado:", datosUsuarios)
            setUsuarios([])
          }
        }

        // Establecer observaciones por defecto
        setFormData({
          operadorEncargado: "",
          observaciones: `Orden de producción para pedido #${id}`,
        })
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setCargando(false)
      }
    }

    if (id) {
      cargarDatos()
    }
  }, [id])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.operadorEncargado) {
      setError("Debe seleccionar un operador encargado")
      return
    }

    try {
      setGuardando(true)
      setError(null)

      const respuesta = await fetch("/api/ordenes-produccion/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idPedido: Number.parseInt(id),
          operadorEncargado: formData.operadorEncargado,
          observaciones: formData.observaciones,
        }),
      })

      if (!respuesta.ok) {
        const errorData = await respuesta.json()
        throw new Error(errorData.error || "Error al crear orden de producción")
      }

      const resultado = await respuesta.json()

      // Redirigir al pedido con mensaje de éxito
      router.push(`/pedidos/${id}?mensaje=Orden de producción creada exitosamente`)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setGuardando(false)
    }
  }

  const volver = () => {
    router.push(`/pedidos/${id}`)
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
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={volver}>
          Volver al pedido
        </Button>
      </Box>
    )
  }

  if (!pedido) {
    return (
      <Box sx={{ mt: 2 }}>
        <Alert severity="error">Pedido no encontrado</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={volver} sx={{ mt: 2 }}>
          Volver
        </Button>
      </Box>
    )
  }

  return (
    <Box>

      <Box sx={{ p: 3 }}>
        {/* Botón volver arriba del título, alineado a la izquierda */}
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={volver}
            sx={{
              textTransform: "uppercase",
              fontWeight: 500,
              color: "#1976d2",
              fontSize: "0.875rem",
              border: "1px solid #1976d2",
              borderRadius: "4px",
              px: 2,
              py: 0.5,
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.04)",
              },
            }}
          >
            Volver al pedido
          </Button>
        </Box>

        {/* Título negro alineado a la izquierda */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 400,
            color: "#000000",
            fontSize: "1.75rem",
            mb: 4,
          }}
        >
          Crear Orden de Producción
        </Typography>

        {/* Información del pedido */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información del Pedido #{pedido.idPedido}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Cliente:
                </Typography>
                <Typography variant="body1">
                  {pedido.cliente?.persona
                    ? `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}`
                    : "No especificado"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Fecha de entrega:
                </Typography>
                <Typography variant="body1">
                  {pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleDateString() : "No especificada"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Total:
                </Typography>
                <Typography variant="body1">₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Productos del pedido */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Productos a Producir
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedido.pedidoDetalle?.map((detalle, index) => (
                    <TableRow key={index}>
                      <TableCell>{detalle.producto?.nombreProducto || `Producto #${detalle.idProducto}`}</TableCell>
                      <TableCell align="right">{detalle.cantidad}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Verificación de stock */}
        {verificacionStock && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verificación de Stock
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                ✓ Stock suficiente para todos los productos
              </Alert>
              {verificacionStock.resultadosVerificacion?.map((resultado, index) => (
                <Typography key={index} variant="body2" sx={{ mb: 1 }}>
                  • {resultado.producto}: {resultado.cantidad} unidades ({resultado.lotesNecesarios} lotes de{" "}
                  {resultado.cantidadPorLote} unidades c/u)
                </Typography>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Formulario de orden de producción */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Datos de la Orden de Producción
          </Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Operador Encargado</InputLabel>
                  <Select
                    name="operadorEncargado"
                    value={formData.operadorEncargado}
                    onChange={handleInputChange}
                    label="Operador Encargado"
                  >
                    {Array.isArray(usuarios) && usuarios.length > 0 ? (
                      usuarios.map((usuario) => (
                        <MenuItem key={usuario.idUsuario} value={usuario.idUsuario}>
                          {usuario.persona
                            ? `${usuario.persona.nombre} ${usuario.persona.apellido} (${usuario.nombreUsuario})`
                            : usuario.nombreUsuario}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No hay usuarios disponibles</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleInputChange}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Nota:</strong> La fecha de inicio se establecerá automáticamente al momento de crear la
                    orden. La fecha de finalización se registrará cuando la orden cambie al estado "FINALIZADO".
                  </Typography>
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                  <Button variant="outlined" onClick={volver}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={guardando ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={guardando}
                  >
                    {guardando ? "Creando..." : "Crear Orden de Producción"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Box>
  )
}
