"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SaveIcon from "@mui/icons-material/Save"
import PersonIcon from "@mui/icons-material/Person"
import InventoryIcon from "@mui/icons-material/Inventory"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import { format } from "date-fns"

export default function FormularioPedido() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Estados para los datos del formulario
  const [pedido, setPedido] = useState({
    fechaPedido: format(new Date(), "yyyy-MM-dd"),
    idCliente: "",
    idUsuario: "",
    idEstadoPedido: 1, // Por defecto, estado "Pendiente"
    observacion: "", // Cambiado de "observaciones" a "observacion" según el modelo
  })

  // Estados para los catálogos
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [estadosPedido, setEstadosPedido] = useState([])
  const [productos, setProductos] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  // Estado para el detalle del pedido
  const [detalles, setDetalles] = useState([])
  const [productoActual, setProductoActual] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [precio, setPrecio] = useState(0)

  // Estado para errores de validación
  const [errores, setErrores] = useState({})

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true)
        await Promise.all([cargarClientes(), cargarUsuarios(), cargarEstadosPedido(), cargarProductos()])
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        setSnackbar({
          abierto: true,
          mensaje: "Error al cargar datos iniciales",
          tipo: "error",
        })
      } finally {
        setCargando(false)
      }
    }

    cargarDatos()
  }, [])

  // Cargar clientes
  const cargarClientes = async () => {
    try {
      const respuesta = await fetch("/api/clientes")
      if (!respuesta.ok) throw new Error("Error al cargar clientes")
      const datos = await respuesta.json()
      setClientes(datos || [])
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  // Cargar usuarios
  const cargarUsuarios = async () => {
    try {
      const respuesta = await fetch("/api/usuarios")
      if (!respuesta.ok) throw new Error("Error al cargar usuarios")
      const datos = await respuesta.json()
      setUsuarios(datos.usuarios || [])
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  // Cargar estados de pedido
  const cargarEstadosPedido = async () => {
    try {
      const respuesta = await fetch("/api/estados-pedido")
      if (!respuesta.ok) throw new Error("Error al cargar estados de pedido")
      const datos = await respuesta.json()
      setEstadosPedido(datos.estadosPedido || [])
    } catch (error) {
      console.error("Error:", error)
      // Si falla, usar estados predeterminados
      setEstadosPedido([
        { idEstadoPedido: 1, nombre: "Pendiente" },
        { idEstadoPedido: 2, nombre: "En proceso" },
        { idEstadoPedido: 3, nombre: "Completado" },
        { idEstadoPedido: 4, nombre: "Cancelado" },
      ])
    }
  }

  // Cargar productos
  const cargarProductos = async () => {
    try {
      const respuesta = await fetch("/api/productos")
      if (!respuesta.ok) throw new Error("Error al cargar productos")
      const datos = await respuesta.json()
      setProductos(datos || [])
    } catch (error) {
      console.error("Error:", error)
      throw error
    }
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    setPedido({
      ...pedido,
      [name]: value,
    })

    // Limpiar error del campo
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: null,
      })
    }
  }

  // Manejar selección de cliente
  const handleClienteChange = (event, newValue) => {
    setClienteSeleccionado(newValue)
    setPedido({
      ...pedido,
      idCliente: newValue ? newValue.idCliente : "",
    })

    // Limpiar error del campo
    if (errores.idCliente) {
      setErrores({
        ...errores,
        idCliente: null,
      })
    }
  }

  // Manejar selección de usuario
  const handleUsuarioChange = (event, newValue) => {
    setUsuarioSeleccionado(newValue)
    setPedido({
      ...pedido,
      idUsuario: newValue ? newValue.idUsuario : "",
    })

    // Limpiar error del campo
    if (errores.idUsuario) {
      setErrores({
        ...errores,
        idUsuario: null,
      })
    }
  }

  // Manejar selección de producto
  const handleProductoChange = (event, newValue) => {
    setProductoActual(newValue)
    if (newValue) {
      setPrecio(newValue.precioUnitario || 0)
    } else {
      setPrecio(0)
    }
  }

  // Agregar producto al detalle
  const agregarProducto = () => {
    if (!productoActual) {
      setSnackbar({
        abierto: true,
        mensaje: "Debe seleccionar un producto",
        tipo: "error",
      })
      return
    }

    if (cantidad <= 0) {
      setSnackbar({
        abierto: true,
        mensaje: "La cantidad debe ser mayor a cero",
        tipo: "error",
      })
      return
    }

    // Verificar si el producto ya está en el detalle
    const productoExistente = detalles.find((detalle) => detalle.idProducto === productoActual.idProducto)

    if (productoExistente) {
      // Actualizar cantidad si el producto ya existe
      const nuevosDetalles = detalles.map((detalle) =>
        detalle.idProducto === productoActual.idProducto
          ? {
              ...detalle,
              cantidad: detalle.cantidad + cantidad,
              subtotal: (detalle.cantidad + cantidad) * detalle.precioUnitario,
            }
          : detalle,
      )
      setDetalles(nuevosDetalles)
    } else {
      // Agregar nuevo producto al detalle
      const nuevoDetalle = {
        idProducto: productoActual.idProducto,
        nombreProducto: productoActual.nombreProducto,
        cantidad: cantidad,
        precioUnitario: precio,
        subtotal: cantidad * precio,
      }
      setDetalles([...detalles, nuevoDetalle])
    }

    // Limpiar campos
    setProductoActual(null)
    setCantidad(1)
    setPrecio(0)
  }

  // Eliminar producto del detalle
  const eliminarProducto = (index) => {
    const nuevosDetalles = [...detalles]
    nuevosDetalles.splice(index, 1)
    setDetalles(nuevosDetalles)
  }

  // Calcular total del pedido
  const calcularTotal = () => {
    return detalles.reduce((total, detalle) => total + detalle.subtotal, 0)
  }

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!pedido.fechaPedido) {
      nuevosErrores.fechaPedido = "La fecha es obligatoria"
    }

    if (!pedido.idCliente) {
      nuevosErrores.idCliente = "Debe seleccionar un cliente"
    }

    if (!pedido.idUsuario) {
      nuevosErrores.idUsuario = "Debe seleccionar un usuario"
    }

    if (detalles.length === 0) {
      nuevosErrores.detalles = "Debe agregar al menos un producto al pedido"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Guardar pedido
  const guardarPedido = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      setSnackbar({
        abierto: true,
        mensaje: "Por favor, corrija los errores en el formulario",
        tipo: "error",
      })
      return
    }

    setGuardando(true)

    try {
      // Crear objeto con datos del pedido y sus detalles
      const pedidoCompleto = {
        pedido: {
          fechaPedido: pedido.fechaPedido,
          idCliente: Number.parseInt(pedido.idCliente),
          idUsuario: Number.parseInt(pedido.idUsuario),
          idEstadoPedido: Number.parseInt(pedido.idEstadoPedido),
          observacion: pedido.observacion || "",
          montoTotal: calcularTotal(), // Cambiado de "total" a "montoTotal"
        },
        detalles: detalles.map((detalle) => ({
          idProducto: detalle.idProducto,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
        })),
      }

      // Enviar datos al servidor
      const respuesta = await fetch("/api/pedidos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedidoCompleto),
      })

      if (!respuesta.ok) {
        const error = await respuesta.json()
        throw new Error(error.error || "Error al guardar el pedido")
      }

      const resultado = await respuesta.json()

      setSnackbar({
        abierto: true,
        mensaje: `Pedido #${resultado.pedido.idPedidoCliente} creado exitosamente`,
        tipo: "success",
      })

      // Redirigir a la lista de pedidos después de un breve retraso
      setTimeout(() => {
        router.push("/pedidos")
      }, 2000)
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: error.message || "Error al guardar el pedido",
        tipo: "error",
      })
    } finally {
      setGuardando(false)
    }
  }

  // Cancelar y volver a la lista
  const cancelar = () => {
    router.push("/pedidos")
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

  return (
    <Box component="form" onSubmit={guardarPedido} noValidate>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <ShoppingCartIcon sx={{ mr: 1 }} /> Datos del Pedido
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="fechaPedido"
              label="Fecha del Pedido"
              type="date"
              value={pedido.fechaPedido}
              onChange={handleChange}
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
              error={!!errores.fechaPedido}
              helperText={errores.fechaPedido}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal" error={!!errores.idEstadoPedido}>
              <InputLabel id="estado-pedido-label">Estado del Pedido</InputLabel>
              <Select
                labelId="estado-pedido-label"
                name="idEstadoPedido"
                value={pedido.idEstadoPedido}
                onChange={handleChange}
                label="Estado del Pedido"
              >
                {estadosPedido.map((estado) => (
                  <MenuItem key={estado.idEstadoPedido} value={estado.idEstadoPedido}>
                    {estado.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              id="cliente-select"
              options={clientes}
              getOptionLabel={(option) =>
                `${option.persona?.nombre || ""} ${option.persona?.apellido || ""} (${
                  option.sectorCliente?.nombreSector || ""
                })`
              }
              value={clienteSeleccionado}
              onChange={handleClienteChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  margin="normal"
                  error={!!errores.idCliente}
                  helperText={errores.idCliente}
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Autocomplete
              id="usuario-select"
              options={usuarios}
              getOptionLabel={(option) =>
                `${option.nombreUsuario} (${option.persona?.nombre || ""} ${option.persona?.apellido || ""})`
              }
              value={usuarioSeleccionado}
              onChange={handleUsuarioChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Usuario"
                  margin="normal"
                  error={!!errores.idUsuario}
                  helperText={errores.idUsuario}
                  required
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="observacion"
              label="Observaciones"
              value={pedido.observacion}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <InventoryIcon sx={{ mr: 1 }} /> Productos
        </Typography>

        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} md={5}>
            <Autocomplete
              id="producto-select"
              options={productos}
              getOptionLabel={(option) => `${option.nombreProducto} (${option.tipoProducto?.nombreTipo || ""})`}
              value={productoActual}
              onChange={handleProductoChange}
              renderInput={(params) => <TextField {...params} label="Producto" margin="normal" fullWidth />}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Number.parseInt(e.target.value) || 0))}
              fullWidth
              margin="normal"
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              label="Precio Unitario"
              type="number"
              value={precio}
              onChange={(e) => setPrecio(Number.parseFloat(e.target.value) || 0)}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start">₲</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={agregarProducto}
              fullWidth
              sx={{ mt: 1 }}
            >
              Agregar
            </Button>
          </Grid>
        </Grid>

        {errores.detalles && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errores.detalles}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Precio Unit.</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay productos agregados al pedido
                  </TableCell>
                </TableRow>
              ) : (
                detalles.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell>{detalle.nombreProducto}</TableCell>
                    <TableCell align="right">₲ {detalle.precioUnitario.toLocaleString("es-PY")}</TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell align="right">₲ {Math.round(detalle.subtotal).toLocaleString("es-PY")}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" size="small" onClick={() => eliminarProducto(index)} title="Eliminar">
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

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container justifyContent="flex-end">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" align="right">
                Total: ₲ {Math.round(calcularTotal()).toLocaleString("es-PY")}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mb: 4 }}>
        <Button variant="outlined" onClick={cancelar} disabled={guardando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={guardando ? <CircularProgress size={24} /> : <SaveIcon />}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar Pedido"}
        </Button>
      </Box>

      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  )
}
