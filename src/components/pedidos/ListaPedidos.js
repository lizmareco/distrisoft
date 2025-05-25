"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Pagination,
  InputAdornment,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import SearchIcon from "@mui/icons-material/Search"
import FilterListIcon from "@mui/icons-material/FilterList"
import ClearIcon from "@mui/icons-material/Clear"

export default function ListaPedidos() {
  const router = useRouter()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [pedidoAEliminar, setPedidoAEliminar] = useState(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    cliente: "",
    estado: "",
    fechaDesde: "",
    fechaHasta: "",
    busquedaCliente: "", // Para buscar cliente por texto
  })
  const [clientesBusqueda, setClientesBusqueda] = useState([])
  const [estados, setEstados] = useState([])
  const [cargandoClientes, setCargandoClientes] = useState(false)
  const [cargandoEstados, setCargandoEstados] = useState(false)
  const [filtrosAplicados, setFiltrosAplicados] = useState(false)

  // Estados para paginación
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    totalPaginas: 1,
    totalRegistros: 0,
    registrosPorPagina: 50,
  })

  // Estados para diálogos de cambio de estado
  const [dialogoCambiarEstado, setDialogoCambiarEstado] = useState(false)
  const [pedidoACambiar, setPedidoACambiar] = useState(null)
  const [dialogoCancelar, setDialogoCancelar] = useState(false)
  const [pedidoACancelar, setPedidoACancelar] = useState(null)

  // Cargar estados al inicializar
  useEffect(() => {
    const cargarEstados = async () => {
      setCargandoEstados(true)
      try {
        const estadosPredefinidos = [
          { id: 1, nombre: "Pendiente" },
          { id: 2, nombre: "En Proceso" },
          { id: 3, nombre: "Listo para Entrega" },
          { id: 4, nombre: "Enviado" },
          { id: 5, nombre: "Entregado" },
          { id: 6, nombre: "Cancelado" },
        ]
        setEstados(estadosPredefinidos)
      } catch (error) {
        console.error("Error al cargar estados:", error)
      } finally {
        setCargandoEstados(false)
      }
    }

    cargarEstados()
  }, [])

  // Buscar clientes cuando cambia el texto de búsqueda
  useEffect(() => {
    const buscarClientes = async () => {
      if (!filtros.busquedaCliente || filtros.busquedaCliente.length < 2) {
        setClientesBusqueda([])
        return
      }

      setCargandoClientes(true)
      try {
        const respuesta = await fetch(`/api/clientes/buscar?query=${encodeURIComponent(filtros.busquedaCliente)}`)
        if (respuesta.ok) {
          const datos = await respuesta.json()
          setClientesBusqueda(Array.isArray(datos) ? datos : [])
        }
      } catch (error) {
        console.error("Error al buscar clientes:", error)
      } finally {
        setCargandoClientes(false)
      }
    }

    const timeoutId = setTimeout(buscarClientes, 300) // Debounce de 300ms
    return () => clearTimeout(timeoutId)
  }, [filtros.busquedaCliente])

  // Función para cancelar pedido (cambiar a estado 6)
  const confirmarCancelarPedido = (pedido) => {
    setPedidoACancelar(pedido)
    setDialogoCancelar(true)
  }

  const cancelarPedido = async () => {
    if (!pedidoACancelar) return

    try {
      const respuesta = await fetch(`/api/pedidos/${pedidoACancelar.idPedido}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nuevoEstado: 6, // Cancelado
        }),
      })

      if (!respuesta.ok) {
        const errorData = await respuesta.json()
        setSnackbar({
          abierto: true,
          mensaje: errorData.error || "Error al cancelar pedido",
          tipo: "error",
        })
        return
      }

      // Actualizar el pedido en la lista
      setPedidos(
        pedidos.map((p) =>
          p.idPedido === pedidoACancelar.idPedido
            ? { ...p, estadoPedido: { idEstadoPedido: 6, descEstadoPedido: "Cancelado" } }
            : p,
        ),
      )

      setSnackbar({
        abierto: true,
        mensaje: "Pedido cancelado exitosamente",
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al cancelar pedido",
        tipo: "error",
      })
    } finally {
      setDialogoCancelar(false)
      setPedidoACancelar(null)
    }
  }

  // Función para cambiar estado de pedido
  const confirmarCambiarEstado = (pedido) => {
    setPedidoACambiar(pedido)
    setDialogoCambiarEstado(true)
  }

  const cambiarEstadoPedido = async (nuevoEstado) => {
    if (!pedidoACambiar) return

    try {
      const respuesta = await fetch(`/api/pedidos/${pedidoACambiar.idPedido}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nuevoEstado,
        }),
      })

      if (!respuesta.ok) {
        const errorData = await respuesta.json()
        setSnackbar({
          abierto: true,
          mensaje: errorData.error || "Error al cambiar estado",
          tipo: "error",
        })
        return
      }

      // Mapear ID de estado a descripción
      const estadosMap = {
        4: "Enviado",
        5: "Entregado",
      }

      // Actualizar el pedido en la lista
      setPedidos(
        pedidos.map((p) =>
          p.idPedido === pedidoACambiar.idPedido
            ? { ...p, estadoPedido: { idEstadoPedido: nuevoEstado, descEstadoPedido: estadosMap[nuevoEstado] } }
            : p,
        ),
      )

      setSnackbar({
        abierto: true,
        mensaje: `Estado cambiado a ${estadosMap[nuevoEstado]} exitosamente`,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al cambiar estado",
        tipo: "error",
      })
    } finally {
      setDialogoCambiarEstado(false)
      setPedidoACambiar(null)
    }
  }

  // Función para obtener opciones de estado según el estado actual
  const getOpcionesEstado = (estadoActual) => {
    const idEstado = estadoActual?.idEstadoPedido

    switch (idEstado) {
      case 3: // Listo para Entrega
        return [
          { id: 4, nombre: "Enviado" },
          { id: 5, nombre: "Entregado" },
        ]
      case 4: // Enviado
        return [{ id: 5, nombre: "Entregado" }]
      default:
        return []
    }
  }

  // Función para renderizar botones de acción según el estado
  const renderBotonesAccion = (pedido) => {
    const idEstado = pedido.estadoPedido?.idEstadoPedido

    return (
      <Box sx={{ display: "flex", gap: 1 }}>
        {/* Botón Ver detalles - siempre habilitado */}
        <IconButton color="info" onClick={() => irAVerPedido(pedido.idPedido)} title="Ver detalles">
          <VisibilityIcon />
        </IconButton>

        {/* Botón Eliminar - solo si está pendiente */}
        {idEstado === 1 && (
          <Tooltip title="Eliminar pedido">
            <IconButton color="error" onClick={() => confirmarEliminar(pedido)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Botón Cancelar - solo si está pendiente */}
        {idEstado === 1 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => confirmarCancelarPedido(pedido)}
            sx={{ minWidth: "auto", px: 1 }}
          >
            CANCELAR
          </Button>
        )}

        {/* Botón Cambiar Estado - para estados 3 y 4 */}
        {(idEstado === 3 || idEstado === 4) && (
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => confirmarCambiarEstado(pedido)}
            sx={{ minWidth: "auto", px: 1 }}
          >
            CAMBIAR ESTADO
          </Button>
        )}
      </Box>
    )
  }

  // Función para verificar si un pedido está en estado pendiente
  const esPedidoPendiente = (pedido) => {
    if (!pedido || !pedido.estadoPedido) return false
    const idEstado = pedido.estadoPedido.idEstadoPedido
    return idEstado === 1 || idEstado === "1"
  }

  // Manejar cambios en los filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))

    // Si se selecciona un cliente del dropdown, limpiar la búsqueda
    if (campo === "cliente" && valor) {
      setFiltros((prev) => ({
        ...prev,
        busquedaCliente: "",
      }))
      setClientesBusqueda([])
    }
  }

  // Aplicar filtros y buscar pedidos
  const aplicarFiltros = async (nuevaPagina = 1) => {
    // Validar que al menos un filtro esté seleccionado
    const tieneAlgunFiltro = filtros.cliente || filtros.estado || filtros.fechaDesde || filtros.fechaHasta

    if (!tieneAlgunFiltro) {
      setSnackbar({
        abierto: true,
        mensaje: "Debe seleccionar al menos un filtro para buscar pedidos",
        tipo: "warning",
      })
      return
    }

    setCargando(true)
    setError(null)

    try {
      // Construir parámetros de consulta
      const params = new URLSearchParams()

      if (filtros.cliente) params.append("cliente", filtros.cliente)
      if (filtros.estado) params.append("estado", filtros.estado)
      if (filtros.fechaDesde) params.append("fechaDesde", filtros.fechaDesde)
      if (filtros.fechaHasta) params.append("fechaHasta", filtros.fechaHasta)

      // Parámetros de paginación
      params.append("pagina", nuevaPagina.toString())
      params.append("limite", paginacion.registrosPorPagina.toString())

      console.log("Enviando parámetros:", params.toString()) // Para depuración

      const respuesta = await fetch(`/api/pedidos/buscar?${params.toString()}`)

      if (!respuesta.ok) {
        throw new Error(`Error al cargar pedidos: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Datos recibidos en aplicarFiltros:", datos) // Para depuración

      setPedidos(datos.pedidos || [])
      setPaginacion({
        ...paginacion,
        pagina: nuevaPagina,
        totalPaginas: datos.totalPaginas || 1,
        totalRegistros: datos.totalRegistros || 0,
      })
      setFiltrosAplicados(true)

      setSnackbar({
        abierto: true,
        mensaje: `Se encontraron ${datos.totalRegistros || 0} pedidos`,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo más tarde.")
      setSnackbar({
        abierto: true,
        mensaje: "Error al buscar pedidos",
        tipo: "error",
      })
    } finally {
      setCargando(false)
    }
  }

  // Mostrar todos los pedidos
  const mostrarTodos = async (nuevaPagina = 1) => {
    setCargando(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append("pagina", nuevaPagina.toString())
      params.append("limite", paginacion.registrosPorPagina.toString())

      // Cambiar esta línea para usar la API de búsqueda sin filtros
      const respuesta = await fetch(`/api/pedidos/buscar?${params.toString()}`)

      if (!respuesta.ok) {
        throw new Error(`Error al cargar pedidos: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Datos recibidos en mostrarTodos:", datos) // Para depuración

      setPedidos(datos.pedidos || [])
      setPaginacion({
        ...paginacion,
        pagina: nuevaPagina,
        totalPaginas: datos.totalPaginas || 1,
        totalRegistros: datos.totalRegistros || 0,
      })
      setFiltrosAplicados(true)

      setSnackbar({
        abierto: true,
        mensaje: `Se cargaron ${datos.totalRegistros || 0} pedidos`,
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setError("No se pudieron cargar los pedidos. Por favor, intenta de nuevo más tarde.")
    } finally {
      setCargando(false)
    }
  }

  // Manejar cambio de página
  const handleCambioPagina = (event, nuevaPagina) => {
    if (Object.values(filtros).some((valor) => valor !== "")) {
      aplicarFiltros(nuevaPagina)
    } else {
      mostrarTodos(nuevaPagina)
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      cliente: "",
      estado: "",
      fechaDesde: "",
      fechaHasta: "",
      busquedaCliente: "",
    })
    setClientesBusqueda([])
    setPedidos([])
    setFiltrosAplicados(false)
    setError(null)
    setPaginacion({
      ...paginacion,
      pagina: 1,
      totalPaginas: 1,
      totalRegistros: 0,
    })
  }

  // Navegar a la página de crear pedido
  const irACrearPedido = () => {
    router.push("/pedidos/nuevo")
  }

  // Navegar a la página de ver pedido
  const irAVerPedido = (id) => {
    router.push(`/pedidos/${id}`)
  }

  // Abrir diálogo de confirmación para eliminar (solo si está pendiente)
  const confirmarEliminar = (pedido) => {
    if (!esPedidoPendiente(pedido)) {
      setSnackbar({
        abierto: true,
        mensaje: `No se puede eliminar el pedido #${pedido.idPedido} porque está en estado "${pedido.estadoPedido?.descEstadoPedido}". Solo se pueden eliminar pedidos pendientes.`,
        tipo: "warning",
      })
      return
    }

    setPedidoAEliminar(pedido)
    setDialogoAbierto(true)
  }

  // Cerrar diálogo de confirmación
  const cerrarDialogo = () => {
    setDialogoAbierto(false)
    setPedidoAEliminar(null)
  }

  // Eliminar pedido
  const eliminarPedido = async () => {
    if (!pedidoAEliminar) return

    // Verificar una vez más que el pedido esté pendiente
    if (!esPedidoPendiente(pedidoAEliminar)) {
      setSnackbar({
        abierto: true,
        mensaje: "No se puede eliminar este pedido porque ya no está en estado pendiente.",
        tipo: "error",
      })
      cerrarDialogo()
      return
    }

    try {
      const respuesta = await fetch(`/api/pedidos/${pedidoAEliminar.idPedido}`, {
        method: "DELETE",
      })

      if (!respuesta.ok) {
        throw new Error("Error al eliminar pedido")
      }

      // Actualizar la lista de pedidos
      setPedidos(pedidos.filter((p) => p.idPedido !== pedidoAEliminar.idPedido))

      // Mostrar mensaje de éxito
      setSnackbar({
        abierto: true,
        mensaje: "Pedido eliminado exitosamente",
        tipo: "success",
      })
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al eliminar pedido",
        tipo: "error",
      })
    } finally {
      cerrarDialogo()
    }
  }

  // Función para determinar el color del chip de estado
  const getEstadoColor = (estado) => {
    if (!estado) return "default"

    const nombreEstado = estado.descEstadoPedido?.toLowerCase() || ""

    if (nombreEstado.includes("pendiente")) return "warning"
    if (nombreEstado.includes("proceso")) return "info"
    if (nombreEstado.includes("completado") || nombreEstado.includes("entregado")) return "success"
    if (nombreEstado.includes("cancelado")) return "error"

    return "default"
  }

  // Formatear fecha
  const formatearFecha = (fechaStr) => {
    try {
      if (!fechaStr) return "No definida"

      if (typeof fechaStr === "string" && fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [año, mes, dia] = fechaStr.split("-")
        return `${dia}/${mes}/${año}`
      }

      const regex = /(\d{4})-(\d{2})-(\d{2})/
      const match = String(fechaStr).match(regex)

      if (match) {
        const año = match[1]
        const mes = match[2]
        const dia = match[3]
        return `${dia}/${mes}/${año}`
      }

      return String(fechaStr)
    } catch (error) {
      console.error("Error al formatear fecha:", error, fechaStr)
      return String(fechaStr)
    }
  }

  // Formatear nombre del cliente
  const formatearNombreCliente = (cliente) => {
    if (!cliente) return ""
    if (cliente.persona) {
      return `${cliente.persona.nombre || ""} ${cliente.persona.apellido || ""}`.trim()
    }
    if (cliente.empresa) {
      return cliente.empresa.razonSocial || `Cliente #${cliente.idCliente}`
    }
    return `Cliente #${cliente.idCliente}`
  }

  // Cerrar snackbar
  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  return (
    <>
      {/* Título */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontSize: "28px",
          fontWeight: 400,
          color: "#333",
          mb: 3,
          borderBottom: "1px solid #eaeaea",
          paddingBottom: "8px",
        }}
      >
        Lista Pedidos
      </Typography>

      {/* Panel de Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
            <FilterListIcon sx={{ mr: 1 }} />
            Filtros de Búsqueda
          </Typography>

          <Grid container spacing={2} alignItems="flex-end">
            {/* Búsqueda de Cliente */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Buscar Cliente"
                value={filtros.busquedaCliente}
                onChange={(e) => handleFiltroChange("busquedaCliente", e.target.value)}
                placeholder="Nombre, apellido o documento..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: cargandoClientes && (
                    <InputAdornment position="end">
                      <CircularProgress size={20} />
                    </InputAdornment>
                  ),
                }}
              />
              {/* Dropdown de clientes encontrados */}
              {clientesBusqueda.length > 0 && (
                <Paper
                  sx={{ position: "absolute", zIndex: 1000, maxHeight: 200, overflow: "auto", mt: 1, width: "100%" }}
                >
                  {clientesBusqueda.map((cliente) => (
                    <Box
                      key={cliente.idCliente}
                      sx={{
                        p: 1,
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "grey.100" },
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={() => {
                        handleFiltroChange("cliente", cliente.idCliente)
                        handleFiltroChange("busquedaCliente", formatearNombreCliente(cliente))
                        setClientesBusqueda([])
                      }}
                    >
                      <Typography variant="body2">
                        {formatearNombreCliente(cliente)}
                        {cliente.persona?.nroDocumento && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            ({cliente.persona.nroDocumento})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}
            </Grid>

            {/* Filtro por Estado */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange("estado", e.target.value)}
                  label="Estado"
                  disabled={cargandoEstados}
                >
                  <MenuItem value="">Todos los estados</MenuItem>
                  {estados.map((estado) => (
                    <MenuItem key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtro por Fecha Desde */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Desde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange("fechaDesde", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Filtro por Fecha Hasta */}
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Fecha Hasta"
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange("fechaHasta", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Botones de Acción */}
            <Grid item xs={12} md={2}>
              <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => aplicarFiltros(1)}
                  disabled={cargando}
                  startIcon={cargando ? <CircularProgress size={20} /> : <SearchIcon />}
                  fullWidth
                  size="small"
                >
                  {cargando ? "Buscando..." : "Buscar"}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => mostrarTodos(1)}
                  disabled={cargando}
                  fullWidth
                  size="small"
                >
                  Mostrar Todos
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Botones adicionales */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
            <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={limpiarFiltros} size="small">
              Limpiar Filtros
            </Button>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={irACrearPedido}>
              Nuevo Pedido
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Información de paginación */}
      {filtrosAplicados && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {pedidos.length} de {paginacion.totalRegistros} pedidos
            {paginacion.totalPaginas > 1 && ` (Página ${paginacion.pagina} de ${paginacion.totalPaginas})`}
          </Typography>
          {paginacion.totalPaginas > 1 && (
            <Pagination
              count={paginacion.totalPaginas}
              page={paginacion.pagina}
              onChange={handleCambioPagina}
              color="primary"
              size="small"
            />
          )}
        </Box>
      )}

      {/* Mensaje de estado */}
      {!filtrosAplicados && !cargando && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center">
              Seleccione los filtros y haga clic en "Buscar" para ver los pedidos, o "Mostrar Todos" para ver todos los
              pedidos.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Pedidos */}
      {(filtrosAplicados || cargando) && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Fecha Pedido</TableCell>
                <TableCell>Fecha Entrega</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Observación</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cargando ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="error">{error}</Typography>
                  </TableCell>
                </TableRow>
              ) : pedidos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No se encontraron pedidos con los filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                pedidos.map((pedido) => (
                  <TableRow key={pedido.idPedido}>
                    <TableCell>{pedido.idPedido}</TableCell>
                    <TableCell>{formatearFecha(pedido.fechaPedido)}</TableCell>
                    <TableCell>{formatearFecha(pedido.fechaEntrega)}</TableCell>
                    <TableCell>
                      {pedido.cliente ? (
                        formatearNombreCliente(pedido.cliente)
                      ) : (
                        <Typography variant="caption" color="error">
                          Sin asignar
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pedido.estadoPedido?.descEstadoPedido || "Desconocido"}
                        color={getEstadoColor(pedido.estadoPedido)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {pedido.observacion ? (
                        <Tooltip title={pedido.observacion}>
                          <Typography noWrap sx={{ maxWidth: 150 }}>
                            {pedido.observacion}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin observaciones
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}</TableCell>
                    <TableCell>{renderBotonesAccion(pedido)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Paginación inferior */}
      {filtrosAplicados && paginacion.totalPaginas > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={paginacion.totalPaginas}
            page={paginacion.pagina}
            onChange={handleCambioPagina}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Diálogos existentes */}
      <Dialog open={dialogoAbierto} onClose={cerrarDialogo}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar el pedido #{pedidoAEliminar?.idPedido}? Esta acción no se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialogo} color="primary">
            Cancelar
          </Button>
          <Button onClick={eliminarPedido} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogoCancelar} onClose={() => setDialogoCancelar(false)}>
        <DialogTitle>Confirmar cancelación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas cancelar el pedido #{pedidoACancelar?.idPedido}? Esta acción cambiará el estado
            a "Cancelado".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoCancelar(false)} color="primary">
            No, mantener
          </Button>
          <Button onClick={cancelarPedido} color="error">
            Sí, cancelar pedido
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogoCambiarEstado} onClose={() => setDialogoCambiarEstado(false)}>
        <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Pedido #{pedidoACambiar?.idPedido} - Estado actual: {pedidoACambiar?.estadoPedido?.descEstadoPedido}
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>Seleccione el nuevo estado:</DialogContentText>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {pedidoACambiar &&
              getOpcionesEstado(pedidoACambiar.estadoPedido).map((opcion) => (
                <Button
                  key={opcion.id}
                  variant="outlined"
                  onClick={() => cambiarEstadoPedido(opcion.id)}
                  sx={{ justifyContent: "flex-start" }}
                >
                  {opcion.nombre}
                </Button>
              ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoCambiarEstado(false)} color="primary">
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </>
  )
}
