"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Tooltip,
  Snackbar,
} from "@mui/material"
import { ArrowBack, Add, Delete, Search, PersonAdd } from "@mui/icons-material"
import Link from "next/link"

export default function NuevaCotizacionPage() {
  const router = useRouter()

  // Estados para el formulario principal
  const [formData, setFormData] = useState({
    idCliente: "",
    validez: 30, // Valor por defecto: 30 días
  })

  // Estados para la búsqueda y selección de cliente
  const [clienteBusqueda, setClienteBusqueda] = useState("")
  const [clientesEncontrados, setClientesEncontrados] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [buscandoCliente, setBuscandoCliente] = useState(false)

  // Estados para la búsqueda y selección de productos
  const [productoBusqueda, setProductoBusqueda] = useState("")
  const [productosEncontrados, setProductosEncontrados] = useState([])
  const [buscandoProducto, setBuscandoProducto] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [cantidadProducto, setCantidadProducto] = useState(1)

  // Estado para la lista de productos en la cotización
  const [productosEnCotizacion, setProductosEnCotizacion] = useState([])

  // Estados para diálogos
  const [openNuevoClienteDialog, setOpenNuevoClienteDialog] = useState(false)

  // Estados para carga y errores
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Estado para el token de autenticación
  const [authToken, setAuthToken] = useState(null)

  // Estado para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  // Obtener el token de autenticación al cargar el componente
  useEffect(() => {
    // Intentar obtener el token de diferentes fuentes
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

    if (token) {
      setAuthToken(token)
    }
  }, [])

  // Calcular el total de la cotización
  const montoTotal = productosEnCotizacion.reduce((total, item) => total + item.subtotal, 0)

  // Buscar cliente por nombre o documento
  const buscarCliente = async () => {
    if (!clienteBusqueda.trim()) {
      setError("Ingrese un nombre, documento o empresa para buscar")
      return
    }

    try {
      setBuscandoCliente(true)
      setError(null)

      const response = await fetch(`/api/clientes/buscar?query=${encodeURIComponent(clienteBusqueda.trim())}`)

      if (!response.ok) {
        throw new Error("Error al buscar clientes")
      }

      const data = await response.json()
      setClientesEncontrados(data)

      if (data.length === 0) {
        setError("No se encontraron clientes con ese criterio")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setBuscandoCliente(false)
    }
  }

  // Manejar tecla Enter en el campo de búsqueda de clientes
  const handleClienteKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarCliente()
    }
  }

  // Seleccionar un cliente
  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente)
    setFormData({
      ...formData,
      idCliente: cliente.idCliente,
    })
    setClientesEncontrados([])
  }

  // Buscar producto por nombre o descripción
  const buscarProducto = async () => {
    if (!productoBusqueda.trim()) {
      setError("Ingrese un nombre o descripción de producto para buscar")
      return
    }

    try {
      setBuscandoProducto(true)
      setError(null)

      const response = await fetch(`/api/productos/buscar?query=${encodeURIComponent(productoBusqueda.trim())}`)

      if (!response.ok) {
        throw new Error("Error al buscar productos")
      }

      const data = await response.json()
      setProductosEncontrados(data)

      if (data.length === 0) {
        setError("No se encontraron productos con ese criterio")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setBuscandoProducto(false)
    }
  }

  // Manejar tecla Enter en el campo de búsqueda de productos
  const handleProductoKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarProducto()
    }
  }

  // Seleccionar un producto
  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto)
    setProductosEncontrados([])
  }

  // Agregar producto a la cotización
  const agregarProducto = () => {
    if (!productoSeleccionado) {
      setError("Debe seleccionar un producto")
      return
    }

    if (cantidadProducto <= 0) {
      setError("La cantidad debe ser mayor a 0")
      return
    }

    // Verificar si el producto ya está en la cotización
    const productoExistente = productosEnCotizacion.find((item) => item.idProducto === productoSeleccionado.idProducto)

    if (productoExistente) {
      // Actualizar cantidad y subtotal
      const productosActualizados = productosEnCotizacion.map((item) => {
        if (item.idProducto === productoSeleccionado.idProducto) {
          const nuevaCantidad = item.cantidad + cantidadProducto
          return {
            ...item,
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * productoSeleccionado.precioUnitario,
          }
        }
        return item
      })

      setProductosEnCotizacion(productosActualizados)
    } else {
      // Agregar nuevo producto
      const nuevoProducto = {
        idProducto: productoSeleccionado.idProducto,
        nombreProducto: productoSeleccionado.nombreProducto,
        descripcion: productoSeleccionado.descripcion,
        pesoUnidad: productoSeleccionado.pesoUnidad,
        precioUnitario: productoSeleccionado.precioUnitario,
        unidadMedida: productoSeleccionado.unidadMedida,
        tipoProducto: productoSeleccionado.tipoProducto,
        cantidad: cantidadProducto,
        subtotal: cantidadProducto * productoSeleccionado.precioUnitario,
      }

      setProductosEnCotizacion([...productosEnCotizacion, nuevoProducto])
    }

    // Limpiar selección
    setProductoSeleccionado(null)
    setProductoBusqueda("")
    setCantidadProducto(1)
  }

  // Eliminar producto de la cotización
  const eliminarProducto = (idProducto) => {
    setProductosEnCotizacion(productosEnCotizacion.filter((item) => item.idProducto !== idProducto))
  }

  // Manejar cambios en el formulario principal
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Guardar la cotización
  const guardarCotizacion = async () => {
    // Validar que haya un cliente seleccionado
    if (!clienteSeleccionado) {
      setError("Debe seleccionar un cliente")
      return
    }

    // Validar que haya productos en la cotización
    if (productosEnCotizacion.length === 0) {
      setError("Debe agregar al menos un producto a la cotización")
      return
    }

    // Validar que la validez sea un número positivo
    if (formData.validez <= 0) {
      setError("La validez debe ser un número positivo de días")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar si tenemos un token de autenticación
      if (!authToken) {
        throw new Error("No se encontró el token de autenticación. Por favor, inicie sesión nuevamente.")
      }

      const cotizacionData = {
        idCliente: formData.idCliente,
        validez: Number.parseInt(formData.validez),
        montoTotal,
        productos: productosEnCotizacion.map((item) => ({
          idProducto: item.idProducto,
          cantidad: item.cantidad,
          subtotal: item.subtotal,
        })),
      }

      // Crear una solicitud con el token en el encabezado
      const response = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`,
        },
        body: JSON.stringify(cotizacionData),
      })

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = "Error al guardar la cotización"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si no podemos analizar la respuesta como JSON, usamos el mensaje genérico
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Mostrar mensaje de éxito con Snackbar
      setSnackbarMessage("¡Cotización creada exitosamente!")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // Redireccionar después de un breve retraso para que el usuario vea la notificación
      setTimeout(() => {
        router.push("/cotizaciones")
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)

      // Si el error es de autenticación, podríamos redirigir al login
      if (error.message.includes("No autorizado") || error.message.includes("token")) {
        // Mostrar un mensaje más claro
        setError("Su sesión ha expirado o no tiene autorización. Por favor, inicie sesión nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  // Manejar cierre del Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/cotizaciones" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Cotizaciones
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Nueva Cotización
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!authToken && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No se ha detectado una sesión activa. Es posible que necesite iniciar sesión nuevamente para crear
          cotizaciones.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Información del Cliente
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {clienteSeleccionado ? (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Cliente:</strong> {clienteSeleccionado.persona.nombre} {clienteSeleccionado.persona.apellido}
                </Typography>
                <Typography variant="body2">
                  <strong>Documento:</strong> {clienteSeleccionado.persona.tipoDocumento?.descTipoDocumento}:{" "}
                  {clienteSeleccionado.persona.nroDocumento}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Sector:</strong> {clienteSeleccionado.sectorCliente?.descSectorCliente}
                </Typography>
                {clienteSeleccionado.empresa && (
                  <Typography variant="body2">
                    <strong>Empresa:</strong> {clienteSeleccionado.empresa.razonSocial}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setClienteSeleccionado(null)
                    setFormData({ ...formData, idCliente: "" })
                  }}
                >
                  Cambiar Cliente
                </Button>
              </Grid>
            </Grid>
          </Box>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Buscar cliente (nombre, documento o empresa)"
                  value={clienteBusqueda}
                  onChange={(e) => setClienteBusqueda(e.target.value)}
                  onKeyPress={handleClienteKeyPress}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={buscarCliente} disabled={buscandoCliente}>
                          <Search />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={buscarCliente}
                  disabled={buscandoCliente}
                  startIcon={<Search />}
                >
                  {buscandoCliente ? <CircularProgress size={24} /> : "Buscar Cliente"}
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => setOpenNuevoClienteDialog(true)}>
                  Nuevo Cliente
                </Button>
              </Grid>
            </Grid>

            {clientesEncontrados.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Documento</TableCell>
                      <TableCell>Sector</TableCell>
                      <TableCell>Empresa</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clientesEncontrados.map((cliente) => (
                      <TableRow key={cliente.idCliente}>
                        <TableCell>
                          {cliente.persona.nombre} {cliente.persona.apellido}
                        </TableCell>
                        <TableCell>
                          {cliente.persona.tipoDocumento?.descTipoDocumento}: {cliente.persona.nroDocumento}
                        </TableCell>
                        <TableCell>{cliente.sectorCliente?.descSectorCliente}</TableCell>
                        <TableCell>{cliente.empresa?.razonSocial || "N/A"}</TableCell>
                        <TableCell>
                          <Button variant="contained" size="small" onClick={() => seleccionarCliente(cliente)}>
                            Seleccionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Productos
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar producto (nombre o descripción)"
                value={productoBusqueda}
                onChange={(e) => setProductoBusqueda(e.target.value)}
                onKeyPress={handleProductoKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={buscarProducto} disabled={buscandoProducto}>
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                color="primary"
                onClick={buscarProducto}
                disabled={buscandoProducto}
                startIcon={<Search />}
                fullWidth
              >
                {buscandoProducto ? <CircularProgress size={24} /> : "Buscar"}
              </Button>
            </Grid>
            {productoSeleccionado && (
              <>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={cantidadProducto}
                    onChange={(e) => setCantidadProducto(Number.parseInt(e.target.value) || 0)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Button variant="contained" color="secondary" onClick={agregarProducto} startIcon={<Add />} fullWidth>
                    Agregar a Cotización
                  </Button>
                </Grid>
              </>
            )}
          </Grid>

          {productosEncontrados.length > 0 && !productoSeleccionado && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Peso Unidad</TableCell>
                    <TableCell>Precio Unitario</TableCell>
                    <TableCell>Unidad de Medida</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosEncontrados.map((producto) => (
                    <TableRow key={producto.idProducto}>
                      <TableCell>{producto.nombreProducto}</TableCell>
                      <TableCell>
                        <Tooltip title={producto.descripcion}>
                          <span>
                            {producto.descripcion.length > 30
                              ? `${producto.descripcion.substring(0, 30)}...`
                              : producto.descripcion}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{producto.pesoUnidad} kg</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                          producto.precioUnitario,
                        )}
                      </TableCell>
                      <TableCell>
                        {producto.unidadMedida?.descUnidadMedida} ({producto.unidadMedida?.abreviatura})
                      </TableCell>
                      <TableCell>
                        <Button variant="contained" size="small" onClick={() => seleccionarProducto(producto)}>
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {productoSeleccionado && (
            <Box sx={{ mt: 2, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
              <Typography variant="subtitle1">
                <strong>Producto seleccionado:</strong> {productoSeleccionado.nombreProducto}
              </Typography>
              <Typography variant="body2">
                <strong>Descripción:</strong>{" "}
                <Tooltip title={productoSeleccionado.descripcion}>
                  <span>
                    {productoSeleccionado.descripcion.length > 50
                      ? `${productoSeleccionado.descripcion.substring(0, 50)}...`
                      : productoSeleccionado.descripcion}
                  </span>
                </Tooltip>
              </Typography>
              <Typography variant="body2">
                <strong>Peso por unidad:</strong> {productoSeleccionado.pesoUnidad} kg
              </Typography>
              <Typography variant="body2">
                <strong>Precio:</strong>{" "}
                {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                  productoSeleccionado.precioUnitario,
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Unidad de medida:</strong> {productoSeleccionado.unidadMedida?.descUnidadMedida} (
                {productoSeleccionado.unidadMedida?.abreviatura})
              </Typography>
              <Typography variant="body2">
                <strong>Subtotal:</strong>{" "}
                {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                  productoSeleccionado.precioUnitario * cantidadProducto,
                )}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Productos en la Cotización
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {productosEnCotizacion.length > 0 ? (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Peso Unidad</TableCell>
                    <TableCell align="right">Precio Unitario</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosEnCotizacion.map((item) => (
                    <TableRow key={item.idProducto}>
                      <TableCell>
                        <Tooltip title={item.descripcion}>
                          <span>{item.nombreProducto}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{item.pesoUnidad} kg</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                          item.precioUnitario,
                        )}
                      </TableCell>
                      <TableCell align="right">{item.cantidad}</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(item.subtotal)}
                      </TableCell>
                      <TableCell>
                        <IconButton color="error" onClick={() => eliminarProducto(item.idProducto)} size="small">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="subtitle1">
                        <strong>TOTAL:</strong>
                      </Typography>
                    </TableCell>
                    <TableCell align="right"></TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1">
                        <strong>
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(montoTotal)}
                        </strong>
                      </Typography>
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Validez (días)"
                  name="validez"
                  type="number"
                  value={formData.validez}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                  required
                  sx={{
                    "& .MuiInputLabel-root": {
                      background: "white",
                      padding: "0 5px",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monto Total"
                  value={new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(montoTotal)}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    "& .MuiInputLabel-root": {
                      background: "white",
                      padding: "0 5px",
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={guardarCotizacion}
                disabled={loading || !clienteSeleccionado || productosEnCotizacion.length === 0 || !authToken}
                sx={{ minWidth: 150 }}
              >
                {loading ? <CircularProgress size={24} /> : "Guardar Cotización"}
              </Button>
            </Box>
          </>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No hay productos agregados a la cotización
          </Alert>
        )}
      </Paper>

      {/* Diálogo para crear nuevo cliente */}
      <Dialog open={openNuevoClienteDialog} onClose={() => setOpenNuevoClienteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Nuevo Cliente</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para registrar un nuevo cliente, será redirigido al formulario de registro de clientes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNuevoClienteDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setOpenNuevoClienteDialog(false)
              router.push("/clientes/nuevo?redirect=/cotizaciones/nueva")
            }}
          >
            Ir a Registro de Clientes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} variant="filled" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  )
}
