"use client"

import React, { useState, useEffect } from "react"
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
  Checkbox,
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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  UnfoldMore as UnfoldMoreIcon,
  UnfoldLess as UnfoldLessIcon,
} from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowBack } from "@mui/icons-material"
import { useRootContext } from "@/src/app/context/root"
import VisorFacturaProveedor from "@/src/components/facturas/VisorFacturaProveedor"
import FacturasOrdenCompra from "@/src/components/facturas/FacturasOrdenCompra"

export default function OrdenesCompraPage() {
  console.log("Renderizando OrdenesCompraPage");
  const [ordenesCompra, setOrdenesCompra] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalOrdenes, setTotalOrdenes] = useState(0)
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
  console.log("Context:", context);
  const permisos = context.session?.permisos || []
  console.log("Permisos:", permisos);
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_ORDENCOMPRA") || context.session?.isAdmin
  console.log("Has Permission:", hasPermission);

  // Estados para diálogos y acciones
  const [dialogEstado, setDialogEstado] = useState({ open: false, orden: null })
  const [dialogEliminar, setDialogEliminar] = useState({ open: false, orden: null })
  const [dialogFactura, setDialogFactura] = useState({ open: false, orden: null })
  const [dialogRecepcion, setDialogRecepcion] = useState({ open: false, orden: null })
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" })
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedOrden, setSelectedOrden] = useState(null)

  // Estados para el acordeón de detalles
  const [expandedOrden, setExpandedOrden] = useState(null)
  const [expandAll, setExpandAll] = useState(false)

  // Estados para el visor de facturas
  const [visorFactura, setVisorFactura] = useState({ open: false, facturaId: null })

  // Estados para formularios
  const [nuevoEstado, setNuevoEstado] = useState("")
  const [itemsRecepcion, setItemsRecepcion] = useState([])
  const [openRecepcionDialog, setOpenRecepcionDialog] = useState(false)
  const [ordenParaRecepcion, setOrdenParaRecepcion] = useState(null)

  const [mostrarOrdenes, setMostrarOrdenes] = useState(false)

  // Después de la línea donde defines otros estados, agregar:
  const [facturasExistentes, setFacturasExistentes] = useState(new Set())

  // Agregar estado para el diálogo de facturas
  const [dialogFacturas, setDialogFacturas] = useState({ open: false, orden: null })

  // Agregar estado para controlar si el diálogo de factura se abrió automáticamente
  const [facturaAbiertaAutomaticamente, setFacturaAbiertaAutomaticamente] = useState(false)

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (hasPermission) {
      fetchMetodosPago()
    }
  }, [hasPermission])

  // Cargar órdenes de compra
  const fetchOrdenesCompra = async (overrideMostrarTodas = null) => {
    try {
      setLoading(true)
      setError(null)
      setMostrarOrdenes(true)

      let url = "/api/ordenes-compra?"

      // Agregar parámetros de paginación
      url += `page=${page}&limit=${rowsPerPage}&`

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

      // Usar overrideMostrarTodas si está presente, de lo contrario, usar el estado actual
      const actualMostrarTodas = overrideMostrarTodas !== null ? overrideMostrarTodas : mostrarTodas;
      url += `mostrarTodas=${actualMostrarTodas}&`

      console.log("Fetching URL:", url)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Error al cargar órdenes de compra")
      }

      const data = await response.json()
      console.log("Respuesta del servidor:", data)
      
      // Si el backend envía un mensaje de error explícito (ej. por falta de permisos/filtros necesarios)
      if (data.error || data.mensaje) { // Se incluye data.error por si el backend envía el error así
        setError(data.error || data.mensaje)
        setOrdenesCompra([])
        setTotalOrdenes(0)
      } else {
        setOrdenesCompra(data.ordenes || [])
        setTotalOrdenes(data.total || 0)
        await verificarFacturasExistentes(data.ordenes || [])
      }
    } catch (error) {
      console.error("Error:", error)
      setError("Error de red o servidor: " + error.message)
      setOrdenesCompra([])
      setTotalOrdenes(0)
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

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
    fetchOrdenesCompra()
  }

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
    fetchOrdenesCompra()
  }

  // Manejar búsqueda (aplicar filtros)
  const handleSearch = (event) => {
    event.preventDefault()
    setMostrarTodas(false) // Asegurarse de que 'mostrarTodas' sea falso al aplicar filtros
    setPage(0)
    setMostrarOrdenes(true)
    fetchOrdenesCompra(false) // Pasar false para overrideMostrarTodas
  }

  // Manejar limpieza de filtros
  const handleClearFilters = () => {
    setIdCotizacion("")
    setIdOrdenCompra("")
    setIdProveedor("")
    setEstado("")
    setMostrarTodas(false) // Asegurarse de que 'mostrarTodas' sea falso al limpiar filtros
    setPage(0)
    setMostrarOrdenes(false)
    setOrdenesCompra([])
    setTotalOrdenes(0)
    setError(null)
  }

  // Manejar el clic en el botón "Listar todas las órdenes"
  const handleListarTodas = () => {
    setIdCotizacion("")
    setIdOrdenCompra("")
    setIdProveedor("")
    setEstado("")
    setMostrarTodas(true) // Actualiza el estado
    setPage(0)
    setMostrarOrdenes(true)
    fetchOrdenesCompra(true) // Pasar true para overrideMostrarTodas
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
      // Detectar si el estado anterior es ENVIADO y el nuevo es PARCIALMENTE RECIBIDO
      const estadoAnterior = dialogEstado.orden?.estadoOrdenCompra?.descEstadoOrdenCompra
      const esCambioAParcialmenteRecibido =
        estadoAnterior?.toLowerCase() === "enviado" && nuevoEstado === "PARCIALMENTE RECIBIDO"

      // Detectar si el cambio es a RECIBIDO
      const esCambioARecibido = nuevoEstado === "RECIBIDO"

      if (esCambioAParcialmenteRecibido) {
        // Inicializar items para recepción parcial
        const detalles = dialogEstado.orden?.cotizacionProveedor?.detallesCotizacionProv || []
        const items = detalles.map((detalle) => ({
          idMateriaPrima: detalle.idMateriaPrima,
          nombreMateriaPrima: detalle.materiaPrima?.nombreMateriaPrima || "N/A",
          cantidadTotal: detalle.cantidad,
          cantidad: 0,
          seleccionado: false,
          unidadMedida: detalle.unidadMedida || "Unidad",
        }))
        setItemsRecepcion(items)
        setOrdenParaRecepcion(dialogEstado.orden)
        setDialogEstado({ open: false, orden: null })
        setOpenRecepcionDialog(true)
        return
      }

      // Si es cambio a RECIBIDO, primero cambiar el estado y luego abrir factura
      if (esCambioARecibido) {
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
          message: "Estado actualizado a RECIBIDO. Ahora debe registrar la factura del proveedor.",
          severity: "success",
        })

        setDialogEstado({ open: false, orden: null })
        setNuevoEstado("")
        
        // Marcar que la factura se abrirá automáticamente
        setFacturaAbiertaAutomaticamente(true)
        
        // Abrir automáticamente el diálogo de factura
        setTimeout(() => {
          setDialogFactura({ open: true, orden: dialogEstado.orden })
        }, 500) // Pequeño delay para que se cierre el diálogo de estado primero
        
        fetchOrdenesCompra()
        return
      }

      // Si no es cambio a parcialmente recibido ni a recibido, proceder normalmente
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

  // Manejar cambio en checkbox de item de recepción parcial
  const handleItemCheckChange = (index, checked) => {
    const newItems = [...itemsRecepcion]
    newItems[index].seleccionado = checked
    if (!checked) {
      newItems[index].cantidad = 0
    }
    setItemsRecepcion(newItems)
  }

  // Manejar cambio en cantidad de item de recepción parcial
  const handleItemCantidadChange = (index, cantidad) => {
    const newItems = [...itemsRecepcion]
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
      // Filtrar solo los items seleccionados con cantidad > 0
      const itemsSeleccionados = itemsRecepcion
        .filter((item) => item.seleccionado && item.cantidad > 0)
        .map((item) => ({
          idMateriaPrima: item.idMateriaPrima,
          cantidad: item.cantidad,
          unidadMedida: item.unidadMedida,
        }))

      if (itemsSeleccionados.length === 0) {
        setSnackbar({
          open: true,
          message: "Debe seleccionar al menos un ítem con cantidad mayor a cero",
          severity: "error",
        })
        return
      }

      const response = await fetch(`/api/ordenes-compra/${ordenParaRecepcion.idOrdenCompra}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idEstadoOrdenCompra: getEstadoId("PARCIALMENTE RECIBIDO"),
          recepcionItems: itemsSeleccionados,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al registrar recepción parcial")
      }

      setSnackbar({
        open: true,
        message: "Recepción parcial registrada exitosamente",
        severity: "success",
      })
      setOpenRecepcionDialog(false)
      setOrdenParaRecepcion(null)
      setItemsRecepcion([])
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
      setFacturaAbiertaAutomaticamente(false) // Resetear el estado
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

    const todosLosEstados = estados;

    switch (estadoActual?.toLowerCase()) {
      case "pendiente":
        return todosLosEstados.filter(e => ["ENVIADO", "ANULADO"].includes(e.id));
      case "enviado":
        return todosLosEstados.filter(e => ["RECIBIDO", "PARCIALMENTE RECIBIDO", "ANULADO"].includes(e.id));
      case "parcialmente recibido":
        return todosLosEstados.filter(e => ["RECIBIDO", "ANULADO"].includes(e.id));
      default:
        return [];
    }
  };

  // Reemplazar la función puedeGuardarFactura existente con:
  const puedeGuardarFactura = (orden) => {
    if (!orden || !orden.estadoOrdenCompra) return false
    const esRecibido = orden.estadoOrdenCompra?.descEstadoOrdenCompra?.toLowerCase() === "recibido"
    const tieneFactura = facturasExistentes.has(orden.idOrdenCompra)
    return esRecibido && !tieneFactura
  }

  const tieneFacturaGuardada = (orden) => {
    if (!orden) return false
    
    // Verificar si tiene factura asociada directamente
    // facturaProveedor es un array, tomamos la primera factura si existe
    const tieneFactura = orden.facturaProveedor && 
                        Array.isArray(orden.facturaProveedor) && 
                        orden.facturaProveedor.length > 0 && 
                        orden.facturaProveedor[0].idFacturaProveedor
    
    return tieneFactura
  }

  const puedeVerFactura = (orden) => {
    if (!orden) return false
    
    // Puede ver factura si tiene factura asociada, sin importar el estado
    // facturaProveedor es un array, tomamos la primera factura si existe
    const tieneFactura = orden.facturaProveedor && 
                        Array.isArray(orden.facturaProveedor) && 
                        orden.facturaProveedor.length > 0 && 
                        orden.facturaProveedor[0].idFacturaProveedor
    
    return tieneFactura
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

  // Funciones para manejar el acordeón
  const handleExpandOrden = (ordenId) => {
    setExpandedOrden(expandedOrden === ordenId ? null : ordenId)
  }

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedOrden(null)
      setExpandAll(false)
    } else {
      // Expandir la primera orden si existe
      const primeraOrden = ordenesCompra[0]
      if (primeraOrden) {
        setExpandedOrden(primeraOrden.idOrdenCompra)
        setExpandAll(true)
      }
    }
  }

  const isOrdenExpanded = (ordenId) => {
    return expandedOrden === ordenId
  }

  const handleVerFactura = (orden) => {
    if (orden.facturaProveedor && 
        Array.isArray(orden.facturaProveedor) && 
        orden.facturaProveedor.length > 0 && 
        orden.facturaProveedor[0].idFacturaProveedor) {
      setVisorFactura({ open: true, facturaId: orden.facturaProveedor[0].idFacturaProveedor })
      handleMenuClose()
    }
  }

  const handleVerFacturas = (orden) => {
    setDialogFacturas({ open: true, orden: orden })
    handleMenuClose()
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
          href="/finanzas"
          variant="contained"
          color="primary"
          startIcon={<ReceiptIcon />}
        >
          IR A FINANZAS
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
                <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={handleListarTodas}>
                  Listar Todas Las Órdenes
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchOrdenesCompra}>
                  Actualizar
                </Button>
                {(idCotizacion || idOrdenCompra || idProveedor || estado || mostrarTodas) && (
                  <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClearFilters} color="error">
                    Limpiar Filtros
                  </Button>
                )}
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
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Órdenes de Compra</Typography>
                <Button
                  variant="outlined"
                  startIcon={expandAll ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                  onClick={handleExpandAll}
                  size="small"
                >
                  {expandAll ? 'Contraer Todo' : 'Expandir Primero'}
                </Button>
              </Box>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Alert severity="error">{error}</Alert>
                        </TableCell>
                      </TableRow>
                    ) : ordenesCompra.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ py: 2 }}>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No se encontraron órdenes de compra
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {mostrarTodas === true ? (
                                 "No hay órdenes de compra en el sistema. Puedes crear una nueva orden."
                              ) : (!idCotizacion && !idOrdenCompra && !idProveedor && !estado) ? (
                                "Utiliza los filtros de búsqueda para encontrar órdenes específicas."
                              ) : (
                                "No hay órdenes que coincidan con los filtros seleccionados. Intenta con otros criterios de búsqueda."
                              )}
                            </Typography>
                            {mostrarTodas && (
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<AddIcon />}
                                component={Link}
                                href="/ordenes-compra/nueva"
                                sx={{ mt: 2 }}
                              >
                                Crear Nueva Orden de Compra
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      ordenesCompra.map((orden) => (
                        <React.Fragment key={orden.idOrdenCompra}>
                          <TableRow hover>
                            <TableCell>{orden.idOrdenCompra}</TableCell>
                            <TableCell>{format(new Date(orden.fechaOrden), "dd/MM/yyyy", { locale: es })}</TableCell>
                            <TableCell>{orden.cotizacionProveedor?.proveedor?.empresa?.razonSocial || "N/A"}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={orden.estadoOrdenCompra?.descEstadoOrdenCompra || "Pendiente"}
                                  color={getEstadoChipColor(orden.estadoOrdenCompra?.descEstadoOrdenCompra)}
                                  size="small"
                                />
                                {tieneFacturaGuardada(orden) && (
                                  <Tooltip title="Tiene factura asociada">
                                    <ReceiptIcon color="success" fontSize="small" />
                                  </Tooltip>
                                )}
                                {orden.facturaProveedor && 
                                 Array.isArray(orden.facturaProveedor) && 
                                 orden.facturaProveedor.length > 1 && (
                                  <Tooltip title={`${orden.facturaProveedor.length} facturas asociadas`}>
                                    <Chip 
                                      label={`${orden.facturaProveedor.length} facturas`}
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                                orden.cotizacionProveedor?.montoTotal || 0,
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                                {tieneFacturaGuardada(orden) && (
                                  <Tooltip title="Ver facturas de la orden">
                                    <IconButton
                                      component={Link}
                                      href={`/ordenes-compra/${orden.idOrdenCompra}/facturas`}
                                      color="info"
                                      size="small"
                                    >
                                      <ReceiptIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                <Tooltip title="Más acciones">
                                  <IconButton size="small" onClick={(e) => handleMenuClick(e, orden)}>
                                    <MoreVertIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={isOrdenExpanded(orden.idOrdenCompra) ? "Ocultar detalles" : "Ver materias primas"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleExpandOrden(orden.idOrdenCompra)}
                                    color="primary"
                                  >
                                    {isOrdenExpanded(orden.idOrdenCompra) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                          {/* Fila expandible con detalles */}
                          {isOrdenExpanded(orden.idOrdenCompra) && (
                            <TableRow>
                              <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                <Box sx={{ bgcolor: 'grey.50', p: 2 }}>
                                  <Typography variant="h6" gutterBottom>
                                    Detalles de Materias Primas
                                  </Typography>
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Materia Prima</TableCell>
                                          <TableCell align="right">Cantidad</TableCell>
                                          <TableCell align="right">Precio Unitario</TableCell>
                                          <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {orden.cotizacionProveedor?.detallesCotizacionProv?.map((detalle, index) => (
                                          <TableRow key={index}>
                                            <TableCell>{detalle.materiaPrima?.nombreMateriaPrima || "N/A"}</TableCell>
                                            <TableCell align="right">
                                              {detalle.cantidad} {detalle.unidadMedida || "Unidad"}
                                            </TableCell>
                                            <TableCell align="right">
                                              {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                                                detalle.precioUnitario || 0
                                              )}
                                            </TableCell>
                                            <TableCell align="right">
                                              {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                                                (detalle.cantidad || 0) * (detalle.precioUnitario || 0)
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  component="div"
                  count={totalOrdenes}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  labelRowsPerPage="Filas por página"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                />
              </TableContainer>
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
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {selectedOrden && (() => {
          return [
            <MenuItem key="verDetalles" onClick={() => handleMenuClose()}>
              <ListItemIcon>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ver detalles</ListItemText>
            </MenuItem>,
            puedeVerFactura(selectedOrden) && (
              <MenuItem key="verFactura" onClick={() => handleVerFactura(selectedOrden)}>
                <ListItemIcon>
                  <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Ver Factura</ListItemText>
              </MenuItem>
            ),
            <MenuItem key="verFacturas" onClick={() => handleVerFacturas(selectedOrden)}>
              <ListItemIcon>
                <ReceiptIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Ver Facturas de la Orden</ListItemText>
            </MenuItem>,
            <MenuItem
              key="cambiarEstado"
              onClick={() => {
                setDialogEstado({ open: true, orden: selectedOrden });
                handleMenuClose();
              }}
              disabled={getEstadosDisponibles(selectedOrden?.estadoOrdenCompra?.descEstadoOrdenCompra).length === 0}
            >
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Cambiar Estado</ListItemText>
            </MenuItem>,
            puedeGuardarFactura(selectedOrden) && (
              <MenuItem key="registrarFactura" onClick={() => {
                setDialogFactura({ open: true, orden: selectedOrden });
                handleMenuClose();
              }}>
                <ListItemIcon>
                  <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Registrar factura</ListItemText>
              </MenuItem>
            ),
            puedeRecepcionar(selectedOrden) && (
              <MenuItem
                key="recepcionar"
                component={Link}
                href={`/ordenes-compra/${selectedOrden.idOrdenCompra}`}
                onClick={handleMenuClose}
              >
                <ListItemIcon>
                  <InventoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Recepcionar</ListItemText>
              </MenuItem>
            ),
          ].filter(Boolean)
        })()}
      </Menu>

      {/* Diálogo de cambio de estado */}
      <Dialog open={dialogEstado.open} onClose={() => setDialogEstado({ open: false, orden: null })}>
        <DialogTitle>Cambiar Estado</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Nuevo Estado</InputLabel>
            <Select
              value={nuevoEstado}
              onChange={(e) => {
                const valor = e.target.value;
                setNuevoEstado(valor);
                // Detectar si es PARCIALMENTE RECIBIDO y el estado anterior es ENVIADO
                const estadoAnterior = dialogEstado.orden?.estadoOrdenCompra?.descEstadoOrdenCompra;
                if (estadoAnterior?.toLowerCase() === "enviado" && valor === "PARCIALMENTE RECIBIDO") {
                  // Inicializar items para recepción parcial
                  const detalles = dialogEstado.orden?.cotizacionProveedor?.detallesCotizacionProv || [];
                  const items = detalles.map((detalle) => ({
                    idMateriaPrima: detalle.idMateriaPrima,
                    nombreMateriaPrima: detalle.materiaPrima?.nombreMateriaPrima || "N/A",
                    cantidadTotal: detalle.cantidad,
                    cantidad: 0,
                    seleccionado: false,
                    unidadMedida: detalle.unidadMedida || "Unidad",
                  }));
                  setItemsRecepcion(items);
                  setOrdenParaRecepcion(dialogEstado.orden);
                  setDialogEstado({ open: false, orden: null });
                  setTimeout(() => setOpenRecepcionDialog(true), 200); // Pequeño delay para evitar conflicto visual
                }
              }}
              label="Nuevo Estado"
            >
              {dialogEstado.orden &&
                getEstadosDisponibles(dialogEstado.orden.estadoOrdenCompra?.descEstadoOrdenCompra).map((estado) => (
                  <MenuItem key={estado.id} value={estado.nombre}>
                    {estado.nombre}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          
          {/* Mensaje informativo cuando se selecciona RECIBIDO */}
          {nuevoEstado === "RECIBIDO" && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Importante:</strong> Al cambiar el estado a RECIBIDO, automáticamente se abrirá el formulario 
              para registrar la factura del proveedor, ya que es obligatorio registrar la factura cuando se recibe 
              completamente la orden de compra.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEstado({ open: false, orden: null })}>Cancelar</Button>
          <Button onClick={handleCambiarEstado} variant="contained" color="primary" disabled={nuevoEstado === "PARCIALMENTE RECIBIDO"}>
            {nuevoEstado === "RECIBIDO" ? "Cambiar Estado y Registrar Factura" : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de eliminación */}
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

      {/* Diálogo de factura */}
      <Dialog 
        open={dialogFactura.open} 
        onClose={() => {
          // Si se abrió automáticamente, mostrar confirmación
          if (facturaAbiertaAutomaticamente) {
            if (window.confirm("¿Está seguro que desea cancelar? Es obligatorio registrar la factura para completar el proceso de recepción.")) {
              setDialogFactura({ open: false, orden: null })
              setFacturaAbiertaAutomaticamente(false)
            }
          } else {
            setDialogFactura({ open: false, orden: null })
            setFacturaAbiertaAutomaticamente(false)
          }
        }}
      >
        <DialogTitle>
          Registrar Factura
          {facturaAbiertaAutomaticamente && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <strong>Obligatorio:</strong> Debe registrar la factura del proveedor para completar el proceso de recepción.
            </Alert>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número de Factura"
                  value={datosFactura.nroFactura}
                  onChange={(e) => setDatosFactura({ ...datosFactura, nroFactura: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha de Emisión"
                  value={datosFactura.fechaEmision}
                  onChange={(e) => setDatosFactura({ ...datosFactura, fechaEmision: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select
                    value={datosFactura.idMetodoPago}
                    onChange={(e) => setDatosFactura({ ...datosFactura, idMetodoPago: e.target.value })}
                    label="Método de Pago"
                  >
                    {metodosPago.map((metodo) => (
                      <MenuItem key={metodo.idMetodoPago} value={metodo.idMetodoPago}>
                        {metodo.descMetodoPago}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={datosFactura.esContado}
                      onChange={(e) => setDatosFactura({ ...datosFactura, esContado: e.target.checked })}
                    />
                  }
                  label="Es Contado"
                />
              </Grid>
              {!datosFactura.esContado && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Plazo de Pago (días)"
                      value={datosFactura.plazoPago}
                      onChange={(e) => setDatosFactura({ ...datosFactura, plazoPago: parseInt(e.target.value) })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Fecha de Vencimiento"
                      value={datosFactura.fechaVencimiento}
                      onChange={(e) => setDatosFactura({ ...datosFactura, fechaVencimiento: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Observación"
                  value={datosFactura.observacion}
                  onChange={(e) => setDatosFactura({ ...datosFactura, observacion: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            // Si se abrió automáticamente, mostrar confirmación
            if (facturaAbiertaAutomaticamente) {
              if (window.confirm("¿Está seguro que desea cancelar? Es obligatorio registrar la factura para completar el proceso de recepción.")) {
                setDialogFactura({ open: false, orden: null })
                setFacturaAbiertaAutomaticamente(false)
              }
            } else {
              setDialogFactura({ open: false, orden: null })
              setFacturaAbiertaAutomaticamente(false)
            }
          }}>
            Cancelar
          </Button>
          <Button onClick={handleGuardarFactura} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para recepción parcial al cambiar a PARCIALMENTE RECIBIDO */}
      <Dialog open={openRecepcionDialog} onClose={() => setOpenRecepcionDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Recepción Parcial de Materias Primas</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            Seleccione las materias primas recibidas e indique la cantidad para cada una.
          </Box>
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
          <Button onClick={() => setOpenRecepcionDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmRecepcion}
            color="primary"
            variant="contained"
            disabled={!itemsRecepcion.some((item) => item.seleccionado && item.cantidad > 0)}
          >
            Confirmar Recepción
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Visor de Factura de Proveedor */}
      <VisorFacturaProveedor
        open={visorFactura.open}
        onClose={() => setVisorFactura({ open: false, facturaId: null })}
        facturaId={visorFactura.facturaId}
      />

      {/* Diálogo para mostrar facturas de la orden */}
      <Dialog 
        open={dialogFacturas.open} 
        onClose={() => setDialogFacturas({ open: false, orden: null })}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          Facturas de la Orden de Compra #{dialogFacturas.orden?.idOrdenCompra}
        </DialogTitle>
        <DialogContent>
          {dialogFacturas.orden && (
            <FacturasOrdenCompra idOrdenCompra={dialogFacturas.orden.idOrdenCompra} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogFacturas({ open: false, orden: null })}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )

  return content;
}

