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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import { Add, Visibility, Search, Clear, Delete } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function CotizacionesProveedorPage() {
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [cotizaciones, setCotizaciones] = useState([])
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cotizacionToDelete, setCotizacionToDelete] = useState(null)
  const [procesandoEliminacion, setProcesandoEliminacion] = useState(false)

  // Ya no cargamos automáticamente las cotizaciones al inicio

  const loadAllCotizaciones = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/cotizaciones-proveedor")
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`)
      }
      const data = await response.json()
      setCotizaciones(data)
      setHasSearched(true)

      // Mostrar mensaje con la cantidad de cotizaciones encontradas
      if (data.length === 0) {
        setSnackbarMessage("No se encontraron cotizaciones")
        setSnackbarSeverity("info")
      } else {
        setSnackbarMessage(`Se encontraron ${data.length} cotizaciones`)
        setSnackbarSeverity("success")
      }
      setOpenSnackbar(true)
    } catch (error) {
      console.error("Error al cargar cotizaciones:", error)
      setSnackbarMessage(`Error: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/cotizaciones-proveedor?search=${encodeURIComponent(searchTerm.trim())}`)

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      setCotizaciones(data)

      if (data.length === 0) {
        setSnackbarMessage("No se encontraron cotizaciones")
        setSnackbarSeverity("info")
        setOpenSnackbar(true)
      } else {
        setSnackbarMessage(`Se encontraron ${data.length} cotizaciones`)
        setSnackbarSeverity("success")
        setOpenSnackbar(true)
      }
    } catch (error) {
      console.error("Error al buscar cotizaciones:", error)
      setSnackbarMessage(`Error al buscar cotizaciones: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleVerCotizacion = (id) => {
    router.push(`/cotizaciones-proveedor/${id}`)
  }

  const handleDeleteClick = (cotizacion) => {
    setCotizacionToDelete(cotizacion)
    setDeleteDialogOpen(true)
  }

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setCotizacionToDelete(null)
  }

  const handleConfirmDelete = async () => {
    if (!cotizacionToDelete) return

    setProcesandoEliminacion(true)
    try {
      // Obtener el token de autenticación
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

      const headers = {
        "Content-Type": "application/json",
      }

      // Añadir el token de autorización si existe
      if (token) {
        headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`
      }

      const response = await fetch(`/api/cotizaciones-proveedor/${cotizacionToDelete.idCotizacionProveedor}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar la cotización")
      }

      // Actualizar la lista de cotizaciones
      setCotizaciones(cotizaciones.filter((c) => c.idCotizacionProveedor !== cotizacionToDelete.idCotizacionProveedor))

      setSnackbarMessage("Cotización eliminada exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)
    } catch (error) {
      console.error("Error al eliminar cotización:", error)
      setSnackbarMessage(`Error: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setProcesandoEliminacion(false)
      handleCloseDeleteDialog()
    }
  }

  const getEstadoChipColor = (estado) => {
    switch (estado) {
      case "APROBADA":
        return "success"
      case "RECHAZADA":
        return "error"
      case "PENDIENTE":
      default:
        return "warning"
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Fecha no disponible"
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateString)
      return "Fecha inválida"
    }
  }

  const getProveedorNombre = (cotizacion) => {
    if (!cotizacion.proveedor) return "N/A"

    // Si tiene empresa, mostrar la razón social
    if (cotizacion.proveedor.empresa?.razonSocial) {
      return cotizacion.proveedor.empresa.razonSocial
    }

    // Si tiene empresa pero no razón social, mostrar el contacto
    if (cotizacion.proveedor.empresa?.contacto) {
      return cotizacion.proveedor.empresa.contacto
    }

    // Si no hay información disponible
    return "Sin información"
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          Cotizaciones de Proveedores
        </Typography>
        <Button startIcon={<Add />} component={Link} href="/cotizaciones-proveedor/nueva" variant="contained">
          Nueva Cotización
        </Button>
      </Box>

      <Paper sx={{ padding: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar por ID o Proveedor"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: (
                  <IconButton edge="end" onClick={() => setSearchTerm("")} title="Limpiar búsqueda">
                    <Clear />
                  </IconButton>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2}>
              <Button variant="contained" color="primary" onClick={handleSearch}>
                Buscar
              </Button>
              <Button variant="outlined" onClick={loadAllCotizaciones}>
                Mostrar Todos
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

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
                  <TableCell>Proveedor</TableCell>
                  <TableCell>Monto Total</TableCell>
                  <TableCell>Validez</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cotizaciones.map((cotizacion) => (
                  <TableRow key={cotizacion.idCotizacionProveedor}>
                    <TableCell>{cotizacion.idCotizacionProveedor}</TableCell>
                    <TableCell>{formatDate(cotizacion.fechaCotizacionProveedor)}</TableCell>
                    <TableCell>{getProveedorNombre(cotizacion)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                        cotizacion.montoTotal || 0,
                      )}
                    </TableCell>
                    <TableCell>{cotizacion.validez || "N/A"} días</TableCell>
                    <TableCell>
                      <Chip
                        label={cotizacion.estado || "PENDIENTE"}
                        color={getEstadoChipColor(cotizacion.estado)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        <IconButton
                          color="primary"
                          onClick={() => handleVerCotizacion(cotizacion.idCotizacionProveedor)}
                          title="Ver cotización"
                          size="small"
                        >
                          <Visibility />
                        </IconButton>
                        {cotizacion.estado === "PENDIENTE" && (
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(cotizacion)}
                            title="Eliminar cotización"
                            size="small"
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
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
          Ingrese un ID de cotización o nombre de proveedor para buscar, o haga clic en "Mostrar Todos"
        </Alert>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Eliminar Cotización</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar la cotización #{cotizacionToDelete?.idCotizacionProveedor}? Esta acción
            no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={procesandoEliminacion}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
            disabled={procesandoEliminacion}
          >
            {procesandoEliminacion ? <CircularProgress size={24} color="inherit" /> : "Eliminar"}
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
