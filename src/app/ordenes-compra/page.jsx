"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
} from "@mui/material"
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowBack } from "@mui/icons-material"
import { useRootContext } from "@/src/app/context/root"

export default function OrdenesCompraPage() {
  const [ordenesCompra, setOrdenesCompra] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [idCotizacion, setIdCotizacion] = useState("")
  const [idOrdenCompra, setIdOrdenCompra] = useState("")
  const [idProveedor, setIdProveedor] = useState("")
  const [estado, setEstado] = useState("")
  const [estados, setEstados] = useState([
    { id: "PENDIENTE", nombre: "PENDIENTE" },
    { id: "ENVIADO", nombre: "ENVIADO" },
    { id: "RECIBIDO", nombre: "RECIBIDO" },
    { id: "PARCIALMENTE RECIBIDO", nombre: "PARCIALMENTE RECIBIDO" },
    { id: "ANULADO", nombre: "ANULADO" },
  ])

  const [metodosPago, setMetodosPago] = useState([])
  const [datosFactura, setDatosFactura] = useState({
    nroFactura: "",
    fechaEmision: new Date().toISOString().split("T")[0],
    esContado: true,
    idMetodoPago: "",
    comprobantePago: "",
    plazoPago: 30,
    fechaVencimiento: "",
    observacion: "",
  })

  // Obtener contexto y permisos
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_ORDENCOMPRA") || context.session?.isAdmin

  // Estados para diálogos y acciones
  const [dialogEstado, setDialogEstado] = useState({ open: false, orden: null })
  const [dialogEliminar, setDialogEliminar] = useState({ open: false, orden: null })
  const [dialogFactura, setDialogFactura] = useState({ open: false, orden: null })
  const [dialogRecepcion, setDialogRecepcion] = useState({ open: false, orden: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedOrden, setSelectedOrden] = useState(null)

  // Estados para formularios
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [itemsRecepcion, setItemsRecepcion] = useState([])

  const [mostrarOrdenes, setMostrarOrdenes] = useState(false)

  // Después de la línea donde defines otros estados, agregar:
  const [facturasExistentes, setFacturasExistentes] = useState(new Set())

  // Cargar órdenes de compra
  const fetchOrdenesCompra = async () => {
    try {
      setLoading(true)
      setError(null)
      setMostrarOrdenes(true)

      let url = "/api/ordenes-compra?"

      if (idCotizacion) {
        url += `idCotizacion=${encodeURIComponent(idCotizacion)}&`
      }

      if (idOrdenCompra) {
        url += `idOrdenCompra=${encodeURIComponent(idOrdenCompra)}&`
      }

      if (idProveedor) {
        url += `idProveedor=${encodeURIComponent(idProveedor)}&`
      }

      if (estado) {
        url += `estado=${encodeURIComponent(estado)}&`
      }

      if (mostrarTodas) {
        url += "mostrarTodas=true&"
      }

      console.log("Fetching URL:", url)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Error al cargar órdenes de compra")
      }

      const data = await response.json()
      setOrdenesCompra(data)
      setPage(0)
      // En la función fetchOrdenesCompra, después de setOrdenesCompra(data), agregar:
      await verificarFacturasExistentes(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar métodos de pago
  const fetchMetodosPago = async () => {
    try {
      const response = await fetch("/api/finanzas/metodos-pago")
      if (response.ok) {
        const data = await response.json()
        setMetodosPago(data.data || [])
      }
    } catch (error) {
      console.error("Error al cargar métodos de pago:", error)
    }
  }

  // Agregar esta función después de fetchMetodosPago:
  const verificarFacturasExistentes = async (ordenes) => {
    try {
      const ordenesRecibidas = ordenes.filter(
        (orden) => orden.estadoOrdenCompra?.descEstadoOrdenCompra?.toLowerCase() === "recibido",
      )

      if (ordenesRecibidas.length === 0) {
        setFacturasExistentes(new Set())
        return
      }

      const idsOrdenes = ordenesRecibidas.map((orden) => orden.idOrdenCompra)
      const response = await fetch("/api/finanzas/facturas-proveedores/verificar-existentes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idsOrdenes }),
      })

      if (response.ok) {
        const data = await response.json()
        setFacturasExistentes(new Set(data.ordenesConFactura || []))
      }
    } catch (error) {
      console.error("Error al verificar facturas existentes:", error)
    }
  }

  useEffect(() => {
    setLoading(false)
    fetchMetodosPago()
  }, [])

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  // Manejar búsqueda
  const handleSearch = (event) => {
    event.preventDefault()
    fetchOrdenesCompra()
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setIdCotizacion("")
    setIdOrdenCompra("")
    setIdProveedor("")
    setEstado("")
    setMostrarTodas(false)
    setMostrarOrdenes(false)
    setOrdenesCompra([])
  }

  // Obtener color del chip según el estado
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

  // Manejar menú de acciones
  const handleMenuClick = (event, orden) => {
    setAnchorEl(event.currentTarget)
    setSelectedOrden(orden)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedOrden(null)
  }

  // Cambiar estado de orden
  const handleCambiarEstado = async () => {
    try {
      const response = await fetch(`/api/ordenes-compra/${dialogEstado.orden.idOrdenCompra}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idEstadoOrdenCompra: getEstadoId(nuevoEstado),
        }),
      })

      if (!response.ok) {
        throw new Error("Error al cambiar estado")
      }

      setSnackbar({
        open: true,
        message: "Estado actualizado exitosamente",
        severity: "success",
      })

      setDialogEstado({ open: false, orden: null })
      setNuevoEstado("")
      fetchOrdenesCompra()
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      })
    }
  }

  // Eliminar orden
  const handleEliminarOrden = async () => {
    try {
      const response = await fetch(`/api/ordenes-compra/${dialogEliminar.orden.idOrdenCompra}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar orden")
      }

      setSnackbar({
        open: true,
        message: "Orden eliminada exitosamente",
        severity: "success",
      })

      setDialogEliminar({ open: false, orden: null })
      fetchOrdenesCompra()
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      })
    }
  }

  // Guardar factura de proveedor
  const handleGuardarFactura = async () => {
    try {
      const facturaData = {
        idOrdenCompra: dialogFactura.orden.idOrdenCompra,
        nroFactura: datosFactura.nroFactura,
        fechaEmision: datosFactura.fechaEmision,
        esContado: datosFactura.esContado,
        observacion: datosFactura.observacion || null,
      }

      // Campos específicos según tipo
      if (datosFactura.esContado) {
        facturaData.idMetodoPago = datosFactura.idMetodoPago
        facturaData.comprobantePago = datosFactura.comprobantePago
      } else {
        facturaData.plazoPago = datosFactura.plazoPago
        facturaData.fechaVencimiento = datosFactura.fechaVencimiento
      }

      console.log("Enviando datos de factura:", facturaData)

      const response = await fetch("/api/finanzas/facturas-proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(facturaData),
        credentials: "include",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar factura")
      }

      const result = await response.json()

      setSnackbar({
        open: true,
        message: result.message || "Factura guardada exitosamente",
        severity: "success",
      })

      setDialogFactura({ open: false, orden: null })
      resetFormularioFactura()

      // Redirigir a cuentas por pagar si es a crédito
      if (!datosFactura.esContado) {
        setTimeout(() => {
          window.location.href = "/finanzas/cuentas-pagar"
        }, 1500)
      }
    } catch (error) {
      console.error("Error al guardar factura:", error)
      setSnackbar({
        open: true,
        message: error.message,
        severity: "error",
      })
    }
  }

  // Resetear formulario de factura
  const resetFormularioFactura = () => {
    setDatosFactura({
      nroFactura: "",
      fechaEmision: new Date().toISOString().split("T")[0],
      esContado: true,
      idMetodoPago: "",
      comprobantePago: "",
      plazoPago: 30,
      fechaVencimiento: "",
      observacion: "",
    })
  }

  // Obtener ID de estado por nombre
  const getEstadoId = (nombreEstado) => {
    const estadosMap = {
      PENDIENTE: 1,
      ENVIADO: 2,
      RECIBIDO: 3,
      "PARCIALMENTE RECIBIDO": 4,
      ANULADO: 5,
    }
    return estadosMap[nombreEstado] || 1
  }

  // Obtener estados disponibles para cambio
  const getEstadosDisponibles = (estadoActual) => {
    if (!estadoActual) return []

    switch (estadoActual?.toLowerCase()) {
      case "pendiente":
        return ["ENVIADO", "ANULADO"]
      case "enviado":
        return ["RECIBIDO", "PARCIALMENTE RECIBIDO", "ANULADO"]
      case "parcialmente recibido":
        return ["RECIBIDO", "ANULADO"]
      default:
        return []
    }
  }

  // Reemplazar la función puedeGuardarFactura existente con:
  const puedeGuardarFactura = (orden) => {
    if (!orden || !orden.estadoOrdenCompra) return false
    const esRecibido = orden.estadoOrdenCompra?.descEstadoOrdenCompra?.toLowerCase() === "recibido"
    const tieneFactura = facturasExistentes.has(orden.idOrdenCompra)
    return esRecibido && !tieneFactura
  }

  const tieneFacturaGuardada = (orden) => {
    if (!orden || !orden.estadoOrdenCompra) return false
    const esRecibido = orden.estadoOrdenCompra?.descEstadoOrdenCompra?.toLowerCase() === "recibido"
    return esRecibido && facturasExistentes.has(orden.idOrdenCompra)
  }

  // Verificar si se puede eliminar
  const puedeEliminar = (orden) => {
    if (!orden || !orden.estadoOrdenCompra) return false
    return orden.estadoOrdenCompra?.descEstadoOrdenCompra?.toLowerCase() === "pendiente"
  }

  // Verificar si se puede recepcionar
  const puedeRecepcionar = (orden) => {
    if (!orden || !orden.estadoOrdenCompra) return false
    return orden.estadoOrdenCompra?.descEstadoOrdenCompra?.toLowerCase() === "parcialmente recibido"
  }

  // Definir el contenido a renderizar según el permiso
  const content = !hasPermission ? (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Alert severity="error">No tiene permisos para ver esta página</Alert>
    </Container>
  ) : (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
      </Button>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Órdenes de Compra
        </Typography>
        <Button
          component={Link}
          href="/ordenes-compra/nueva"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Nueva Orden de Compra
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} noValidate>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="ID Orden de Compra"
                value={idOrdenCompra}
                onChange={(e) => setIdOrdenCompra(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="ID Cotización"
                value={idCotizacion}
                onChange={(e) => setIdCotizacion(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado"
                  value={estado}
                  label="Estado"
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button type="submit" variant="contained" color="primary">
                  Aplicar Filtros
                </Button>
                <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={fetchOrdenesCompra}>
                  Listar Todas las Órdenes
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchOrdenesCompra}>
                  Actualizar
                </Button>
                {(idCotizacion || idOrdenCompra || idProveedor || estado || mostrarTodas) && (
                  <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClearFilters} color="error">
                    Limpiar Filtros
                  </Button>
                )}
                <FormControl component="fieldset">
                  <Box display="flex" alignItems="center">
                    <input
                      type="checkbox"
                      id="mostrarTodas"
                      checked={mostrarTodas}
                      onChange={(e) => setMostrarTodas(e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    <label htmlFor="mostrarTodas">Mostrar todas (incluye órdenes antiguas)</label>
                  </Box>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : mostrarOrdenes ? (
          ordenesCompra.length > 0 ? (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Cotización</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Monto Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordenesCompra.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((orden) => (
                      <TableRow hover key={orden.idOrdenCompra}>
                        <TableCell>{orden.idOrdenCompra}</TableCell>
                        <TableCell>{format(new Date(orden.fechaOrden), "dd/MM/yyyy", { locale: es })}</TableCell>
                        <TableCell>{orden.cotizacionProveedor?.proveedor?.empresa?.razonSocial || "N/A"}</TableCell>
                        <TableCell>#{orden.idCotizacionProveedor}</TableCell>
                        <TableCell>
                          <Chip
                            label={orden.estadoOrdenCompra?.descEstadoOrdenCompra || "Pendiente"}
                            color={getEstadoChipColor(orden.estadoOrdenCompra?.descEstadoOrdenCompra)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            orden.cotizacionProveedor?.montoTotal || 0,
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalles">
                            <IconButton
                              component={Link}
                              href={`/ordenes-compra/${orden.idOrdenCompra}`}
                              color="primary"
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Más acciones">
                            <IconButton size="small" onClick={(e) => handleMenuClick(e, orden)}>
                              <MoreVertIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={ordenesCompra.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          ) : (
            <Box p={3} textAlign="center">
              <Typography variant="body1">No se encontraron órdenes de compra</Typography>
            </Box>
          )
        ) : (
          <Box p={5} textAlign="center">
            <Typography variant="body1">
              Utilice los filtros y haga clic en "Listar Todas las Órdenes" o "Aplicar Filtros" para ver las órdenes de
              compra
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Menú de acciones */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            setDialogEstado({ open: true, orden: selectedOrden })
            handleMenuClose()
          }}
          disabled={getEstadosDisponibles(selectedOrden?.estadoOrdenCompra?.descEstadoOrdenCompra).length === 0}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cambiar Estado</ListItemText>
        </MenuItem>

        {puedeEliminar(selectedOrden) && (
          <MenuItem
            onClick={() => {
              setDialogEliminar({ open: true, orden: selectedOrden })
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Eliminar Orden</ListItemText>
          </MenuItem>
        )}

        {puedeGuardarFactura(selectedOrden) && (
          <MenuItem
            onClick={() => {
              setDialogFactura({ open: true, orden: selectedOrden })
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Guardar Factura Proveedor</ListItemText>
          </MenuItem>
        )}
        {tieneFacturaGuardada(selectedOrden) && (
          <MenuItem disabled>
            <ListItemIcon>
              <ReceiptIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" color="success.main">
                ✅ Factura ya guardada
              </Typography>
            </ListItemText>
          </MenuItem>
        )}

        {puedeRecepcionar(selectedOrden) && (
          <MenuItem
            onClick={() => {
              setDialogRecepcion({ open: true, orden: selectedOrden })
              handleMenuClose()
            }}
          >
            <ListItemIcon>
              <InventoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Recepcionar Items</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Diálogo cambiar estado */}
      <Dialog open={dialogEstado.open} onClose={() => setDialogEstado({ open: false, orden: null })}>
        <DialogTitle>Cambiar Estado de Orden</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} label="Nuevo Estado">
              {getEstadosDisponibles(dialogEstado.orden?.estadoOrdenCompra?.descEstadoOrdenCompra).map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEstado({ open: false, orden: null })}>Cancelar</Button>
          <Button onClick={handleCambiarEstado} variant="contained" disabled={!nuevoEstado}>
            Cambiar Estado
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo eliminar orden */}
      <Dialog open={dialogEliminar.open} onClose={() => setDialogEliminar({ open: false, orden: null })}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea eliminar la orden de compra #{dialogEliminar.orden?.idOrdenCompra}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEliminar({ open: false, orden: null })}>Cancelar</Button>
          <Button onClick={handleEliminarOrden} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo guardar factura */}
      <Dialog
        open={dialogFactura.open}
        onClose={() => {
          setDialogFactura({ open: false, orden: null })
          resetFormularioFactura()
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Registrar Factura de Proveedor</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <strong>Orden:</strong> #{dialogFactura.orden?.idOrdenCompra}
            <br />
            <strong>Proveedor:</strong> {dialogFactura.orden?.cotizacionProveedor?.proveedor?.empresa?.razonSocial}
            <br />
            <strong>Monto:</strong>{" "}
            {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
              dialogFactura.orden?.cotizacionProveedor?.montoTotal || 0,
            )}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de Factura *"
                value={datosFactura.nroFactura}
                onChange={(e) => setDatosFactura((prev) => ({ ...prev, nroFactura: e.target.value }))}
                placeholder="Ej: 001-001-0000123"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha de Emisión *"
                type="date"
                value={datosFactura.fechaEmision}
                onChange={(e) => setDatosFactura((prev) => ({ ...prev, fechaEmision: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={datosFactura.esContado}
                    onChange={(e) => {
                      const esContado = e.target.checked
                      setDatosFactura((prev) => ({
                        ...prev,
                        esContado,
                        // Calcular fecha de vencimiento si cambia a crédito
                        fechaVencimiento: !esContado
                          ? new Date(Date.now() + prev.plazoPago * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
                          : "",
                      }))
                    }}
                  />
                }
                label={datosFactura.esContado ? "Factura al Contado" : "Factura a Crédito"}
              />
            </Grid>

            {datosFactura.esContado ? (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Método de Pago *</InputLabel>
                    <Select
                      value={datosFactura.idMetodoPago}
                      onChange={(e) => setDatosFactura((prev) => ({ ...prev, idMetodoPago: e.target.value }))}
                      label="Método de Pago *"
                    >
                      {metodosPago.map((metodo) => (
                        <MenuItem key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                          {metodo.descMetodoPago}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Comprobante de Pago"
                    value={datosFactura.comprobantePago}
                    onChange={(e) => setDatosFactura((prev) => ({ ...prev, comprobantePago: e.target.value }))}
                    placeholder="Número de cheque, transferencia, etc."
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Plazo de Pago (días) *"
                    type="number"
                    value={datosFactura.plazoPago}
                    onChange={(e) => {
                      const plazo = Number.parseInt(e.target.value) || 30
                      const fechaVenc = new Date(Date.now() + plazo * 24 * 60 * 60 * 1000)
                      setDatosFactura((prev) => ({
                        ...prev,
                        plazoPago: plazo,
                        fechaVencimiento: fechaVenc.toISOString().split("T")[0],
                      }))
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Vencimiento *"
                    type="date"
                    value={datosFactura.fechaVencimiento}
                    onChange={(e) => setDatosFactura((prev) => ({ ...prev, fechaVencimiento: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                multiline
                rows={3}
                value={datosFactura.observacion}
                onChange={(e) => setDatosFactura((prev) => ({ ...prev, observacion: e.target.value }))}
                placeholder="Observaciones adicionales sobre la factura..."
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            {datosFactura.esContado
              ? "✅ La factura se registrará como pagada inmediatamente."
              : "📋 Se creará una cuenta por pagar que podrá gestionar en Finanzas > Cuentas por Pagar."}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogFactura({ open: false, orden: null })
              resetFormularioFactura()
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardarFactura}
            variant="contained"
            disabled={
              !datosFactura.nroFactura ||
              !datosFactura.fechaEmision ||
              (datosFactura.esContado && !datosFactura.idMetodoPago) ||
              (!datosFactura.esContado && (!datosFactura.fechaVencimiento || !datosFactura.plazoPago))
            }
          >
            Registrar Factura
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo recepción de items */}
      <Dialog
        open={dialogRecepcion.open}
        onClose={() => setDialogRecepcion({ open: false, orden: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Recepcionar Items Parcialmente</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Esta funcionalidad permite recepcionar cantidades específicas de materias primas.
          </Typography>
          <Button
            component={Link}
            href={`/ordenes-compra/${dialogRecepcion.orden?.idOrdenCompra}`}
            variant="contained"
            fullWidth
          >
            Ir a Detalles de la Orden para Recepcionar
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRecepcion({ open: false, orden: null })}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
