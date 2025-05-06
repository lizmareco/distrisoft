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
import { ArrowBack, Search, Business, Add, Delete } from "@mui/icons-material"
import Link from "next/link"

export default function NuevaCotizacionProveedorPage() {
  const router = useRouter()

  // Estados para el formulario principal
  const [formData, setFormData] = useState({
    idProveedor: "",
    validez: 30, // Valor por defecto: 30 días
  })

  // Estados para la búsqueda y selección de proveedor
  const [proveedorBusqueda, setProveedorBusqueda] = useState("")
  const [proveedoresEncontrados, setProveedoresEncontrados] = useState([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)
  const [buscandoProveedor, setBuscandoProveedor] = useState(false)

  // Estados para la búsqueda y selección de materias primas
  const [materiaPrimaBusqueda, setMateriaPrimaBusqueda] = useState("")
  const [materiasPrimasEncontradas, setMateriasPrimasEncontradas] = useState([])
  const [buscandoMateriaPrima, setBuscandoMateriaPrima] = useState(false)
  const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] = useState(null)
  const [cantidadMateriaPrima, setCantidadMateriaPrima] = useState(1)
  const [precioUnitario, setPrecioUnitario] = useState(0)

  // NUEVO: Lista de materias primas agregadas a la cotización
  const [materiasPrimasEnCotizacion, setMateriasPrimasEnCotizacion] = useState([])

  // Estados para diálogos
  const [openNuevoProveedorDialog, setOpenNuevoProveedorDialog] = useState(false)

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

  // Calcular el subtotal de la materia prima actual
  const subtotal = cantidadMateriaPrima * precioUnitario

  // Calcular el monto total de todas las materias primas
  const montoTotal = materiasPrimasEnCotizacion.reduce((total, item) => total + item.subtotal, 0)

  // Buscar proveedor por nombre o razón social
  const buscarProveedor = async () => {
    if (!proveedorBusqueda.trim()) {
      setError("Ingrese un nombre, documento o razón social para buscar")
      return
    }

    try {
      setBuscandoProveedor(true)
      setError(null)

      console.log(`Buscando proveedor con término: "${proveedorBusqueda.trim()}"`)
      const response = await fetch(`/api/proveedores/buscar?query=${encodeURIComponent(proveedorBusqueda.trim())}`)

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`Resultados de búsqueda:`, data)
      setProveedoresEncontrados(data || []) // Asegurar que siempre sea un array

      if (!data || data.length === 0) {
        setError("No se encontraron proveedores con ese criterio. Intente con otro término de búsqueda.")
      }
    } catch (error) {
      console.error("Error al buscar proveedores:", error)
      setError(`Error al buscar proveedores: ${error.message}`)
      setProveedoresEncontrados([]) // Establecer un array vacío en caso de error
    } finally {
      setBuscandoProveedor(false)
    }
  }

  // Manejar tecla Enter en el campo de búsqueda de proveedores
  const handleProveedorKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarProveedor()
    }
  }

  // Seleccionar un proveedor
  const seleccionarProveedor = (proveedor) => {
    setProveedorSeleccionado(proveedor)
    setFormData({
      ...formData,
      idProveedor: proveedor.idProveedor,
    })
    setProveedoresEncontrados([])
  }

  // Buscar materia prima por nombre o descripción
  const buscarMateriaPrima = async () => {
    if (!materiaPrimaBusqueda.trim()) {
      setError("Ingrese un nombre o descripción de materia prima para buscar")
      return
    }

    try {
      setBuscandoMateriaPrima(true)
      setError(null)

      const response = await fetch(`/api/materiaprima/buscar?query=${encodeURIComponent(materiaPrimaBusqueda.trim())}`)

      if (!response.ok) {
        throw new Error("Error al buscar materias primas")
      }

      const data = await response.json()
      console.log("Materias primas encontradas:", data)
      setMateriasPrimasEncontradas(data || []) // Asegurar que siempre sea un array

      if (!data || data.length === 0) {
        setError("No se encontraron materias primas con ese criterio")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      setMateriasPrimasEncontradas([]) // Establecer un array vacío en caso de error
    } finally {
      setBuscandoMateriaPrima(false)
    }
  }

  // Manejar tecla Enter en el campo de búsqueda de materias primas
  const handleMateriaPrimaKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarMateriaPrima()
    }
  }

  // Seleccionar una materia prima
  const seleccionarMateriaPrima = (materiaPrima) => {
    setMateriaPrimaSeleccionada(materiaPrima)
    setMateriasPrimasEncontradas([])
  }

  // NUEVO: Agregar materia prima a la cotización
  const agregarMateriaPrima = () => {
    if (!materiaPrimaSeleccionada) {
      setError("Debe seleccionar una materia prima")
      return
    }

    if (cantidadMateriaPrima <= 0) {
      setError("La cantidad debe ser mayor a 0")
      return
    }

    if (precioUnitario <= 0) {
      setError("El precio unitario debe ser mayor a 0")
      return
    }

    // Verificar si la materia prima ya está en la cotización
    const materiaPrimaExistente = materiasPrimasEnCotizacion.find(
      (item) => item.idMateriaPrima === materiaPrimaSeleccionada.idMateriaPrima,
    )

    if (materiaPrimaExistente) {
      setError("Esta materia prima ya ha sido agregada a la cotización")
      return
    }

    // Agregar la materia prima a la lista
    const nuevaMateriaPrima = {
      idMateriaPrima: materiaPrimaSeleccionada.idMateriaPrima,
      nombreMateriaPrima: materiaPrimaSeleccionada.nombreMateriaPrima,
      descMateriaPrima: materiaPrimaSeleccionada.descMateriaPrima || "",
      estadoMateriaPrima: materiaPrimaSeleccionada.estadoMateriaPrima,
      cantidad: cantidadMateriaPrima,
      precioUnitario: precioUnitario,
      subtotal: cantidadMateriaPrima * precioUnitario,
    }

    setMateriasPrimasEnCotizacion([...materiasPrimasEnCotizacion, nuevaMateriaPrima])

    // Limpiar selección actual
    setMateriaPrimaSeleccionada(null)
    setMateriaPrimaBusqueda("")
    setCantidadMateriaPrima(1)
    setPrecioUnitario(0)

    // Mostrar mensaje de éxito
    setSnackbarMessage("Materia prima agregada a la cotización")
    setSnackbarSeverity("success")
    setOpenSnackbar(true)
  }

  // NUEVO: Eliminar materia prima de la cotización
  const eliminarMateriaPrima = (idMateriaPrima) => {
    setMateriasPrimasEnCotizacion(materiasPrimasEnCotizacion.filter((item) => item.idMateriaPrima !== idMateriaPrima))
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
    // Validar que haya un proveedor seleccionado
    if (!proveedorSeleccionado) {
      setError("Debe seleccionar un proveedor")
      return
    }

    // Validar que haya al menos una materia prima en la cotización
    if (materiasPrimasEnCotizacion.length === 0) {
      setError("Debe agregar al menos una materia prima a la cotización")
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

      // MODIFICADO: Estructura de datos para enviar múltiples materias primas
      const cotizacionData = {
        idProveedor: formData.idProveedor,
        validez: Number.parseInt(formData.validez),
        montoTotal: montoTotal,
        materiasPrimas: materiasPrimasEnCotizacion.map((item) => ({
          idMateriaPrima: item.idMateriaPrima,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        })),
      }

      console.log("Enviando datos de cotización:", cotizacionData)

      // Crear una solicitud con el token en el encabezado
      const response = await fetch("/api/cotizaciones-proveedor", {
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
      setSnackbarMessage("¡Cotización de proveedor creada exitosamente!")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // Redireccionar después de un breve retraso para que el usuario vea la notificación
      setTimeout(() => {
        router.push("/cotizaciones-proveedor")
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
        <Button
          component={Link}
          href="/cotizaciones-proveedor"
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Volver a Cotizaciones de Proveedores
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Nueva Cotización de Proveedor
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
          Información del Proveedor
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {proveedorSeleccionado ? (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Proveedor:</strong> {proveedorSeleccionado.empresa?.razonSocial || "Sin razón social"}
                </Typography>
                <Typography variant="body2">
                  <strong>RUC:</strong> {proveedorSeleccionado.empresa?.ruc || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Contacto:</strong> {proveedorSeleccionado.empresa?.contacto || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Teléfono:</strong> {proveedorSeleccionado.empresa?.telefono || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setProveedorSeleccionado(null)
                    setFormData({ ...formData, idProveedor: "" })
                  }}
                >
                  Cambiar Proveedor
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
                  label="Buscar proveedor (razón social, RUC o contacto)"
                  value={proveedorBusqueda}
                  onChange={(e) => setProveedorBusqueda(e.target.value)}
                  onKeyPress={handleProveedorKeyPress}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={buscarProveedor} disabled={buscandoProveedor}>
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
                  onClick={buscarProveedor}
                  disabled={buscandoProveedor}
                  startIcon={<Search />}
                >
                  {buscandoProveedor ? <CircularProgress size={24} /> : "Buscar Proveedor"}
                </Button>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button variant="outlined" startIcon={<Business />} onClick={() => setOpenNuevoProveedorDialog(true)}>
                  Nuevo Proveedor
                </Button>
              </Grid>
            </Grid>

            {proveedoresEncontrados && proveedoresEncontrados.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Razón Social</TableCell>
                      <TableCell>RUC</TableCell>
                      <TableCell>Contacto</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proveedoresEncontrados.map((proveedor) => (
                      <TableRow key={proveedor.idProveedor}>
                        <TableCell>{proveedor.idProveedor}</TableCell>
                        <TableCell>{proveedor.empresa?.razonSocial || "N/A"}</TableCell>
                        <TableCell>{proveedor.empresa?.ruc || "N/A"}</TableCell>
                        <TableCell>{proveedor.empresa?.contacto || "N/A"}</TableCell>
                        <TableCell>
                          <Button variant="contained" size="small" onClick={() => seleccionarProveedor(proveedor)}>
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

      {/* MODIFICADO: Sección de búsqueda y selección de materias primas */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Agregar Materias Primas
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Buscar materia prima (nombre o descripción)"
                value={materiaPrimaBusqueda}
                onChange={(e) => setMateriaPrimaBusqueda(e.target.value)}
                onKeyPress={handleMateriaPrimaKeyPress}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={buscarMateriaPrima} disabled={buscandoMateriaPrima}>
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={!proveedorSeleccionado}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                onClick={buscarMateriaPrima}
                disabled={buscandoMateriaPrima || !proveedorSeleccionado}
                startIcon={<Search />}
              >
                {buscandoMateriaPrima ? <CircularProgress size={24} /> : "Buscar Materia Prima"}
              </Button>
            </Grid>
          </Grid>

          {materiasPrimasEncontradas && materiasPrimasEncontradas.length > 0 && !materiaPrimaSeleccionada && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materiasPrimasEncontradas.map((materiaPrima) => (
                    <TableRow key={materiaPrima.idMateriaPrima}>
                      <TableCell>{materiaPrima.nombreMateriaPrima}</TableCell>
                      <TableCell>
                        <Tooltip title={materiaPrima.descMateriaPrima}>
                          <span>
                            {materiaPrima.descMateriaPrima && materiaPrima.descMateriaPrima.length > 30
                              ? `${materiaPrima.descMateriaPrima.substring(0, 30)}...`
                              : materiaPrima.descMateriaPrima || "N/A"}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{materiaPrima.estadoMateriaPrima?.descEstadoMateriaPrima || "N/A"}</TableCell>
                      <TableCell>
                        <Button variant="contained" size="small" onClick={() => seleccionarMateriaPrima(materiaPrima)}>
                          Seleccionar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {materiaPrimaSeleccionada && (
            <Box sx={{ mt: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Materia Prima Seleccionada:</strong> {materiaPrimaSeleccionada.nombreMateriaPrima}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Descripción:</strong> {materiaPrimaSeleccionada.descMateriaPrima || "N/A"}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Estado:</strong> {materiaPrimaSeleccionada.estadoMateriaPrima?.descEstadoMateriaPrima || "N/A"}
              </Typography>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={cantidadMateriaPrima}
                    onChange={(e) => setCantidadMateriaPrima(Number(e.target.value))}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Precio Unitario"
                    type="number"
                    value={precioUnitario}
                    onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                    inputProps={{ min: 0, step: "0.01" }}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Subtotal"
                    type="number"
                    value={subtotal}
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="space-between">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => {
                      setMateriaPrimaSeleccionada(null)
                      setMateriaPrimaBusqueda("")
                      setCantidadMateriaPrima(1)
                      setPrecioUnitario(0)
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={agregarMateriaPrima}
                    disabled={cantidadMateriaPrima <= 0 || precioUnitario <= 0}
                  >
                    Agregar a Cotización
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        {/* NUEVO: Tabla de materias primas agregadas a la cotización */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Materias Primas en la Cotización
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {materiasPrimasEnCotizacion.length > 0 ? (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Materia Prima</TableCell>
                    <TableCell align="right">Precio Unitario</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materiasPrimasEnCotizacion.map((item) => (
                    <TableRow key={item.idMateriaPrima}>
                      <TableCell>
                        <Tooltip title={item.descMateriaPrima}>
                          <span>{item.nombreMateriaPrima}</span>
                        </Tooltip>
                      </TableCell>
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
                        <IconButton
                          color="error"
                          onClick={() => eliminarMateriaPrima(item.idMateriaPrima)}
                          size="small"
                        >
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
          </>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No hay materias primas agregadas a la cotización
          </Alert>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Información Adicional
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
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
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={guardarCotizacion}
          disabled={loading || !proveedorSeleccionado || materiasPrimasEnCotizacion.length === 0 || !authToken}
          sx={{ minWidth: 150 }}
        >
          {loading ? <CircularProgress size={24} /> : "Guardar Cotización"}
        </Button>
      </Box>

      {/* Diálogo para crear nuevo proveedor */}
      <Dialog
        open={openNuevoProveedorDialog}
        onClose={() => setOpenNuevoProveedorDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Registrar Nuevo Proveedor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Para registrar un nuevo proveedor, será redirigido al formulario de registro de proveedores.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNuevoProveedorDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setOpenNuevoProveedorDialog(false)
              router.push("/proveedores/nuevo?redirect=/cotizaciones-proveedor/nueva")
            }}
          >
            Ir a Registro de Proveedores
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
