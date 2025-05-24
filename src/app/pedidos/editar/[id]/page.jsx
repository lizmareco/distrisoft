"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import SaveIcon from "@mui/icons-material/Save"
import PersonIcon from "@mui/icons-material/Person"
import InventoryIcon from "@mui/icons-material/Inventory"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import SearchIcon from "@mui/icons-material/Search"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function EditarPedidoPage({ params }) {
  const router = useRouter()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)

  // Estados para el formulario
  const [formData, setFormData] = useState({
    idCliente: "",
    cliente: null,
    fechaPedido: "",
    fechaEntrega: "",
    observacion: "",
    idEstadoPedido: "", // Mantenemos este campo pero no lo mostramos en el formulario
    productos: [],
  })
  const [errores, setErrores] = useState({})
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Estados para el diálogo de búsqueda de clientes
  const [dialogoBusquedaAbierto, setDialogoBusquedaAbierto] = useState(false)
  const [busquedaManual, setBusquedaManual] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    nombre: "",
    apellido: "",
  })
  const [resultadosBusqueda, setResultadosBusqueda] = useState([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [tiposDocumento, setTiposDocumento] = useState([])

  // Estados para el diálogo de productos
  const [dialogoProductoAbierto, setDialogoProductoAbierto] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [productos, setProductos] = useState([])
  const [editandoProducto, setEditandoProducto] = useState(null)
  const [cargandoProductos, setCargandoProductos] = useState(false)

  // Obtener el ID del pedido de los parámetros de la URL
  const resolvedParams = React.use(params)
  const pedidoId = resolvedParams ? String(resolvedParams.id || "") : ""

  // Función para formatear fechas para visualización
  const formatearFechaVisual = (fechaStr) => {
    if (!fechaStr) return ""
    try {
      // Si la fecha ya viene en formato YYYY-MM-DD, convertir a DD/MM/YYYY
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

      // Si es un objeto Date, convertir a formato DD/MM/YYYY
      if (fechaStr instanceof Date) {
        return `${fechaStr.getDate().toString().padStart(2, "0")}/${(fechaStr.getMonth() + 1).toString().padStart(2, "0")}/${fechaStr.getFullYear()}`
      }

      // Si todo falla, devolver el string original
      return String(fechaStr)
    } catch (error) {
      console.error("Error al formatear fecha:", error, fechaStr)
      return String(fechaStr)
    }
  }

  // Función para determinar el color del chip de estado
  const getEstadoColor = (estado) => {
    if (!estado) return "default"

    const nombreEstado = estado.toLowerCase() || ""

    if (nombreEstado.includes("pendiente")) return "warning"
    if (nombreEstado.includes("proceso")) return "info"
    if (nombreEstado.includes("completado") || nombreEstado.includes("entregado")) return "success"
    if (nombreEstado.includes("cancelado")) return "error"

    return "default"
  }

  // Cargar datos del pedido
  useEffect(() => {
    const cargarPedido = async () => {
      if (!pedidoId) {
        setError("ID de pedido no válido")
        setCargando(false)
        return
      }

      try {
        const respuesta = await fetch(`/api/pedidos/${pedidoId}`)

        if (!respuesta.ok) {
          throw new Error(`Error al cargar el pedido: ${respuesta.status}`)
        }

        const datos = await respuesta.json()
        console.log("Datos del pedido cargados:", datos)

        // Inicializar el formulario con los datos del pedido
        setFormData({
          idCliente: datos.cliente?.idCliente || "",
          cliente: datos.cliente,
          fechaPedido: datos.fechaPedido || "",
          fechaEntrega: datos.fechaEntrega || "",
          observacion: datos.observacion || "",
          idEstadoPedido: datos.estadoPedido?.idEstadoPedido || "",
          estadoPedido: datos.estadoPedido?.descEstadoPedido || "Desconocido",
          productos:
            datos.pedidoDetalle?.map((detalle) => {
              // Calcular el precio unitario si no está disponible
              const precioUnitario =
                detalle.precioUnitario !== undefined
                  ? detalle.precioUnitario
                  : detalle.subtotal && detalle.cantidad
                    ? detalle.subtotal / detalle.cantidad
                    : 0

              return {
                idProducto: detalle.producto?.idProducto || detalle.idProducto,
                producto: detalle.producto,
                cantidad: detalle.cantidad,
                precioUnitario: precioUnitario,
                subtotal: detalle.subtotal || precioUnitario * detalle.cantidad,
              }
            }) || [],
        })

        setPedido(datos)
      } catch (error) {
        console.error("Error al cargar el pedido:", error)
        setError(`Error al cargar el pedido: ${error.message}`)
      } finally {
        setCargando(false)
      }
    }

    cargarPedido()
    cargarTiposDocumento()
    cargarProductos()
  }, [pedidoId])

  // Cargar tipos de documento
  const cargarTiposDocumento = async () => {
    try {
      const respuesta = await fetch("/api/tipos-documento")
      if (respuesta.ok) {
        const datos = await respuesta.json()
        // Asegurarse de que datos sea un array
        if (Array.isArray(datos)) {
          setTiposDocumento(datos)
        } else {
          console.error("La respuesta de tipos de documento no es un array:", datos)
          setTiposDocumento([])
        }
      } else {
        console.error("Error al cargar tipos de documento:", respuesta.status)
        setTiposDocumento([])
      }
    } catch (error) {
      console.error("Error al cargar tipos de documento:", error)
      setTiposDocumento([])
    }
  }

  // Cargar productos
  const cargarProductos = async () => {
    setCargandoProductos(true)
    try {
      const respuesta = await fetch("/api/productos")
      if (respuesta.ok) {
        const datos = await respuesta.json()
        console.log("Datos de productos cargados:", datos)

        // Intentar extraer productos de diferentes estructuras de respuesta
        let productosExtraidos = []

        if (datos && Array.isArray(datos.productos)) {
          productosExtraidos = datos.productos
        } else if (Array.isArray(datos)) {
          productosExtraidos = datos
        } else if (datos && typeof datos === "object") {
          // Intentar extraer productos de otras propiedades
          const posiblesPropiedades = ["productos", "items", "data", "results"]
          for (const prop of posiblesPropiedades) {
            if (datos[prop] && Array.isArray(datos[prop])) {
              productosExtraidos = datos[prop]
              break
            }
          }
        }

        // Verificar si los productos tienen la estructura esperada
        if (productosExtraidos.length > 0) {
          console.log("Productos extraídos:", productosExtraidos)

          // Normalizar la estructura de los productos
          const productosNormalizados = productosExtraidos.map((p) => ({
            id: p.id || p.idProducto,
            idProducto: p.idProducto || p.id,
            nombre: p.nombre || p.nombreProducto || `Producto #${p.id || p.idProducto}`,
            precio: p.precioUnitario || p.precio || 0, // Usar precioUnitario si está disponible
            // Otras propiedades que puedan ser útiles
            ...p,
          }))

          setProductos(productosNormalizados)
        } else {
          console.error("No se pudieron extraer productos de la respuesta:", datos)
          setProductos([])
        }
      } else {
        console.error("Error al cargar productos:", respuesta.status)
        setProductos([])
      }
    } catch (error) {
      console.error("Error al cargar productos:", error)
      setProductos([])
    } finally {
      setCargandoProductos(false)
    }
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target
    console.log(`Campo cambiado: ${name}, Valor: ${value}`)

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Limpiar error del campo
    if (errores[name]) {
      setErrores((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
  }

  // Abrir diálogo de búsqueda manual
  const abrirDialogoBusqueda = () => {
    cargarTiposDocumento() // Cargar tipos de documento si no están cargados
    setDialogoBusquedaAbierto(true)
  }

  // Cerrar diálogo de búsqueda manual
  const cerrarDialogoBusqueda = () => {
    setDialogoBusquedaAbierto(false)
    setBusquedaManual({
      tipoDocumento: "",
      numeroDocumento: "",
      nombre: "",
      apellido: "",
    })
    setResultadosBusqueda([])
  }

  // Manejar cambios en los campos de búsqueda manual
  const handleBusquedaChange = (e) => {
    const { name, value } = e.target
    setBusquedaManual({
      ...busquedaManual,
      [name]: value,
    })
  }

  // Buscar clientes por número de documento
  const buscarClientesPorDocumento = async (numeroDocumento) => {
    if (!numeroDocumento || numeroDocumento.trim() === "") {
      return []
    }

    try {
      // Usar el endpoint de búsqueda con el número de documento
      const respuesta = await fetch(`/api/clientes/buscar?query=${numeroDocumento}`)

      if (!respuesta.ok) {
        throw new Error(`Error al buscar clientes: ${respuesta.status}`)
      }

      const datos = await respuesta.json()

      if (Array.isArray(datos) && datos.length > 0) {
        return datos
      }

      return []
    } catch (error) {
      console.error("Error al buscar clientes por documento:", error)
      return []
    }
  }

  // Buscar clientes manualmente
  const buscarClientesManual = async () => {
    // Validar que al menos un campo tenga valor
    if (!busquedaManual.numeroDocumento && !busquedaManual.nombre && !busquedaManual.apellido) {
      setSnackbar({
        abierto: true,
        mensaje: "Debe ingresar al menos un criterio de búsqueda",
        tipo: "error",
      })
      return
    }

    setBuscandoClientes(true)
    try {
      let resultados = []

      // Priorizar búsqueda por número de documento
      if (busquedaManual.numeroDocumento) {
        resultados = await buscarClientesPorDocumento(busquedaManual.numeroDocumento)
      }

      // Si no hay resultados y tenemos nombre o apellido, intentar con ellos
      if (resultados.length === 0 && (busquedaManual.nombre || busquedaManual.apellido)) {
        const termino = busquedaManual.nombre || busquedaManual.apellido
        const respuesta = await fetch(`/api/clientes/buscar?query=${termino}`)

        if (respuesta.ok) {
          const datos = await respuesta.json()
          if (Array.isArray(datos) && datos.length > 0) {
            resultados = datos
          }
        }
      }

      setResultadosBusqueda(resultados)

      if (resultados.length === 0) {
        setSnackbar({
          abierto: true,
          mensaje: "No se encontraron clientes con los criterios de búsqueda",
          tipo: "info",
        })
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al buscar clientes: " + error.message,
        tipo: "error",
      })
    } finally {
      setBuscandoClientes(false)
    }
  }

  // Seleccionar cliente desde la búsqueda manual
  const seleccionarClienteManual = (cliente) => {
    setFormData({
      ...formData,
      idCliente: cliente.idCliente,
      cliente: cliente,
    })
    cerrarDialogoBusqueda()
    setSnackbar({
      abierto: true,
      mensaje: "Cliente seleccionado correctamente",
      tipo: "success",
    })
  }

  // Abrir diálogo de productos
  const abrirDialogoProducto = (producto = null, index = null) => {
    if (producto && index !== null) {
      // Editar producto existente
      console.log("Editando producto:", producto)

      // Buscar el producto completo en la lista de productos
      const productoCompleto = productos.find(
        (p) => p.id === producto.idProducto || p.idProducto === producto.idProducto,
      )

      console.log("Producto encontrado en la lista:", productoCompleto)

      // Si no se encuentra el producto en la lista, usar el que viene del pedido
      setProductoSeleccionado(
        productoCompleto ||
          producto.producto || {
            id: producto.idProducto,
            idProducto: producto.idProducto,
            nombre: producto.producto?.nombreProducto || `Producto #${producto.idProducto}`,
            precio: producto.precioUnitario,
          },
      )

      setCantidad(producto.cantidad)
      setEditandoProducto(index)
    } else {
      // Nuevo producto
      setProductoSeleccionado(null)
      setCantidad(1)
      setEditandoProducto(null)
    }

    setDialogoProductoAbierto(true)
  }

  // Cerrar diálogo de productos
  const cerrarDialogoProducto = () => {
    setDialogoProductoAbierto(false)
    setProductoSeleccionado(null)
    setCantidad(1)
    setEditandoProducto(null)
  }

  // Manejar selección de producto
  const handleProductoChange = (e) => {
    const idProducto = e.target.value
    const producto = productos.find((p) => p.id === idProducto || p.idProducto === idProducto)
    console.log("Producto seleccionado:", producto)
    setProductoSeleccionado(producto)
  }

  // Manejar cambio de cantidad
  const handleCantidadChange = (e) => {
    const valor = Number.parseInt(e.target.value)
    setCantidad(isNaN(valor) || valor < 1 ? 1 : valor)
  }

  // Agregar o actualizar producto
  const agregarProducto = () => {
    if (!productoSeleccionado) return

    const idProducto = productoSeleccionado.id || productoSeleccionado.idProducto
    const precioUnitario = productoSeleccionado.precio || 0
    const subtotal = precioUnitario * cantidad

    const nuevoProducto = {
      idProducto,
      producto: productoSeleccionado,
      cantidad,
      precioUnitario,
      subtotal,
    }

    if (editandoProducto !== null) {
      // Actualizar producto existente
      const nuevosProductos = [...formData.productos]
      nuevosProductos[editandoProducto] = nuevoProducto
      setFormData((prev) => ({
        ...prev,
        productos: nuevosProductos,
      }))
    } else {
      // Agregar nuevo producto
      setFormData((prev) => ({
        ...prev,
        productos: [...prev.productos, nuevoProducto],
      }))
    }

    cerrarDialogoProducto()
  }

  // Eliminar producto
  const eliminarProducto = (index) => {
    const nuevosProductos = [...formData.productos]
    nuevosProductos.splice(index, 1)
    setFormData((prev) => ({
      ...prev,
      productos: nuevosProductos,
    }))
  }

  // Calcular total del pedido
  const calcularTotal = () => {
    return formData.productos.reduce((total, producto) => total + producto.subtotal, 0)
  }

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formData.idCliente) {
      nuevosErrores.idCliente = "Debe seleccionar un cliente"
    }

    if (!formData.fechaEntrega) {
      nuevosErrores.fechaEntrega = "Debe seleccionar una fecha de entrega"
    }

    if (formData.productos.length === 0) {
      nuevosErrores.productos = "Debe agregar al menos un producto"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Guardar pedido
  const guardarPedido = async () => {
    if (!validarFormulario()) {
      setSnackbar({
        abierto: true,
        mensaje: "Por favor, corrija los errores en el formulario",
        tipo: "error",
      })
      return
    }

    setGuardando(true)
    setError(null)
    setExito(false)

    try {
      // Preparar datos para enviar
      const pedidoData = {
        pedido: {
          idPedido: Number(pedidoId),
          idCliente: Number(formData.idCliente),
          fechaPedido: formData.fechaPedido, // Mantener fecha original
          fechaEntrega: formData.fechaEntrega, // Fecha de entrega editable
          observacion: formData.observacion,
          idEstadoPedido: Number(formData.idEstadoPedido), // Mantener estado original
          montoTotal: calcularTotal(),
        },
        detalles: formData.productos.map((producto) => ({
          idProducto: Number(producto.idProducto),
          cantidad: Number(producto.cantidad),
          precioUnitario: Number(producto.precioUnitario),
        })),
      }

      console.log("Datos a enviar:", pedidoData)

      const respuesta = await fetch(`/api/pedidos/${pedidoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pedidoData),
      })

      if (!respuesta.ok) {
        const errorData = await respuesta.json()
        throw new Error(errorData.error || `Error al guardar el pedido: ${respuesta.status}`)
      }

      const resultado = await respuesta.json()
      console.log("Pedido actualizado:", resultado)

      setExito(true)
      setSnackbar({
        abierto: true,
        mensaje: `Pedido #${pedidoId} actualizado exitosamente`,
        tipo: "success",
      })

      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push("/pedidos")
      }, 2000)
    } catch (error) {
      console.error("Error al guardar el pedido:", error)
      setError(`Error al guardar el pedido: ${error.message}`)
      setSnackbar({
        abierto: true,
        mensaje: error.message || "Error al guardar el pedido",
        tipo: "error",
      })
    } finally {
      setGuardando(false)
    }
  }

  // Manejar cancelación
  const handleCancelar = () => {
    router.push("/pedidos")
  }

  // Formatear nombre del cliente
  const formatearNombreCliente = (cliente) => {
    if (!cliente) return ""

    if (cliente.persona) {
      const { nombre, apellido, nroDocumento } = cliente.persona
      return `${nombre || ""} ${apellido || ""} (${nroDocumento || ""})`
    }

    return cliente.nombre || cliente.razonSocial || `Cliente #${cliente.idCliente || cliente.id}`
  }

  // Formatear nombre del producto
  const formatearNombreProducto = (producto) => {
    if (!producto) return ""
    return producto.nombre || producto.nombreProducto || `Producto #${producto.id || producto.idProducto}`
  }

  // Cerrar snackbar
  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancelar} sx={{ mr: 2 }}>
          Volver
        </Button>
        <Typography variant="h4" component="h1">
          Editar Pedido #{pedidoId}
        </Typography>
      </Box>

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Box component="form" noValidate>
          {exito && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Pedido actualizado correctamente. Redirigiendo...
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <ShoppingCartIcon sx={{ mr: 1 }} /> Datos del Pedido
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                  {/* Campo de solo lectura para mostrar el cliente seleccionado */}
                  <TextField
                    label="Cliente"
                    value={formatearNombreCliente(formData.cliente)}
                    onClick={abrirDialogoBusqueda}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                      style: { cursor: "pointer" },
                    }}
                    fullWidth
                    margin="normal"
                    error={!!errores.idCliente}
                    helperText={errores.idCliente || "Haga clic aquí para buscar un cliente"}
                    required
                    sx={{ cursor: "pointer" }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={abrirDialogoBusqueda}
                    sx={{ ml: 2, height: 56, mt: 1 }}
                    title="Buscar cliente por documento"
                  >
                    <SearchIcon />
                  </Button>
                </Box>
              </Grid>

              {/* Estado del pedido (solo visualización) */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>
                    Estado del pedido:
                  </Typography>
                  <Chip label={formData.estadoPedido} color={getEstadoColor(formData.estadoPedido)} size="medium" />
                </Box>
              </Grid>

              {/* Fecha de pedido (solo visualización) */}
              <Grid item xs={12} md={6}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: "text.secondary" }} />
                  <Typography variant="body1">
                    <strong>Fecha de Pedido:</strong> {formatearFechaVisual(formData.fechaPedido)}
                  </Typography>
                </Box>
              </Grid>

              {/* Fecha de entrega (editable) */}
              <Grid item xs={12} md={6}>
                <TextField
                  name="fechaEntrega"
                  label="Fecha de Entrega"
                  type="date"
                  value={formData.fechaEntrega || ""}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!errores.fechaEntrega}
                  helperText={errores.fechaEntrega}
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

              {/* Observaciones */}
              <Grid item xs={12}>
                <TextField
                  name="observacion"
                  label="Observaciones"
                  value={formData.observacion || ""}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Ingrese cualquier observación o nota adicional sobre el pedido"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <InventoryIcon sx={{ mr: 1 }} /> Productos
            </Typography>

            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AddIcon />}
                  onClick={() => abrirDialogoProducto()}
                  sx={{ mb: 2 }}
                >
                  Agregar Producto
                </Button>
              </Grid>
            </Grid>

            {errores.productos && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {errores.productos}
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
                  {formData.productos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay productos agregados al pedido
                      </TableCell>
                    </TableRow>
                  ) : (
                    formData.productos.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatearNombreProducto(detalle.producto)}</TableCell>
                        <TableCell align="right">₲ {detalle.precioUnitario.toLocaleString("es-PY")}</TableCell>
                        <TableCell align="right">{detalle.cantidad}</TableCell>
                        <TableCell align="right">₲ {Math.round(detalle.subtotal).toLocaleString("es-PY")}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => abrirDialogoProducto(detalle, index)}
                            title="Editar"
                          >
                            <SearchIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => eliminarProducto(index)}
                            title="Eliminar"
                          >
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
            <Button variant="outlined" onClick={handleCancelar} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="contained"
              color="primary"
              startIcon={guardando ? <CircularProgress size={24} /> : <SaveIcon />}
              disabled={guardando}
              onClick={guardarPedido}
            >
              {guardando ? "Guardando..." : "Guardar Pedido"}
            </Button>
          </Box>
        </Box>
      )}

      {/* Diálogo de búsqueda manual de clientes */}
      <Dialog open={dialogoBusquedaAbierto} onClose={cerrarDialogoBusqueda} maxWidth="md" fullWidth>
        <DialogTitle>Búsqueda de Cliente por Documento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="numeroDocumento"
                label="Número de Documento"
                value={busquedaManual.numeroDocumento}
                onChange={handleBusquedaChange}
                fullWidth
                margin="normal"
                autoFocus
                placeholder="Ingrese el número de documento del cliente"
                helperText="Ingrese el número de documento para buscar el cliente"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: "flex", alignItems: "flex-end", height: "100%" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={buscarClientesManual}
                  disabled={buscandoClientes || !busquedaManual.numeroDocumento}
                  startIcon={buscandoClientes ? <CircularProgress size={20} /> : <SearchIcon />}
                  fullWidth
                  sx={{ mt: 3 }}
                >
                  {buscandoClientes ? "Buscando..." : "Buscar por Documento"}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1">Búsqueda Alternativa</Typography>
              <Typography variant="caption" color="text.secondary">
                Si no conoce el número de documento, puede buscar por nombre o apellido
              </Typography>
            </Grid>

            <Grid item xs={12} md={5}>
              <TextField
                name="nombre"
                label="Nombre"
                value={busquedaManual.nombre}
                onChange={handleBusquedaChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField
                name="apellido"
                label="Apellido"
                value={busquedaManual.apellido}
                onChange={handleBusquedaChange}
                fullWidth
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                color="primary"
                onClick={buscarClientesManual}
                disabled={buscandoClientes || (!busquedaManual.nombre && !busquedaManual.apellido)}
                startIcon={buscandoClientes ? <CircularProgress size={20} /> : <SearchIcon />}
                fullWidth
                sx={{ mt: 3 }}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>

          {/* Aseguramos que resultadosBusqueda sea un array antes de acceder a su propiedad length */}
          {Array.isArray(resultadosBusqueda) && resultadosBusqueda.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Resultados de la búsqueda
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {resultadosBusqueda.map((cliente) => (
                      <TableRow key={cliente.idCliente || Math.random()}>
                        <TableCell>
                          {cliente.persona
                            ? `${cliente.persona.nombre || ""} ${cliente.persona.apellido || ""}`
                            : `${cliente.nombre || ""} ${cliente.apellido || ""}`}
                        </TableCell>
                        <TableCell>
                          {cliente.persona
                            ? `${
                                cliente.persona.tipoDocumento ? cliente.persona.tipoDocumento.descTipoDocumento : ""
                              }: ${cliente.persona.nroDocumento || ""}`
                            : cliente.nroDocumento || ""}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => seleccionarClienteManual(cliente)}
                          >
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoBusqueda} color="primary">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de productos */}
      <Dialog open={dialogoProductoAbierto} onClose={cerrarDialogoProducto} maxWidth="sm" fullWidth>
        <DialogTitle>{editandoProducto !== null ? "Editar Producto" : "Agregar Producto"}</DialogTitle>
        <DialogContent>
          {cargandoProductos ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ mt: 1 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Producto</InputLabel>
                <Select
                  value={productoSeleccionado ? productoSeleccionado.id || productoSeleccionado.idProducto || "" : ""}
                  onChange={handleProductoChange}
                  label="Producto"
                >
                  {Array.isArray(productos) && productos.length > 0 ? (
                    productos.map((producto) => (
                      <MenuItem key={producto.id || producto.idProducto} value={producto.id || producto.idProducto}>
                        {formatearNombreProducto(producto)}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No hay productos disponibles
                    </MenuItem>
                  )}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={cantidad}
                onChange={handleCantidadChange}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ mb: 2 }}
              />

              {productoSeleccionado && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Precio Unitario: ₲ {(productoSeleccionado.precio || 0).toLocaleString("es")}
                  </Typography>
                  <Typography variant="subtitle2">
                    Subtotal: ₲ {((productoSeleccionado.precio || 0) * cantidad).toLocaleString("es")}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogoProducto}>Cancelar</Button>
          <Button variant="contained" onClick={agregarProducto} disabled={!productoSeleccionado || cargandoProductos}>
            {editandoProducto !== null ? "Actualizar" : "Agregar"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Box>
  )
}
