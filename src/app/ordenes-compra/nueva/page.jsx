"use client"

import { useState } from "react"
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
  CircularProgress,
  Alert,
  Divider,
  Chip,
  InputAdornment,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from "@mui/material"
import { ArrowBack, Search, Refresh } from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function NuevaOrdenCompraPage() {
  const router = useRouter()
  const [cotizacionesAprobadas, setCotizacionesAprobadas] = useState([])
  const [mostrarCotizaciones, setMostrarCotizaciones] = useState(false)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null)
  const [observacion, setObservacion] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingCotizaciones, setLoadingCotizaciones] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Filtros
  const [filtroId, setFiltroId] = useState("")
  const [filtroProveedor, setFiltroProveedor] = useState("")

  // Cargar cotizaciones aprobadas sin orden de compra
  const fetchCotizacionesAprobadas = async () => {
    try {
      setLoadingCotizaciones(true)
      setError(null)
      setMostrarCotizaciones(true)

      // Paso 1: Obtener todas las cotizaciones con estado APROBADA
      console.log("Obteniendo cotizaciones con estado APROBADA...")
      const responseCotizaciones = await fetch("/api/cotizaciones-proveedor?estado=APROBADA")
      if (!responseCotizaciones.ok) {
        throw new Error("Error al cargar cotizaciones aprobadas")
      }
      const cotizaciones = await responseCotizaciones.json()
      console.log(`Se encontraron ${cotizaciones.length} cotizaciones con estado APROBADA`)

      // Paso 2: Obtener todas las órdenes de compra para verificar cuáles cotizaciones ya tienen órdenes
      console.log("Obteniendo órdenes de compra existentes...")
      const responseOrdenes = await fetch("/api/ordenes-compra")
      if (!responseOrdenes.ok) {
        throw new Error("Error al cargar órdenes de compra existentes")
      }
      const ordenes = await responseOrdenes.json()
      console.log(`Se encontraron ${ordenes.length} órdenes de compra existentes`)

      // Paso 3: Crear un conjunto con los IDs de cotizaciones que ya tienen órdenes
      const cotizacionesConOrdenes = new Set(ordenes.map((orden) => orden.idCotizacionProveedor))
      console.log(`${cotizacionesConOrdenes.size} cotizaciones ya tienen órdenes de compra asociadas`)

      // Paso 4: Filtrar las cotizaciones para obtener solo las que están aprobadas y no tienen órdenes
      const cotizacionesDisponibles = cotizaciones.filter(
        (cotizacion) =>
          cotizacion.estado === "APROBADA" && !cotizacionesConOrdenes.has(cotizacion.idCotizacionProveedor),
      )
      console.log(`Se encontraron ${cotizacionesDisponibles.length} cotizaciones APROBADAS sin órdenes de compra`)

      // Actualizar el estado
      setCotizacionesAprobadas(cotizacionesDisponibles)

      // Limpiar filtros al recargar
      setFiltroId("")
      setFiltroProveedor("")

      if (cotizacionesDisponibles.length === 0) {
        setError("No hay cotizaciones aprobadas disponibles para crear órdenes de compra")
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar cotizaciones aprobadas: " + error.message)
    } finally {
      setLoadingCotizaciones(false)
    }
  }

  // Buscar por ID de cotización
  const buscarPorId = async () => {
    if (!filtroId.trim()) {
      setError("Ingrese un ID de cotización para buscar")
      return
    }

    try {
      setLoadingCotizaciones(true)
      setError(null)
      setMostrarCotizaciones(true)

      // Paso 1: Obtener todas las cotizaciones con estado APROBADA
      const responseCotizaciones = await fetch("/api/cotizaciones-proveedor?estado=APROBADA")
      if (!responseCotizaciones.ok) {
        throw new Error("Error al cargar cotizaciones aprobadas")
      }
      const cotizaciones = await responseCotizaciones.json()

      // Paso 2: Obtener todas las órdenes de compra para verificar cuáles cotizaciones ya tienen órdenes
      const responseOrdenes = await fetch("/api/ordenes-compra")
      if (!responseOrdenes.ok) {
        throw new Error("Error al cargar órdenes de compra existentes")
      }
      const ordenes = await responseOrdenes.json()

      // Paso 3: Crear un conjunto con los IDs de cotizaciones que ya tienen órdenes
      const cotizacionesConOrdenes = new Set(ordenes.map((orden) => orden.idCotizacionProveedor))

      // Paso 4: Filtrar las cotizaciones para obtener solo las que están aprobadas, no tienen órdenes y coinciden con el ID
      const cotizacionesDisponibles = cotizaciones.filter(
        (cotizacion) =>
          cotizacion.estado === "APROBADA" &&
          !cotizacionesConOrdenes.has(cotizacion.idCotizacionProveedor) &&
          cotizacion.idCotizacionProveedor.toString().includes(filtroId.trim()),
      )

      setCotizacionesAprobadas(cotizacionesDisponibles)

      if (cotizacionesDisponibles.length === 0) {
        setError(`No se encontraron cotizaciones aprobadas sin orden de compra con ID: ${filtroId}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al buscar cotizaciones: " + error.message)
    } finally {
      setLoadingCotizaciones(false)
    }
  }

  // Buscar por proveedor
  const buscarPorProveedor = async () => {
    if (!filtroProveedor.trim()) {
      setError("Ingrese un nombre de proveedor para buscar")
      return
    }

    try {
      setLoadingCotizaciones(true)
      setError(null)
      setMostrarCotizaciones(true)

      // Paso 1: Obtener todas las cotizaciones con estado APROBADA
      const responseCotizaciones = await fetch("/api/cotizaciones-proveedor?estado=APROBADA")
      if (!responseCotizaciones.ok) {
        throw new Error("Error al cargar cotizaciones aprobadas")
      }
      const cotizaciones = await responseCotizaciones.json()

      // Paso 2: Obtener todas las órdenes de compra para verificar cuáles cotizaciones ya tienen órdenes
      const responseOrdenes = await fetch("/api/ordenes-compra")
      if (!responseOrdenes.ok) {
        throw new Error("Error al cargar órdenes de compra existentes")
      }
      const ordenes = await responseOrdenes.json()

      // Paso 3: Crear un conjunto con los IDs de cotizaciones que ya tienen órdenes
      const cotizacionesConOrdenes = new Set(ordenes.map((orden) => orden.idCotizacionProveedor))

      // Paso 4: Filtrar las cotizaciones para obtener solo las que están aprobadas, no tienen órdenes y coinciden con el proveedor
      const cotizacionesDisponibles = cotizaciones.filter(
        (cotizacion) =>
          cotizacion.estado === "APROBADA" &&
          !cotizacionesConOrdenes.has(cotizacion.idCotizacionProveedor) &&
          cotizacion.proveedor?.empresa?.razonSocial?.toLowerCase().includes(filtroProveedor.toLowerCase().trim()),
      )

      setCotizacionesAprobadas(cotizacionesDisponibles)

      if (cotizacionesDisponibles.length === 0) {
        setError(`No se encontraron cotizaciones aprobadas sin orden de compra del proveedor: ${filtroProveedor}`)
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error al buscar cotizaciones: " + error.message)
    } finally {
      setLoadingCotizaciones(false)
    }
  }

  // Seleccionar cotización
  const seleccionarCotizacion = async (cotizacion) => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Cargando detalles de la cotización #${cotizacion.idCotizacionProveedor}...`)
      const response = await fetch(`/api/cotizaciones-proveedor/${cotizacion.idCotizacionProveedor}`)
      if (!response.ok) {
        throw new Error("Error al cargar detalles de la cotización")
      }
      const data = await response.json()
      console.log("Detalles de cotización cargados:", data)
      setCotizacionSeleccionada(data)
      setMostrarCotizaciones(false) // Ocultar la lista después de seleccionar
    } catch (error) {
      console.error("Error:", error)
      setError("Error al cargar detalles de la cotización: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Crear orden de compra
  const handleCrearOrdenCompra = async () => {
    if (!cotizacionSeleccionada) {
      setError("Debe seleccionar una cotización")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obtener el token de autenticación
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

      console.log(`Creando orden de compra para cotización #${cotizacionSeleccionada.idCotizacionProveedor}...`)
      const response = await fetch("/api/ordenes-compra", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          idCotizacionProveedor: cotizacionSeleccionada.idCotizacionProveedor,
          observacion: observacion.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al crear la orden de compra")
      }

      const data = await response.json()
      console.log("Orden de compra creada exitosamente:", data)
      setSuccess(true)

      // Redirigir a la página de la orden de compra creada
      setTimeout(() => {
        router.push(`/ordenes-compra/${data.idOrdenCompra}`)
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Obtener los detalles de materias primas
  const getDetallesMateriaPrima = () => {
    if (!cotizacionSeleccionada) return []

    // Verificar si existe detallesCotizacionProv (plural, nombre correcto según el modelo)
    if (cotizacionSeleccionada.detallesCotizacionProv && cotizacionSeleccionada.detallesCotizacionProv.length > 0) {
      console.log(
        "Usando detallesCotizacionProv (plural):",
        cotizacionSeleccionada.detallesCotizacionProv.length,
        "detalles",
      )
      return cotizacionSeleccionada.detallesCotizacionProv
    }

    // Verificar si existe detalleCotizacionProv (singular, por compatibilidad)
    if (cotizacionSeleccionada.detalleCotizacionProv && cotizacionSeleccionada.detalleCotizacionProv.length > 0) {
      console.log(
        "Usando detalleCotizacionProv (singular):",
        cotizacionSeleccionada.detalleCotizacionProv.length,
        "detalles",
      )
      return cotizacionSeleccionada.detalleCotizacionProv
    }

    // Verificar si existe detalles (alternativa)
    if (cotizacionSeleccionada.detalles && cotizacionSeleccionada.detalles.length > 0) {
      console.log("Usando detalles:", cotizacionSeleccionada.detalles.length, "detalles")
      return cotizacionSeleccionada.detalles
    }

    console.log("No se encontraron detalles en la cotización")
    return []
  }

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return "Fecha inválida"
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/ordenes-compra" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Órdenes de Compra
        </Button>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Nueva Orden de Compra
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Orden de compra creada exitosamente. Redirigiendo...
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Seleccionar Cotización Aprobada
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {/* Sección de búsqueda - Campos uno al lado del otro */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Buscar por ID de Cotización
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="ID Cotización"
                value={filtroId}
                onChange={(e) => setFiltroId(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button variant="contained" onClick={buscarPorId} disabled={loadingCotizaciones || !filtroId.trim()}>
                Buscar
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Buscar por Proveedor
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Nombre del Proveedor"
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                onClick={buscarPorProveedor}
                disabled={loadingCotizaciones || !filtroProveedor.trim()}
              >
                Buscar
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Botón para listar todas las cotizaciones */}
        <Box display="flex" justifyContent="center" mb={3}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<Refresh />}
            onClick={fetchCotizacionesAprobadas}
            disabled={loadingCotizaciones}
            sx={{ minWidth: 250 }}
          >
            Listar Todas las Cotizaciones
          </Button>
        </Box>

        {/* Mostrar resultados de la búsqueda */}
        {loadingCotizaciones ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : mostrarCotizaciones ? (
          cotizacionesAprobadas.length > 0 ? (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent sx={{ p: 0 }}>
                <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                  <ListItem>
                    <ListItemText
                      primary="Seleccione una cotización"
                      primaryTypographyProps={{ variant: "subtitle1", fontWeight: "bold" }}
                    />
                  </ListItem>
                  <Divider />
                  {cotizacionesAprobadas.map((cotizacion) => (
                    <ListItemButton
                      key={cotizacion.idCotizacionProveedor}
                      onClick={() => seleccionarCotizacion(cotizacion)}
                      divider
                    >
                      <ListItemText
                        primary={`#${cotizacion.idCotizacionProveedor} - ${cotizacion.proveedor?.empresa?.razonSocial || "Sin nombre"}`}
                        secondary={`Fecha: ${formatDate(cotizacion.fechaCotizacionProveedor)}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </CardContent>
            </Card>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              No hay cotizaciones aprobadas disponibles para crear órdenes de compra
              {(filtroId || filtroProveedor) && " con los filtros aplicados"}
            </Alert>
          )
        ) : null}

        {cotizacionSeleccionada && (
          <>
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Detalles de la Cotización #{cotizacionSeleccionada.idCotizacionProveedor}
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">
                  <strong>Proveedor:</strong> {cotizacionSeleccionada.proveedor?.empresa?.razonSocial || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>RUC:</strong> {cotizacionSeleccionada.proveedor?.empresa?.ruc || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Contacto:</strong> {cotizacionSeleccionada.proveedor?.empresa?.contacto || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2">
                  <strong>Fecha Cotización:</strong> {formatDate(cotizacionSeleccionada.fechaCotizacionProveedor)}
                </Typography>
                <Typography variant="body2">
                  <strong>Validez:</strong> {cotizacionSeleccionada.validez} días
                </Typography>
                {/* Corregido: Sacamos el Chip fuera del Typography para evitar el error de hidratación */}
                <Box display="flex" alignItems="center" mt={1}>
                  <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                    <strong>Estado:</strong>
                  </Typography>
                  <Chip label={cotizacionSeleccionada.estado} color="success" size="small" />
                </Box>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Materias Primas
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Materia Prima</TableCell>
                    <TableCell align="right">Precio Unitario</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getDetallesMateriaPrima().length > 0 ? (
                    getDetallesMateriaPrima().map((detalle, index) => (
                      <TableRow key={detalle.idDetalleCotizacionProv || index}>
                        <TableCell>{detalle.materiaPrima?.nombreMateriaPrima || "N/A"}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            detalle.precioUnitario || 0,
                          )}
                        </TableCell>
                        <TableCell align="right">{detalle.cantidad}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            detalle.subtotal || 0,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay detalles disponibles
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell colSpan={3} align="right">
                      <Typography variant="subtitle1">
                        <strong>TOTAL:</strong>
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1">
                        <strong>
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            cotizacionSeleccionada.montoTotal || 0,
                          )}
                        </strong>
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom>
              Observaciones
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Observaciones (opcional)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={loading}
              sx={{ mb: 3 }}
            />

            <Box display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                color="primary"
                onClick={handleCrearOrdenCompra}
                disabled={loading || success}
              >
                {loading ? <CircularProgress size={24} /> : "Crear Orden de Compra"}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  )
}
