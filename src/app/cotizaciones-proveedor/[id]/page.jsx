"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import React from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from "@mui/material"
import { ArrowBack, CheckCircle, Cancel, Delete } from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function VerCotizacionProveedorPage({ params }) {
  const router = useRouter()

  // Usar React.use() para "unwrap" los parámetros
  const unwrappedParams = React.use(params)
  const { id } = unwrappedParams

  const [cotizacion, setCotizacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState("")
  const [procesandoAccion, setProcesandoAccion] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  // Estados para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/cotizaciones-proveedor/${id}`)

        if (!response.ok) {
          throw new Error(`Error al cargar la cotización: ${response.status}`)
        }

        const data = await response.json()
        console.log("Datos de cotización recibidos:", data)
        setCotizacion(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchCotizacion()
    }
  }, [id])

  const handleOpenDialog = (action) => {
    setDialogAction(action)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
  }

  const handleConfirmAction = async () => {
    try {
      setProcesandoAccion(true)

      // Mapear la acción al estado correspondiente
      const estado = dialogAction === "aprobar" ? "APROBADA" : "RECHAZADA"

      console.log(`Enviando solicitud para cambiar estado a: ${estado}`)

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

      const response = await fetch(`/api/cotizaciones-proveedor/${id}/estado`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          estado,
        }),
      })

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = `Error al ${dialogAction} la cotización`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si no podemos analizar la respuesta como JSON, usamos el mensaje genérico
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      setCotizacion(data)
      handleCloseDialog()

      // Mostrar mensaje de éxito
      setSnackbarMessage(`Cotización ${dialogAction === "aprobar" ? "aprobada" : "rechazada"} exitosamente`)
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // NUEVO: Redireccionar después de un breve retraso
      setTimeout(() => {
        router.push("/cotizaciones-proveedor")
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      handleCloseDialog()

      // Mostrar mensaje de error
      setSnackbarMessage(`Error al ${dialogAction} la cotización: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setProcesandoAccion(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      setProcesandoAccion(true)

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

      const response = await fetch(`/api/cotizaciones-proveedor/${id}`, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = "Error al eliminar la cotización"
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si no podemos analizar la respuesta como JSON, usamos el mensaje genérico
        }

        throw new Error(errorMessage)
      }

      handleCloseDeleteDialog()

      // Mostrar mensaje de éxito
      setSnackbarMessage("Cotización eliminada exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // ASEGURAR: Redireccionar después de un breve retraso
      setTimeout(() => {
        router.push("/cotizaciones-proveedor")
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      handleCloseDeleteDialog()

      // Mostrar mensaje de error
      setSnackbarMessage(`Error al eliminar la cotización: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setProcesandoAccion(false)
    }
  }

  // Manejar cierre del Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  const getEstadoChipColor = (estado) => {
    switch (estado?.toUpperCase()) {
      case "APROBADA":
        return "success"
      case "RECHAZADA":
        return "error"
      case "VENCIDA":
        return "default"
      case "PENDIENTE":
      default:
        return "warning"
    }
  }

  const isEstadoPendiente = cotizacion?.estado?.toUpperCase() === "PENDIENTE"

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "Fecha no disponible"
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateString)
      return "Fecha inválida"
    }
  }

  // Función para obtener los detalles de materias primas
  const getDetallesMateriaPrima = () => {
    if (!cotizacion) return []

    // Intentar obtener detalles de diferentes propiedades posibles
    if (cotizacion.detalleCotizacionProv && cotizacion.detalleCotizacionProv.length > 0) {
      return cotizacion.detalleCotizacionProv
    }

    if (cotizacion.detalles && cotizacion.detalles.length > 0) {
      return cotizacion.detalles
    }

    // Si no hay detalles en ninguna propiedad conocida
    return []
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : cotizacion ? (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              Cotización de Proveedor #{cotizacion.idCotizacionProveedor}
            </Typography>
            <Box>
              {isEstadoPendiente && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleOpenDialog("aprobar")}
                    sx={{ mr: 1 }}
                    disabled={procesandoAccion}
                  >
                    Aprobar
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleOpenDialog("rechazar")}
                    sx={{ mr: 1 }}
                    disabled={procesandoAccion}
                  >
                    Rechazar
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleOpenDeleteDialog}
                    sx={{ mr: 1 }}
                    disabled={procesandoAccion}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </Box>
          </Box>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información General
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Fecha:</strong> {formatDate(cotizacion.fechaCotizacionProveedor)}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="body1" component="span" sx={{ mr: 1 }}>
                      <strong>Estado:</strong>
                    </Typography>
                    <Chip
                      label={cotizacion.estado || "PENDIENTE"}
                      color={getEstadoChipColor(cotizacion.estado)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body1">
                    <strong>Validez:</strong> {cotizacion.validez} días
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Proveedor
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Proveedor:</strong> {cotizacion.proveedor?.empresa?.razonSocial || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>RUC:</strong> {cotizacion.proveedor?.empresa?.ruc || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Contacto:</strong> {cotizacion.proveedor?.empresa?.contacto || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Teléfono:</strong> {cotizacion.proveedor?.empresa?.telefono || "N/A"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Detalle de Materias Primas
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TableContainer>
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
                  {getDetallesMateriaPrima().map((detalle) => (
                    <TableRow key={detalle.idMateriaPrima}>
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
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            cotizacion.montoTotal || 0,
                          )}
                        </strong>
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      ) : (
        <Alert severity="warning">No se encontró la cotización solicitada</Alert>
      )}

      {/* Diálogo de confirmación para aprobar/rechazar */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogAction === "aprobar" ? "Aprobar Cotización" : "Rechazar Cotización"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === "aprobar"
              ? "¿Está seguro de que desea aprobar esta cotización? Esta acción cambiará el estado de la cotización a 'APROBADA'."
              : "¿Está seguro de que desea rechazar esta cotización? Esta acción cambiará el estado de la cotización a 'RECHAZADA'."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={dialogAction === "aprobar" ? "success" : "error"}
            variant="contained"
            autoFocus
            disabled={procesandoAccion}
          >
            {procesandoAccion ? (
              <CircularProgress size={24} color="inherit" />
            ) : dialogAction === "aprobar" ? (
              "Aprobar"
            ) : (
              "Rechazar"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Eliminar Cotización</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar esta cotización? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus disabled={procesandoAccion}>
            {procesandoAccion ? <CircularProgress size={24} color="inherit" /> : "Eliminar"}
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
