"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  MenuItem,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material"
import { DatePicker } from "@mui/x-date-pickers/DatePicker"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SearchIcon from "@mui/icons-material/Search"
import dayjs from "dayjs"
import "dayjs/locale/es"

export default function EditarPedidoForm({ pedidoOriginal, onCancelar }) {
  const router = useRouter()

  // Estados para el formulario
  const [pedido, setPedido] = useState({
    idCliente: null,
    fechaPedido: dayjs(),
    fechaEntrega: dayjs().add(1, "day"),
    idEstadoPedido: 1,
    observacion: "",
    detalles: [],
  })

  const [cliente, setCliente] = useState(null)
  const [productos, setProductos] = useState([])
  const [estadosPedido, setEstadosPedido] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [errores, setErrores] = useState({})
  const [notificacion, setNotificacion] = useState({ open: false, mensaje: "", tipo: "info" })

  // Estados para el diálogo de búsqueda de clientes
  const [dialogoClienteAbierto, setDialogoClienteAbierto] = useState(false)
  const [busquedaCliente, setBusquedaCliente] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    nombre: "",
    apellido: "",
  })
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false)
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [mensajeBusqueda, setMensajeBusqueda] = useState("")

  // Inicializar el formulario con los datos del pedido original
  useEffect(() => {
    if (pedidoOriginal) {
      console.log("Inicializando formulario con datos del pedido:", pedidoOriginal)

      // Extraer los datos del cliente
      const clienteData = pedidoOriginal.cliente || {}
      const personaData = clienteData.persona || {}

      // Configurar el cliente
      setCliente({
        idCliente: clienteData.idCliente,
        persona: personaData,
      })

      // Configurar los detalles del pedido
      const detallesFormateados = (pedidoOriginal.pedidoDetalle || []).map((detalle) => {
        // Calcular el precio unitario si no está disponible
        const precioUnitario =
          detalle.precioUnitario !== undefined
            ? detalle.precioUnitario
            : detalle.subtotal && detalle.cantidad
              ? detalle.subtotal / detalle.cantidad
              : 0

        return {
          idProducto: detalle.idProducto,
          producto: detalle.producto,
          cantidad: detalle.cantidad,
          precioUnitario: precioUnitario,
          subtotal: detalle.subtotal || precioUnitario * detalle.cantidad,
        }
      })

      // Actualizar el estado del pedido
      setPedido({
        idCliente: clienteData.idCliente,
        fechaPedido: dayjs(pedidoOriginal.fechaPedido),
        fechaEntrega: dayjs(pedidoOriginal.fechaEntrega),
        idEstadoPedido: pedidoOriginal.estadoPedido?.idEstadoPedido || 1,
        observacion: pedidoOriginal.observacion || "",
        detalles: detallesFormateados,
      })
    }

    // Cargar datos necesarios
    cargarProductos()
    cargarEstadosPedido()
    cargarTiposDocumento()
  }, [pedidoOriginal])

  // Cargar productos disponibles
  const cargarProductos = async () => {
    try {
      console.log("Cargando productos...")
      const respuesta = await fetch("/api/productos")

      if (!respuesta.ok) {
        throw new Error(`Error al cargar productos: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Productos cargados:", datos)

      // Verificar la estructura de los datos
      if (Array.isArray(datos)) {
        setProductos(datos)
      } else if (datos.productos && Array.isArray(datos.productos)) {
        setProductos(datos.productos)
      } else {
        console.error("Formato de datos de productos inesperado:", datos)
        setProductos([])
      }
    } catch (error) {
      console.error("Error al cargar productos:", error)
      setNotificacion({
        open: true,
        mensaje: `Error al cargar productos: ${error.message}`,
        tipo: "error",
      })
      setProductos([])
    }
  }

  // Cargar estados de pedido disponibles
  const cargarEstadosPedido = async () => {
    try {
      console.log("Cargando estados de pedido...")
      const respuesta = await fetch("/api/estados-pedido")

      if (!respuesta.ok) {
        throw new Error(`Error al cargar estados de pedido: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Estados de pedido cargados:", datos)

      if (Array.isArray(datos)) {
        setEstadosPedido(datos)
      } else {
        console.error("Formato de datos de estados de pedido inesperado:", datos)
        setEstadosPedido([])
      }
    } catch (error) {
      console.error("Error al cargar estados de pedido:", error)
      setNotificacion({
        open: true,
        mensaje: `Error al cargar estados de pedido: ${error.message}`,
        tipo: "error",
      })
      setEstadosPedido([])
    }
  }

  // Cargar tipos de documento para la búsqueda de clientes
  const cargarTiposDocumento = async () => {
    try {
      console.log("Cargando tipos de documento...")
      const respuesta = await fetch("/api/tipos-documento")

      if (!respuesta.ok) {
        throw new Error(`Error al cargar tipos de documento: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Tipos de documento cargados:", datos)

      if (Array.isArray(datos)) {
        setTiposDocumento(datos)
      } else {
        console.error("Formato de datos de tipos de documento inesperado:", datos)
        setTiposDocumento([])
      }
    } catch (error) {
      console.error("Error al cargar tipos de documento:", error)
      setTiposDocumento([])
    }
  }

  // Abrir diálogo de búsqueda de clientes
  const abrirDialogoBusqueda = () => {
    setDialogoClienteAbierto(true)
    setBusquedaCliente({ tipoDocumento: "", numeroDocumento: "", nombre: "", apellido: "" })
    setResultadosBusqueda([])
    setMensajeBusqueda("")
  }

  // Cerrar diálogo de búsqueda de clientes
  const cerrarDialogoBusqueda = () => {
    setDialogoClienteAbierto(false)
  }

  // Buscar clientes por documento
  const buscarClientesPorDocumento = async () => {
    if (!busquedaCliente.tipoDocumento || !busquedaCliente.numeroDocumento) {
      setMensajeBusqueda("Por favor, ingrese tipo y número de documento")
      return
    }

    setCargandoBusqueda(true)
    setMensajeBusqueda("")

    try {
      console.log("Buscando cliente por documento:", busquedaCliente)
      const respuesta = await fetch(
        `/api/clientes?tipoDocumento=${busquedaCliente.tipoDocumento}&numeroDocumento=${busquedaCliente.numeroDocumento}`,
      )

      if (!respuesta.ok) {
        throw new Error(`Error en la búsqueda: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Resultados de búsqueda por documento:", datos)

      if (Array.isArray(datos) && datos.length > 0) {
        setResultadosBusqueda(datos)
      } else {
        setResultadosBusqueda([])
        setMensajeBusqueda("No se encontraron clientes con ese documento")
      }
    } catch (error) {
      console.error("Error al buscar clientes por documento:", error)
      setMensajeBusqueda(`Error al buscar: ${error.message}`)
      setResultadosBusqueda([])
    } finally {
      setCargandoBusqueda(false)
    }
  }

  // Buscar clientes por nombre/apellido
  const buscarClientesPorNombre = async () => {
    if (!busquedaCliente.nombre && !busquedaCliente.apellido) {
      setMensajeBusqueda("Por favor, ingrese nombre o apellido")
      return
    }

    setCargandoBusqueda(true)
    setMensajeBusqueda("")

    try {
      console.log("Buscando cliente por nombre/apellido:", busquedaCliente)
      const query = busquedaCliente.nombre || busquedaCliente.apellido
      const respuesta = await fetch(`/api/clientes/buscar?query=${query}`)

      if (!respuesta.ok) {
        throw new Error(`Error en la búsqueda: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Resultados de búsqueda por nombre/apellido:", datos)

      if (Array.isArray(datos) && datos.length > 0) {
        setResultadosBusqueda(datos)
      } else {
        setResultadosBusqueda([])
        setMensajeBusqueda("No se encontraron clientes con ese nombre/apellido")
      }
    } catch (error) {
      console.error("Error al buscar clientes por nombre/apellido:", error)
      setMensajeBusqueda(`Error al buscar: ${error.message}`)
      setResultadosBusqueda([])
    } finally {
      setCargandoBusqueda(false)
    }
  }

  // Seleccionar un cliente de los resultados de búsqueda
  const seleccionarCliente = (clienteSeleccionado) => {
    console.log("Cliente seleccionado:", clienteSeleccionado)
    setCliente(clienteSeleccionado)
    setPedido({
      ...pedido,
      idCliente: clienteSeleccionado.idCliente,
    })
    cerrarDialogoBusqueda()
  }

  // Agregar un producto al pedido
  const agregarProducto = () => {
    if (!productoSeleccionado) {
      setErrores({
        ...errores,
        producto: "Debe seleccionar un producto",
      })
      return
    }

    if (!cantidad || cantidad <= 0) {
      setErrores({
        ...errores,
        cantidad: "La cantidad debe ser mayor a 0",
      })
      return
    }

    // Verificar si el producto ya está en el pedido
    const productoExistente = pedido.detalles.find((detalle) => detalle.idProducto === productoSeleccionado.id)

    if (productoExistente) {
      // Actualizar la cantidad si el producto ya existe
      const detallesActualizados = pedido.detalles.map((detalle) => {
        if (detalle.idProducto === productoSeleccionado.id) {
          return {
            ...detalle,
            cantidad: detalle.cantidad + cantidad,
            subtotal: detalle.precioUnitario * (detalle.cantidad + cantidad),
          }
        }
        return detalle
      })

      setPedido({
        ...pedido,
        detalles: detallesActualizados,
      })
    } else {
      // Agregar nuevo producto
      const nuevoDetalle = {
        idProducto: productoSeleccionado.id,
        producto: productoSeleccionado,
        cantidad: cantidad,
        precioUnitario: productoSeleccionado.precio || 0,
        subtotal: (productoSeleccionado.precio || 0) * cantidad,
      }

      setPedido({
        ...pedido,
        detalles: [...pedido.detalles, nuevoDetalle],
      })
    }

    // Limpiar selección
    setProductoSeleccionado(null)
    setCantidad(1)
    setErrores({
      ...errores,
      producto: null,
      cantidad: null,
    })
  }

  // Eliminar un producto del pedido
  const eliminarProducto = (index) => {
    const nuevosDetalles = [...pedido.detalles]
    nuevosDetalles.splice(index, 1)

    setPedido({
      ...pedido,
      detalles: nuevosDetalles,
    })
  }

  // Calcular el total del pedido
  const calcularTotal = () => {
    return pedido.detalles.reduce((total, detalle) => total + detalle.subtotal, 0)
  }

  // Validar el formulario antes de enviar
  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!pedido.idCliente) {
      nuevosErrores.idCliente = "Debe seleccionar un cliente"
    }

    if (!pedido.fechaPedido) {
      nuevosErrores.fechaPedido = "Debe seleccionar una fecha de pedido"
    }

    if (!pedido.fechaEntrega) {
      nuevosErrores.fechaEntrega = "Debe seleccionar una fecha de entrega"
    }

    if (pedido.detalles.length === 0) {
      nuevosErrores.detalles = "Debe agregar al menos un producto"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      setNotificacion({
        open: true,
        mensaje: "Por favor, corrija los errores antes de continuar",
        tipo: "error",
      })
      return
    }

    setCargando(true)

    try {
      // Preparar los datos para enviar
      const pedidoActualizado = {
        idPedido: pedidoOriginal.idPedido,
        idCliente: pedido.idCliente,
        fechaPedido: pedido.fechaPedido.format("YYYY-MM-DD"),
        fechaEntrega: pedido.fechaEntrega.format("YYYY-MM-DD"),
        idEstadoPedido: pedido.idEstadoPedido,
        observacion: pedido.observacion,
        detalles: pedido.detalles.map((detalle) => ({
          idProducto: detalle.idProducto,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
        })),
      }

      console.log("Enviando pedido actualizado:", pedidoActualizado)

      // Enviar la solicitud PUT
      const respuesta = await fetch(`/api/pedidos/${pedidoOriginal.idPedido}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedidoActualizado),
      })

      if (!respuesta.ok) {
        const error = await respuesta.json()
        throw new Error(error.message || `Error al actualizar pedido: ${respuesta.status}`)
      }

      const resultado = await respuesta.json()
      console.log("Pedido actualizado correctamente:", resultado)

      setNotificacion({
        open: true,
        mensaje: "Pedido actualizado correctamente",
        tipo: "success",
      })

      // Redirigir a la lista de pedidos después de un breve retraso
      setTimeout(() => {
        router.push("/pedidos")
      }, 2000)
    } catch (error) {
      console.error("Error al actualizar pedido:", error)
      setNotificacion({
        open: true,
        mensaje: `Error al actualizar pedido: ${error.message}`,
        tipo: "error",
      })
    } finally {
      setCargando(false)
    }
  }

  // Formatear nombre de cliente
  const formatearNombreCliente = (cliente) => {
    if (!cliente) return ""

    const persona = cliente.persona || {}
    const nombre = persona.nombre || ""
    const apellido = persona.apellido || ""
    const documento = persona.nroDocumento || ""

    return `${nombre} ${apellido} (${documento})`.trim()
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Información del Pedido
        </Typography>

        <Grid container spacing={3}>
          {/* Cliente */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Cliente"
              value={formatearNombreCliente(cliente)}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <IconButton onClick={abrirDialogoBusqueda}>
                    <SearchIcon />
                  </IconButton>
                ),
                style: { cursor: "pointer" },
              }}
              onClick={abrirDialogoBusqueda}
              error={!!errores.idCliente}
              helperText={errores.idCliente || "Haga clic para buscar un cliente"}
              sx={{ cursor: "pointer" }}
            />
          </Grid>

          {/* Estado del pedido */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="estado-pedido-label">Estado del Pedido</InputLabel>
              <Select
                labelId="estado-pedido-label"
                value={pedido.idEstadoPedido}
                label="Estado del Pedido"
                onChange={(e) => setPedido({ ...pedido, idEstadoPedido: e.target.value })}
              >
                {estadosPedido.map((estado) => (
                  <MenuItem key={estado.idEstadoPedido} value={estado.idEstadoPedido}>
                    {estado.descEstadoPedido}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Fecha de pedido */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Fecha de Pedido"
                value={pedido.fechaPedido}
                onChange={(newValue) => setPedido({ ...pedido, fechaPedido: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errores.fechaPedido,
                    helperText: errores.fechaPedido,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Fecha de entrega */}
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DatePicker
                label="Fecha de Entrega"
                value={pedido.fechaEntrega}
                onChange={(newValue) => setPedido({ ...pedido, fechaEntrega: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!errores.fechaEntrega,
                    helperText: errores.fechaEntrega,
                  },
                }}
              />
            </LocalizationProvider>
          </Grid>

          {/* Observaciones */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observaciones"
              multiline
              rows={3}
              value={pedido.observacion}
              onChange={(e) => setPedido({ ...pedido, observacion: e.target.value })}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Productos
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Selección de producto */}
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={productos}
              getOptionLabel={(option) => `${option.nombre} - ${option.tipoProducto?.descTipoProducto || ""}`}
              value={productoSeleccionado}
              onChange={(event, newValue) => setProductoSeleccionado(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Producto" error={!!errores.producto} helperText={errores.producto} />
              )}
            />
          </Grid>

          {/* Cantidad */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Cantidad"
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number.parseInt(e.target.value) || 0)}
              error={!!errores.cantidad}
              helperText={errores.cantidad}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Grid>

          {/* Botón agregar */}
          <Grid item xs={12} md={4} sx={{ display: "flex", alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={agregarProducto}
              disabled={!productoSeleccionado}
            >
              Agregar Producto
            </Button>
          </Grid>
        </Grid>

        {/* Tabla de productos */}
        {pedido.detalles.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pedido.detalles.map((detalle, index) => (
                  <TableRow key={index}>
                    <TableCell>{detalle.producto?.nombre || `Producto #${detalle.idProducto}`}</TableCell>
                    <TableCell align="right">₲ {detalle.precioUnitario.toLocaleString("es-PY")}</TableCell>
                    <TableCell align="right">{detalle.cantidad}</TableCell>
                    <TableCell align="right">₲ {detalle.subtotal.toLocaleString("es-PY")}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => eliminarProducto(index)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total:
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      ₲ {calcularTotal().toLocaleString("es-PY")}
                    </Typography>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay productos agregados al pedido
          </Alert>
        )}

        {errores.detalles && (
          <Typography color="error" sx={{ mt: 2 }}>
            {errores.detalles}
          </Typography>
        )}
      </Paper>

      {/* Botones de acción */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
        <Button variant="outlined" onClick={onCancelar} disabled={cargando}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={cargando}
          startIcon={cargando ? <CircularProgress size={20} /> : null}
        >
          {cargando ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </Box>

      {/* Diálogo de búsqueda de clientes */}
      <Dialog open={dialogoClienteAbierto} onClose={cerrarDialogoBusqueda} maxWidth="md" fullWidth>
        <DialogTitle>Buscar Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Buscar por documento:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="tipo-documento-label">Tipo de Documento</InputLabel>
                <Select
                  labelId="tipo-documento-label"
                  value={busquedaCliente.tipoDocumento}
                  label="Tipo de Documento"
                  onChange={(e) => setBusquedaCliente({ ...busquedaCliente, tipoDocumento: e.target.value })}
                >
                  {tiposDocumento.map((tipo) => (
                    <MenuItem key={tipo.idTipoDocumento} value={tipo.idTipoDocumento}>
                      {tipo.descTipoDocumento}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Documento"
                value={busquedaCliente.numeroDocumento}
                onChange={(e) => setBusquedaCliente({ ...busquedaCliente, numeroDocumento: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={buscarClientesPorDocumento}
                disabled={cargandoBusqueda}
                startIcon={cargandoBusqueda ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Buscar por Documento
              </Button>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                O buscar por nombre/apellido:
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={busquedaCliente.nombre}
                onChange={(e) => setBusquedaCliente({ ...busquedaCliente, nombre: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={busquedaCliente.apellido}
                onChange={(e) => setBusquedaCliente({ ...busquedaCliente, apellido: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={buscarClientesPorNombre}
                disabled={cargandoBusqueda}
                startIcon={cargandoBusqueda ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Buscar por Nombre/Apellido
              </Button>
            </Grid>
          </Grid>

          {mensajeBusqueda && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {mensajeBusqueda}
            </Alert>
          )}

          {cargandoBusqueda ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : resultadosBusqueda.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Documento</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Apellido</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resultadosBusqueda.map((cliente) => {
                    const persona = cliente.persona || {}
                    return (
                      <TableRow key={cliente.idCliente}>
                        <TableCell>{persona.nroDocumento || "N/A"}</TableCell>
                        <TableCell>{persona.nombre || "N/A"}</TableCell>
                        <TableCell>{persona.apellido || "N/A"}</TableCell>
                        <TableCell align="center">
                          <Button variant="contained" size="small" onClick={() => seleccionarCliente(cliente)}>
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoBusqueda}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Notificaciones */}
      <Snackbar
        open={notificacion.open}
        autoHideDuration={6000}
        onClose={() => setNotificacion({ ...notificacion, open: false })}
      >
        <Alert
          onClose={() => setNotificacion({ ...notificacion, open: false })}
          severity={notificacion.tipo}
          sx={{ width: "100%" }}
        >
          {notificacion.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  )
}
