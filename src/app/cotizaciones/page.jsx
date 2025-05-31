"use client"

import { useState, useEffect } from "react"
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Autocomplete,
} from "@mui/material"
import { Add, Visibility, ArrowBack, Search, Clear, FilterList, List, Person } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRootContext } from "@/src/app/context/root"

export default function CotizacionesPage() {
  const router = useRouter()
  const context = useRootContext()

  // Estados
  const [cotizaciones, setCotizaciones] = useState([])
  const [estados, setEstados] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    cliente: "",
    idCotizacion: "",
    idEstado: "",
  })

  // Estado para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  // Verificación de permisos
  const permisos = context.session?.permisos || []
  const cotizacionesPermiso = permisos.find((permiso) => permiso === "VIEW_COTIZACIONCLIENTE")

  // Cargar estados al montar el componente
  useEffect(() => {
    if (!cotizacionesPermiso) return

    const cargarEstados = async () => {
      try {
        const response = await fetch("/api/estados-cotizacion")
        if (response.ok) {
          const data = await response.json()
          setEstados(data)
        } else {
          console.warn("No se pudieron cargar los estados de cotización")
        }
      } catch (error) {
        console.error("Error al cargar estados:", error)
      }
    }

    cargarEstados()
  }, [cotizacionesPermiso])

  // Buscar clientes cuando se escribe en el campo
  const buscarClientes = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setClientes([])
      return
    }

    try {
      setLoadingClientes(true)
      const response = await fetch(`/api/clientes/con-cotizaciones?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setClientes(data)
      }
    } catch (error) {
      console.error("Error al buscar clientes:", error)
    } finally {
      setLoadingClientes(false)
    }
  }

  // Función para buscar cotizaciones
  const buscarCotizaciones = async (mostrarTodas = false) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()

      if (mostrarTodas) {
        params.append("mostrarTodas", "true")
      } else {
        if (filtros.cliente.trim()) {
          params.append("cliente", filtros.cliente.trim())
        }
        if (filtros.idCotizacion.trim()) {
          params.append("idCotizacion", filtros.idCotizacion.trim())
        }
        if (filtros.idEstado) {
          params.append("idEstado", filtros.idEstado)
        }
      }

      console.log("Buscando con parámetros:", params.toString())

      const response = await fetch(`/api/cotizaciones?${params.toString()}`)

      if (!response.ok) {
        throw new Error("Error al buscar cotizaciones")
      }

      const data = await response.json()
      setCotizaciones(data)
      setHasSearched(true)

      // Mostrar mensaje según resultados
      if (data.length === 0) {
        setSnackbarMessage(
          mostrarTodas
            ? "No hay cotizaciones registradas"
            : "No se encontraron cotizaciones que coincidan con los filtros",
        )
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
    }
  }

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))

    // Si es el campo cliente, buscar clientes
    if (campo === "cliente") {
      buscarClientes(valor)
    }
  }

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      buscarCotizaciones()
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      cliente: "",
      idCotizacion: "",
      idEstado: "",
    })
    setClientes([])
    setCotizaciones([])
    setHasSearched(false)
    setError(null)
  }

  // Verificar si hay filtros aplicados
  const hayFiltros = () => {
    return filtros.cliente.trim() || filtros.idCotizacion.trim() || filtros.idEstado
  }

  const handleNuevaCotizacion = () => {
    router.push("/cotizaciones/nueva")
  }

  const handleVerCotizacion = (id) => {
    router.push(`/cotizaciones/${id}`)
  }

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

  // Formatear cliente para mostrar en el autocomplete
  const formatearCliente = (cliente) => {
    const nombre = `${cliente.persona?.nombre || ""} ${cliente.persona?.apellido || ""}`.trim()
    const empresa = cliente.empresa?.razonSocial || ""
    const documento = cliente.persona?.nroDocumento || ""

    return `${nombre}${empresa ? ` - ${empresa}` : ""} (${documento})`
  }

  if (!cotizacionesPermiso) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
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

      {/* Panel de filtros */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
          <FilterList sx={{ mr: 1 }} />
          Filtros de Búsqueda
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Búsqueda por cliente con autocomplete */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              freeSolo
              options={clientes}
              getOptionLabel={(option) => {
                if (typeof option === "string") return option
                return formatearCliente(option)
              }}
              loading={loadingClientes}
              onInputChange={(event, newInputValue) => {
                handleFiltroChange("cliente", newInputValue)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Búsqueda por cliente"
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <>
                        {loadingClientes ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText="Escriba nombre, apellido o documento del cliente"
                />
              )}
            />
          </Grid>

          {/* ID de Cotización */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ID de Cotización"
              type="number"
              value={filtros.idCotizacion}
              onChange={(e) => handleFiltroChange("idCotizacion", e.target.value)}
              onKeyPress={handleKeyPress}
              helperText="Número exacto de la cotización"
            />
          </Grid>

          {/* Estado */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.idEstado}
                label="Estado"
                onChange={(e) => handleFiltroChange("idEstado", e.target.value)}
              >
                <MenuItem value="">
                  <em>Todos los estados</em>
                </MenuItem>
                {estados.map((estado) => (
                  <MenuItem key={estado.idEstadoCotizacionCliente} value={estado.idEstadoCotizacionCliente}>
                    {estado.descEstadoCotizacionCliente}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Botones de acción */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => buscarCotizaciones()}
                disabled={loading || !hayFiltros()}
                startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              >
                {loading ? "Buscando..." : "Buscar"}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                onClick={() => buscarCotizaciones(true)}
                disabled={loading}
                startIcon={<List />}
              >
                Mostrar Todas
              </Button>

              <Button variant="outlined" onClick={limpiarFiltros} disabled={loading} startIcon={<Clear />}>
                Limpiar Filtros
              </Button>
            </Box>
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
          <Alert severity="info">No se encontraron cotizaciones que coincidan con los filtros aplicados</Alert>
        )
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Use los filtros para buscar cotizaciones específicas o haga clic en "Mostrar Todas" para ver todas las
          cotizaciones
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
