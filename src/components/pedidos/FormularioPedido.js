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
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"

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
    // No incluimos fechaPedido ya que se usará la fecha actual
    fechaEntrega: "", // Nuevo campo para fecha de entrega
    idCliente: "",
    idUsuario: 1, // Usuario fijo con ID 1
    idEstadoPedido: 1, // Estado "Pendiente" por defecto
    observacion: "",
  })

  // Estados para los catálogos
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [cargandoClientes, setCargandoClientes] = useState(false)
  const [cargandoProductos, setCargandoProductos] = useState(false)

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
        await Promise.all([cargarClientes(), cargarProductos()])
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error)
        setSnackbar({
          abierto: true,
          mensaje: "Error al cargar datos iniciales: " + error.message,
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
    setCargandoClientes(true)
    try {
      // Intentar con el endpoint principal
      console.log("Intentando cargar clientes desde /api/clientes...")
      const respuesta = await fetch("/api/clientes")

      if (respuesta.ok) {
        const datos = await respuesta.json()
        console.log("Respuesta de clientes:", datos)

        if (datos.clientes && Array.isArray(datos.clientes)) {
          console.log(`Se cargaron ${datos.clientes.length} clientes`)
          setClientes(datos.clientes)
          return
        } else if (Array.isArray(datos)) {
          console.log(`Se cargaron ${datos.length} clientes (formato array)`)
          setClientes(datos)
          return
        } else {
          console.warn("Formato de respuesta inesperado para clientes:", datos)
        }
      } else {
        console.error("Error al cargar clientes desde /api/clientes:", await respuesta.text())
      }

      // Si el endpoint principal falla, intentar con /api/clientes/debug
      console.log("Intentando cargar clientes desde /api/clientes/debug...")
      const respuestaDebug = await fetch("/api/clientes/debug")

      if (respuestaDebug.ok) {
        const datosDebug = await respuestaDebug.json()
        console.log("Respuesta de clientes/debug:", datosDebug)

        if (datosDebug.clientes && Array.isArray(datosDebug.clientes) && datosDebug.clientes.length > 0) {
          console.log(`Se cargaron ${datosDebug.clientes.length} clientes desde /api/clientes/debug`)
          setClientes(datosDebug.clientes)
          return
        } else {
          console.warn("No se encontraron clientes en /api/clientes/debug:", datosDebug)
        }
      } else {
        console.error("Error al cargar clientes desde /api/clientes/debug:", await respuestaDebug.text())
      }

      // Si todo falla, usar datos de ejemplo
      throw new Error("No se pudieron cargar los clientes desde ningún endpoint")
    } catch (error) {
      console.error("Error al cargar clientes:", error)

      // Crear algunos clientes de ejemplo como último recurso
      console.log("Creando clientes de ejemplo como último recurso...")
      const clientesEjemplo = [
        {
          idCliente: 1,
          nombre: "Juan",
          apellido: "Pérez",
          nroDocumento: "1234567",
        },
        {
          idCliente: 2,
          nombre: "María",
          apellido: "González",
          nroDocumento: "7654321",
        },
      ]

      console.log("Usando clientes de ejemplo:", clientesEjemplo)
      setClientes(clientesEjemplo)

      setSnackbar({
        abierto: true,
        mensaje: "No se pudieron cargar los clientes reales. Usando datos de ejemplo.",
        tipo: "warning",
      })
    } finally {
      setCargandoClientes(false)
    }
  }

  // Cargar productos
  const cargarProductos = async () => {
    setCargandoProductos(true)
    try {
      console.log("Intentando cargar productos...")
      const respuesta = await fetch("/api/productos")

      if (!respuesta.ok) {
        throw new Error(`Error al cargar productos: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Respuesta de productos:", datos)

      if (datos.productos && Array.isArray(datos.productos)) {
        console.log(`Se cargaron ${datos.productos.length} productos`)
        setProductos(datos.productos)
      } else if (Array.isArray(datos)) {
        console.log(`Se cargaron ${datos.length} productos (formato array)`)
        setProductos(datos)
      } else {
        console.warn("Formato de respuesta inesperado para productos:", datos)
        setProductos([])
      }
    } catch (error) {
      console.error("Error al cargar productos:", error)

      // Crear algunos productos de ejemplo como último recurso
      console.log("Creando productos de ejemplo como último recurso...")
      const productosEjemplo = [
        {
          idProducto: 1,
          nombreProducto: "Producto 1",
          descripcion: "Descripción del producto 1",
          precioUnitario: 10000,
        },
        {
          idProducto: 2,
          nombreProducto: "Producto 2",
          descripcion: "Descripción del producto 2",
          precioUnitario: 20000,
        },
      ]

      console.log("Usando productos de ejemplo:", productosEjemplo)
      setProductos(productosEjemplo)

      setSnackbar({
        abierto: true,
        mensaje: "No se pudieron cargar los productos reales. Usando datos de ejemplo.",
        tipo: "warning",
      })
    } finally {
      setCargandoProductos(false)
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
    console.log("Cliente seleccionado:", newValue)
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

  // Manejar selección de producto
  const handleProductoChange = (event, newValue) => {
    console.log("Producto seleccionado:", newValue)
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

    if (precio <= 0) {
      setSnackbar({
        abierto: true,
        mensaje: "El precio debe ser mayor a cero",
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
        descripcion: productoActual.descripcion || "Sin descripción",
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

    if (!pedido.idCliente) {
      nuevosErrores.idCliente = "Debe seleccionar un cliente"
    }

    if (detalles.length === 0) {
      nuevosErrores.detalles = "Debe agregar al menos un producto al pedido"
    }

    // Validar fecha de entrega si se ha ingresado
    if (pedido.fechaEntrega) {
      const fechaEntrega = new Date(pedido.fechaEntrega)
      if (isNaN(fechaEntrega.getTime())) {
        nuevosErrores.fechaEntrega = "La fecha de entrega no es válida"
      }
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
          // No incluimos fechaPedido, se usará la fecha actual en el backend
          fechaEntrega: pedido.fechaEntrega || null, // Incluir fecha de entrega si existe
          idCliente: Number.parseInt(pedido.idCliente),
          vendedor: 1, // Usuario fijo con ID 1
          idEstadoPedido: 1, // Estado "Pendiente" por defecto
          observacion: pedido.observacion || "",
          montoTotal: calcularTotal(), // Calculado como la suma de subtotales
        },
        detalles: detalles.map((detalle) => ({
          idProducto: detalle.idProducto,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          // El subtotal se calculará en el backend como cantidad * precioUnitario
        })),
      }

      console.log("Enviando pedido:", pedidoCompleto)

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
        mensaje: `Pedido #${resultado.pedido.idPedido} creado exitosamente`,
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
          <Grid item xs={12}>
            <Autocomplete
              id="cliente-select"
              options={clientes}
              loading={cargandoClientes}
              getOptionLabel={(option) => {
                // Adaptado para manejar diferentes estructuras de datos
                const nombre = option.nombre || (option.persona ? option.persona.nombre : "")
                const apellido = option.apellido || (option.persona ? option.persona.apellido : "")
                const documento = option.nroDocumento || (option.persona ? option.persona.nroDocumento : "")

                return `${nombre} ${apellido} (${documento})`
              }}
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
                    endAdornment: (
                      <>
                        {cargandoClientes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              {clientes.length} cliente(s) disponible(s)
            </Typography>
          </Grid>

          {/* Nuevo campo para fecha de entrega */}
          <Grid item xs={12} md={6}>
            <TextField
              name="fechaEntrega"
              label="Fecha de Entrega"
              type="date"
              value={pedido.fechaEntrega}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errores.fechaEntrega}
              helperText={errores.fechaEntrega || "Opcional"}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarTodayIcon />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1, mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Estado del Pedido:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                Pendiente
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Vendedor:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                Usuario ID: 1
              </Typography>
            </Box>
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
              loading={cargandoProductos}
              getOptionLabel={(option) => {
                // Mostrar descripción en lugar de nombre
                return (
                  option.descripcion || option.nombreProducto || option.nombre || option.idProducto?.toString() || ""
                )
              }}
              value={productoActual}
              onChange={handleProductoChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Producto"
                  margin="normal"
                  fullWidth
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {cargandoProductos ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              {productos.length} producto(s) disponible(s)
            </Typography>
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
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Precio Unit.</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Subtotal</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detalles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay productos agregados al pedido
                  </TableCell>
                </TableRow>
              ) : (
                detalles.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell>{detalle.nombreProducto}</TableCell>
                    <TableCell>{detalle.descripcion}</TableCell>
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Observaciones
        </Typography>
        <TextField
          name="observacion"
          value={pedido.observacion}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          placeholder="Ingrese cualquier observación o nota adicional sobre el pedido"
        />
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
