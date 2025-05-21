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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material"
import { ArrowBack, Edit, Save, Cancel, Delete, Inventory } from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function VerOrdenCompraPage({ params }) {
  const router = useRouter()

  // Usar React.use() para "unwrap" los parámetros
  const unwrappedParams = React.use(params)
  const { id } = unwrappedParams

  const [ordenCompra, setOrdenCompra] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogAction, setDialogAction] = useState("")
  const [procesandoAccion, setProcesandoAccion] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  // Estados para edición
  const [editMode, setEditMode] = useState(false)
  const [observacion, setObservacion] = useState("")
  const [estadoId, setEstadoId] = useState("")
  const [estados, setEstados] = useState([])
  const [loadingEstados, setLoadingEstados] = useState(false)

  // Estados para recepción parcial
  const [openRecepcionDialog, setOpenRecepcionDialog] = useState(false)
  const [itemsRecepcion, setItemsRecepcion] = useState([])

  // Estados para notificaciones
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [snackbarSeverity, setSnackbarSeverity] = useState("success")

  // Cargar la orden de compra
  useEffect(() => {
    const fetchOrdenCompra = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/ordenes-compra/${id}`)

        if (!response.ok) {
          throw new Error("Error al cargar la orden de compra")
        }

        const data = await response.json()
        console.log("Orden de compra cargada:", data)
        setOrdenCompra(data)
        setObservacion(data.observacion || "")
        setEstadoId(data.idEstadoOrdenCompra)

        // Inicializar items para recepción parcial
        if (data.cotizacionProveedor?.detallesCotizacionProv) {
          const items = data.cotizacionProveedor.detallesCotizacionProv.map((detalle) => ({
            idMateriaPrima: detalle.idMateriaPrima,
            nombreMateriaPrima: detalle.materiaPrima?.nombreMateriaPrima || "N/A",
            cantidadTotal: detalle.cantidad,
            cantidad: 0,
            seleccionado: false,
            unidadMedida: detalle.unidadMedida || "Unidad",
          }))
          setItemsRecepcion(items)
        }
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    // Cargar estados de orden de compra
    const fetchEstados = async () => {
      try {
        setLoadingEstados(true)
        // Aquí deberíamos tener un endpoint para obtener los estados, pero como no lo tenemos,
        // vamos a crear un array con los estados conocidos
        const estadosData = [
          { idEstadoOrdenCompra: 1, descEstadoOrdenCompra: "PENDIENTE" },
          { idEstadoOrdenCompra: 2, descEstadoOrdenCompra: "ENVIADO" },
          { idEstadoOrdenCompra: 3, descEstadoOrdenCompra: "RECIBIDO" },
          { idEstadoOrdenCompra: 4, descEstadoOrdenCompra: "PARCIALMENTE RECIBIDO" },
          { idEstadoOrdenCompra: 5, descEstadoOrdenCompra: "ANULADO" },
        ]
        setEstados(estadosData)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoadingEstados(false)
      }
    }

    if (id) {
      fetchOrdenCompra()
      fetchEstados()
    }
  }, [id])

  // Verificar si la orden puede ser editada
  const canEdit = () => {
    if (!ordenCompra || !ordenCompra.estadoOrdenCompra) return false

    const estadosEditables = ["PENDIENTE", "ENVIADO", "PARCIALMENTE RECIBIDO"]
    return estadosEditables.includes(ordenCompra.estadoOrdenCompra.descEstadoOrdenCompra)
  }

  // Verificar si la orden puede ser eliminada
  const canDelete = () => {
    if (!ordenCompra || !ordenCompra.estadoOrdenCompra) return false

    return ordenCompra.estadoOrdenCompra.descEstadoOrdenCompra === "PENDIENTE"
  }

  // Verificar si la orden puede ser recibida parcialmente
  const canReceivePartially = () => {
    if (!ordenCompra || !ordenCompra.estadoOrdenCompra) return false

    const estadosRecibibles = ["ENVIADO", "PARCIALMENTE RECIBIDO"]
    return estadosRecibibles.includes(ordenCompra.estadoOrdenCompra.descEstadoOrdenCompra)
  }

  // Manejar cambio a modo edición
  const handleEditMode = () => {
    setEditMode(true)
    setObservacion(ordenCompra.observacion || "")
    setEstadoId(ordenCompra.idEstadoOrdenCompra)
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditMode(false)
    setObservacion(ordenCompra.observacion || "")
    setEstadoId(ordenCompra.idEstadoOrdenCompra)
  }

  // Abrir diálogo de recepción parcial
  const handleOpenRecepcionDialog = () => {
    setOpenRecepcionDialog(true)
  }

  // Cerrar diálogo de recepción parcial
  const handleCloseRecepcionDialog = () => {
    setOpenRecepcionDialog(false)
  }

  // Manejar cambio en checkbox de item
  const handleItemCheckChange = (index, checked) => {
    const newItems = [...itemsRecepcion]
    newItems[index].seleccionado = checked
    // Si se deselecciona, resetear la cantidad
    if (!checked) {
      newItems[index].cantidad = 0
    }
    setItemsRecepcion(newItems)
  }

  // Manejar cambio en cantidad de item
  const handleItemCantidadChange = (index, cantidad) => {
    const newItems = [...itemsRecepcion]
    // Asegurar que la cantidad no sea mayor que la total
    const cantidadNum = Number(cantidad)
    if (cantidadNum > newItems[index].cantidadTotal) {
      newItems[index].cantidad = newItems[index].cantidadTotal
    } else {
      newItems[index].cantidad = cantidadNum
    }
    setItemsRecepcion(newItems)
  }

  // Confirmar recepción parcial
  const handleConfirmRecepcion = async () => {
    try {
      setProcesandoAccion(true)

      // Filtrar solo los items seleccionados con cantidad > 0
      const itemsSeleccionados = itemsRecepcion
        .filter((item) => item.seleccionado && item.cantidad > 0)
        .map((item) => ({
          idMateriaPrima: item.idMateriaPrima,
          cantidad: item.cantidad,
          unidadMedida: item.unidadMedida,
        }))

      if (itemsSeleccionados.length === 0) {
        setSnackbarMessage("Debe seleccionar al menos un ítem con cantidad mayor a cero")
        setSnackbarSeverity("error")
        setOpenSnackbar(true)
        setProcesandoAccion(false)
        return
      }

      // Obtener el token de autenticación
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

      // Actualizar la orden de compra a PARCIALMENTE RECIBIDO
      const estadoParcialmenteRecibido = estados.find((e) => e.descEstadoOrdenCompra === "PARCIALMENTE RECIBIDO")

      if (!estadoParcialmenteRecibido) {
        throw new Error("No se encontró el estado PARCIALMENTE RECIBIDO")
      }

      const response = await fetch(`/api/ordenes-compra/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          idEstadoOrdenCompra: estadoParcialmenteRecibido.idEstadoOrdenCompra,
          observacion: `${ordenCompra.observacion || ""}\n[${new Date().toLocaleString()}] Recepción parcial de materias primas.`,
          recepcionItems: itemsSeleccionados,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar la orden de compra")
      }

      const data = await response.json()
      setOrdenCompra(data)
      handleCloseRecepcionDialog()

      // Mostrar mensaje de éxito
      setSnackbarMessage("Recepción parcial registrada exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // Recargar la página después de un breve retraso
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)

      // Mostrar mensaje de error
      setSnackbarMessage(`Error al registrar recepción: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setProcesandoAccion(false)
    }
  }

  // Guardar cambios
  const handleSaveChanges = async () => {
    try {
      setProcesandoAccion(true)

      // Obtener el token de autenticación
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

      // Verificar si se está cambiando a estado RECIBIDO
      const nuevoEstadoObj = estados.find((e) => e.idEstadoOrdenCompra === Number(estadoId))
      const cambioARecibido = nuevoEstadoObj && nuevoEstadoObj.descEstadoOrdenCompra === "RECIBIDO"

      const response = await fetch(`/api/ordenes-compra/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          observacion: observacion.trim(),
          idEstadoOrdenCompra: estadoId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al actualizar la orden de compra")
      }

      const data = await response.json()
      setOrdenCompra(data)
      setEditMode(false)

      // Mostrar mensaje de éxito
      let mensaje = "Orden de compra actualizada exitosamente"
      if (cambioARecibido) {
        mensaje += ". Se ha actualizado el inventario con los items recibidos."
      }
      setSnackbarMessage(mensaje)
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // Si cambió a RECIBIDO, recargar la página después de un breve retraso
      if (cambioARecibido) {
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)

      // Mostrar mensaje de error
      setSnackbarMessage(`Error al actualizar la orden de compra: ${error.message}`)
      setSnackbarSeverity("error")
      setOpenSnackbar(true)
    } finally {
      setProcesandoAccion(false)
    }
  }

  // Manejar eliminación
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true)
  }

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false)
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

      const response = await fetch(`/api/ordenes-compra/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar la orden de compra")
      }

      handleCloseDeleteDialog()

      // Mostrar mensaje de éxito
      setSnackbarMessage("Orden de compra eliminada exitosamente")
      setSnackbarSeverity("success")
      setOpenSnackbar(true)

      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push("/ordenes-compra")
      }, 1500)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      handleCloseDeleteDialog()

      // Mostrar mensaje de error
      setSnackbarMessage(`Error al eliminar la orden de compra: ${error.message}`)
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
      case "enviado":
        return "info"
      case "recibido":
        return "success"
      case "parcialmente recibido":
        return "secondary"
      case "anulado":
        return "error"
      default:
        return "default"
    }
  }

  // Obtener los detalles de materias primas
  const getDetallesMateriaPrima = () => {
    if (!ordenCompra || !ordenCompra.cotizacionProveedor) return []

    console.log("Cotización proveedor:", ordenCompra.cotizacionProveedor)

    // Intentar obtener detalles de diferentes propiedades posibles
    const cotizacion = ordenCompra.cotizacionProveedor

    if (cotizacion.detallesCotizacionProv && cotizacion.detallesCotizacionProv.length > 0) {
      console.log("Usando detallesCotizacionProv:", cotizacion.detallesCotizacionProv)
      return cotizacion.detallesCotizacionProv
    }

    if (cotizacion.detalleCotizacionProv && cotizacion.detalleCotizacionProv.length > 0) {
      console.log("Usando detalleCotizacionProv:", cotizacion.detalleCotizacionProv)
      return cotizacion.detalleCotizacionProv
    }

    if (cotizacion.detalles && cotizacion.detalles.length > 0) {
      console.log("Usando detalles:", cotizacion.detalles)
      return cotizacion.detalles
    }

    console.log("No se encontraron detalles")
    return []
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/ordenes-compra" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Órdenes de Compra
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
      ) : ordenCompra ? (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              Orden de Compra #{ordenCompra.idOrdenCompra}
            </Typography>
            <Box>
              {!editMode && canReceivePartially() && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Inventory />}
                  onClick={handleOpenRecepcionDialog}
                  sx={{ mr: 1 }}
                >
                  Recepción Parcial
                </Button>
              )}
              {!editMode && canEdit() && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Edit />}
                  onClick={handleEditMode}
                  sx={{ mr: 1 }}
                >
                  Editar
                </Button>
              )}
              {editMode && (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleSaveChanges}
                    disabled={procesandoAccion}
                    sx={{ mr: 1 }}
                  >
                    Guardar
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Cancel />}
                    onClick={handleCancelEdit}
                    disabled={procesandoAccion}
                    sx={{ mr: 1 }}
                  >
                    Cancelar
                  </Button>
                </>
              )}
              {!editMode && canDelete() && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleOpenDeleteDialog}
                  disabled={procesandoAccion}
                >
                  Eliminar
                </Button>
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
                    <strong>Fecha:</strong> {format(new Date(ordenCompra.fechaOrden), "dd/MM/yyyy", { locale: es })}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="body1" component="span" sx={{ mr: 1 }}>
                      <strong>Estado:</strong>
                    </Typography>
                    {editMode ? (
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="estado-label">Estado</InputLabel>
                        <Select
                          labelId="estado-label"
                          id="estado"
                          value={estadoId}
                          label="Estado"
                          onChange={(e) => setEstadoId(e.target.value)}
                          disabled={loadingEstados || procesandoAccion}
                        >
                          {estados.map((estado) => (
                            <MenuItem key={estado.idEstadoOrdenCompra} value={estado.idEstadoOrdenCompra}>
                              {estado.descEstadoOrdenCompra}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={ordenCompra.estadoOrdenCompra?.descEstadoOrdenCompra || "Pendiente"}
                        color={getEstadoChipColor(ordenCompra.estadoOrdenCompra?.descEstadoOrdenCompra)}
                        size="small"
                      />
                    )}
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Información del Proveedor
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>Proveedor:</strong>{" "}
                    {ordenCompra.cotizacionProveedor?.proveedor?.empresa?.razonSocial || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>RUC:</strong> {ordenCompra.cotizacionProveedor?.proveedor?.empresa?.ruc || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Contacto:</strong> {ordenCompra.cotizacionProveedor?.proveedor?.empresa?.contacto || "N/A"}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Teléfono:</strong> {ordenCompra.cotizacionProveedor?.proveedor?.empresa?.telefono || "N/A"}
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
                            ordenCompra.cotizacionProveedor?.montoTotal || 0,
                          )}
                        </strong>
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Sección de Inventario (si hay registros) */}
          {ordenCompra.inventario && ordenCompra.inventario.length > 0 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Registros de Inventario
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Materia Prima</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell>Unidad</TableCell>
                      <TableCell>Fecha Ingreso</TableCell>
                      <TableCell>Observación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordenCompra.inventario.map((item) => (
                      <TableRow key={item.idInventario}>
                        <TableCell>{item.materiaPrima?.nombreMateriaPrima || "N/A"}</TableCell>
                        <TableCell align="right">{item.cantidad}</TableCell>
                        <TableCell>{item.unidadMedida}</TableCell>
                        <TableCell>{format(new Date(item.fechaIngreso), "dd/MM/yyyy HH:mm", { locale: es })}</TableCell>
                        <TableCell>{item.observacion || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Observaciones
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {editMode ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Observaciones"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                disabled={procesandoAccion}
              />
            ) : (
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {ordenCompra.observacion || "Sin observaciones"}
              </Typography>
            )}
          </Paper>
        </>
      ) : (
        <Alert severity="warning">No se encontró la orden de compra solicitada</Alert>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Eliminar Orden de Compra</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar esta orden de compra? Esta acción no se puede deshacer.
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

      {/* Diálogo para recepción parcial */}
      <Dialog open={openRecepcionDialog} onClose={handleCloseRecepcionDialog} maxWidth="md" fullWidth>
        <DialogTitle>Recepción Parcial de Materias Primas</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Seleccione las materias primas recibidas e indique la cantidad para cada una.
          </DialogContentText>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">Seleccionar</TableCell>
                  <TableCell>Materia Prima</TableCell>
                  <TableCell align="right">Cantidad Total</TableCell>
                  <TableCell align="right">Cantidad Recibida</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemsRecepcion.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={item.seleccionado}
                        onChange={(e) => handleItemCheckChange(index, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>{item.nombreMateriaPrima}</TableCell>
                    <TableCell align="right">{item.cantidadTotal}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={item.cantidad}
                        onChange={(e) => handleItemCantidadChange(index, e.target.value)}
                        disabled={!item.seleccionado}
                        inputProps={{ min: 0, max: item.cantidadTotal, step: "any" }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Alert severity="info">
            Al confirmar, se actualizará el estado de la orden a "PARCIALMENTE RECIBIDO" y se registrarán las cantidades
            recibidas en el inventario.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecepcionDialog} disabled={procesandoAccion}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRecepcion}
            color="primary"
            variant="contained"
            disabled={procesandoAccion || !itemsRecepcion.some((item) => item.seleccionado && item.cantidad > 0)}
          >
            {procesandoAccion ? <CircularProgress size={24} color="inherit" /> : "Confirmar Recepción"}
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
