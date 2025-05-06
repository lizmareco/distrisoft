"use client"

import { useState } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Snackbar,
} from "@mui/material"
import { Add, Visibility, ArrowBack, Search, Clear } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRootContext } from "@/src/app/context/root"


export default function CotizacionesPage() {
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const cotizacionesPermiso = permisos.find((permiso) => permiso === "VIEW_COTIZACIONCLIENTE")

  if (!cotizacionesPermiso) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  const router = useRouter()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Estado para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  // Función para buscar cotizaciones
  const searchCotizaciones = async () => {
    if (!searchTerm.trim()) {
      setError("Ingrese un ID de cotización o nombre de cliente para buscar")
      return
    }

    try {
      setLoading(true)
      setSearching(true)
      setError(null)

      const response = await fetch(`/api/cotizaciones?search=${encodeURIComponent(searchTerm.trim())}`)

      if (!response.ok) {
        throw new Error("Error al buscar cotizaciones")
      }

      const data = await response.json()
      setCotizaciones(data)
      setHasSearched(true)

      // Mostrar mensaje según resultados
      if (data.length === 0) {
        setSnackbarMessage("No se encontraron cotizaciones que coincidan con la búsqueda")
        setSnackbarSeverity("info")
        setOpenSnackbar(true)
      } else {
        setSnackbarMessage(`Se encontraron ${data.length} cotizaciones`)
        setSnackbarSeverity("success")
        setOpenSnackbar(true)
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)

      setSnackbarMessage("Error al buscar cotizaciones: " + error.message)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    if (e.target.value === "") {
      setCotizaciones([])
      setHasSearched(false)
    }
  }

  // Manejar tecla Enter en el campo de búsqueda
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      searchCotizaciones()
    }
  }

  // Limpiar la búsqueda
  const handleClearSearch = () => {
    setSearchTerm("")
    setCotizaciones([])
    setHasSearched(false)
    setError(null)
  }

  const handleNuevaCotizacion = () => {
    router.push("/cotizaciones/nueva")
  }

  const handleVerCotizacion = (id) => {
    router.push(`/cotizaciones/${id}`)
  }

  // Manejar cierre del Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  const getEstadoChipColor = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "warning"
      case "aprobada":
        return "success"
      case "rechazada":
        return "error"
      case "vencida":
        return "default"
      default:
        return "primary"
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/dashboard" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cotizaciones
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNuevaCotizacion}>
          Nueva Cotización
        </Button>
      </Box>

      {/* Formulario de búsqueda */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Buscar Cotizaciones
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Buscar por ID de cotización o nombre de cliente"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClearSearch} size="small">
                      <Clear />
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
              onClick={searchCotizaciones}
              disabled={searching || !searchTerm.trim()}
              startIcon={<Search />}
              fullWidth
            >
              {searching ? <CircularProgress size={24} /> : "Buscar"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : hasSearched ? (
        cotizaciones.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Monto Total</TableCell>
                  <TableCell>Validez</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cotizaciones.map((cotizacion) => (
                  <TableRow key={cotizacion.idCotizacionCliente}>
                    <TableCell>{cotizacion.idCotizacionCliente}</TableCell>
                    <TableCell>{format(new Date(cotizacion.fechaCotizacion), "dd/MM/yyyy", { locale: es })}</TableCell>
                    <TableCell>
                      {cotizacion.cliente?.persona?.nombre} {cotizacion.cliente?.persona?.apellido}
                      {cotizacion.cliente?.empresa && ` - ${cotizacion.cliente.empresa.razonSocial}`}
                    </TableCell>
                    <TableCell>
                      {cotizacion.usuario?.persona?.nombre} {cotizacion.usuario?.persona?.apellido}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                        cotizacion.montoTotal,
                      )}
                    </TableCell>
                    <TableCell>{cotizacion.validez} días</TableCell>
                    <TableCell>
                      <Chip
                        label={cotizacion.estadoCotizacionCliente?.descEstadoCotizacionCliente || "Pendiente"}
                        color={getEstadoChipColor(
                          cotizacion.estadoCotizacionCliente?.descEstadoCotizacionCliente || "pendiente",
                        )}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleVerCotizacion(cotizacion.idCotizacionCliente)}
                        title="Ver cotización"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No se encontraron cotizaciones que coincidan con la búsqueda</Alert>
        )
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Ingrese un ID de cotización o nombre de cliente para buscar
        </Alert>
      )}

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
