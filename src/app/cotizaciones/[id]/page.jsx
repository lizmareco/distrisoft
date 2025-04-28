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
import { ArrowBack, PictureAsPdf, CheckCircle, Cancel } from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function VerCotizacionPage({ params }) {
  const router = useRouter()

  // Usar React.use() para "unwrap" los parámetros
  // Esto es necesario para futuras versiones de Next.js
  const unwrappedParams = React.use(params)
  const { id } = unwrappedParams

  const [cotizacion, setCotizacion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState("")
  const [generandoPDF, setGenerandoPDF] = useState(false)
  const [procesandoAccion, setProcesandoAccion] = useState(false)

  // Estados para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  useEffect(() => {
    const fetchCotizacion = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/cotizaciones/${id}`)

        if (!response.ok) {
          throw new Error("Error al cargar la cotización")
        }

        const data = await response.json()
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

  const handleGenerarPDF = async () => {
    try {
      setGenerandoPDF(true)
      setSnackbarMessage("Generando PDF, por favor espere...")
      setSnackbarSeverity("info")
      setOpenSnackbar(true)

      // Intentar descargar el PDF directamente
      const response = await fetch(`/api/cotizaciones/${id}/pdf`)

      if (!response.ok) {
        // Si hay un error, intentar obtener el mensaje de error
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al generar el PDF")
      }

      // Obtener el blob del PDF
      const blob = await response.blob()

      // Crear URL para el blob
      const url = window.URL.createObjectURL(blob)

      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = `cotizacion-${id}.pdf`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Mostrar mensaje de éxito
      setSnackbarMessage("PDF generado y descargado exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)
    } catch (error) {
      console.error("Error:", error)

      // Mostrar mensaje de error
      setSnackbarMessage("Error al generar el PDF: " + error.message)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setGenerandoPDF(false)
    }
  }

  const handleOpenDialog = (action) => {
    setDialogAction(action)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleConfirmAction = async () => {
    try {
      setProcesandoAccion(true)

      // Mapear la acción al ID del estado correspondiente
      const estadoId = dialogAction === "aprobar" ? 2 : 3 // 2 para APROBADA, 3 para RECHAZADA

      console.log(`Enviando solicitud para cambiar estado a: ${estadoId}`)

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

      const response = await fetch(`/api/cotizaciones/${id}/estado`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          estado: estadoId, // Enviar el ID en lugar del nombre
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

  // Manejar cierre del Snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return
    }
    setOpenSnackbar(false)
  }

  const getEstadoChipColor = (estado) => {
    switch (estado?.toLowerCase()) {
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

  const isEstadoPendiente =
    cotizacion?.estadoCotizacionCliente?.descEstadoCotizacionCliente?.toLowerCase() === "pendiente"

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/cotizaciones" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Cotizaciones
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
              Cotización #{cotizacion.idCotizacionCliente}
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
                </>
              )}
              <Button
                variant="contained"
                color="secondary"
                startIcon={generandoPDF ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdf />}
                onClick={handleGenerarPDF}
                disabled={generandoPDF}
              >
                {generandoPDF ? "Generando..." : "Generar PDF"}
              </Button>
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
                    <strong>Fecha:</strong> {format(new Date(cotizacion.fechaCotizacion), "dd/MM/yyyy", { locale: es })}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="body1" component="span" sx={{ mr: 1 }}>
                      <strong>Estado:</strong>
                    </Typography>
                    <Chip
                      label={cotizacion.estadoCotizacionCliente?.descEstadoCotizacionCliente || "Pendiente"}
                      color={getEstadoChipColor(cotizacion.estadoCotizacionCliente?.descEstadoCotizacionCliente)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body1">
                    <strong>Validez:</strong> {cotizacion.validez} días
                  </Typography>
                  <Typography variant="body1">
                    <strong>Vendedor:</strong> {cotizacion.usuario?.persona?.nombre}{" "}
                    {cotizacion.usuario?.persona?.apellido}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Cliente
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Cliente:</strong> {cotizacion.cliente?.persona?.nombre}{" "}
                    {cotizacion.cliente?.persona?.apellido}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Documento:</strong> {cotizacion.cliente?.persona?.tipoDocumento?.descTipoDocumento}:{" "}
                    {cotizacion.cliente?.persona?.nroDocumento}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Sector:</strong> {cotizacion.cliente?.sectorCliente?.descSectorCliente}
                  </Typography>
                  {cotizacion.cliente?.empresa && (
                    <Typography variant="body1">
                      <strong>Empresa:</strong> {cotizacion.cliente.empresa.razonSocial}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Detalle de Productos
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Precio Unitario</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cotizacion.detalleCotizacionCliente?.map((detalle) => (
                    <TableRow key={detalle.idProducto}>
                      <TableCell>{detalle.producto?.nombreProducto}</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                          detalle.subtotal / detalle.cantidad,
                        )}
                      </TableCell>
                      <TableCell align="right">{detalle.cantidad}</TableCell>
                      <TableCell align="right">
                        {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                          detalle.subtotal,
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
                            cotizacion.montoTotal,
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

      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{dialogAction === "aprobar" ? "Aprobar Cotización" : "Rechazar Cotización"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {dialogAction === "aprobar"
              ? "¿Está seguro de que desea aprobar esta cotización? Esta acción cambiará el estado de la cotización a 'Aprobada'."
              : "¿Está seguro de que desea rechazar esta cotización? Esta acción cambiará el estado de la cotización a 'Rechazada'."}
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
