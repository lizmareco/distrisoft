"use client"

import React, { useState, useEffect } from "react"
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import VisibilityIcon from "@mui/icons-material/Visibility"
import SearchIcon from "@mui/icons-material/Search"
import FilterListIcon from "@mui/icons-material/FilterList"
import ClearIcon from "@mui/icons-material/Clear"
import ReceiptIcon from "@mui/icons-material/Receipt"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"
import Link from "next/link"
import DetallePedido from "./DetallePedido"

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
    busquedaCliente: "",
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

  // Estados para diálogo de facturación
  const [dialogoFacturacion, setDialogoFacturacion] = useState(false)
  const [pedidoAFacturar, setPedidoAFacturar] = useState(null)
  const [tipoFactura, setTipoFactura] = useState("")
  const [cargandoFactura, setCargandoFactura] = useState(false)
  const [configuracionFactura, setConfiguracionFactura] = useState({
    metodoPago: 1,
    observaciones: "",
    // Campos para crédito
    diasCredito: 30,
    fechaVencimiento: "",
  })

  // Estado mejorado para tracking de facturas
  const [pedidosConFacturas, setPedidosConFacturas] = useState(new Set())
  const [cargandoFacturas, setCargandoFacturas] = useState(false)

  // Estado para el acordeón expandido
  const [pedidoExpandido, setPedidoExpandido] = useState(null)

  // Función para manejar la expansión del acordeón
  const handleExpansion = (idPedido) => {
    setPedidoExpandido(pedidoExpandido === idPedido ? null : idPedido)
  }

  // Función para expandir/contraer todos los pedidos
  const toggleAllExpansions = () => {
    if (pedidoExpandido === null) {
      // Si no hay ninguno expandido, expandir el primero
      if (pedidos.length > 0) {
        setPedidoExpandido(pedidos[0].idPedido)
      }
    } else {
      // Si hay alguno expandido, contraer todos
      setPedidoExpandido(null)
    }
  }

  // Función mejorada para verificar si un pedido ya tiene facturas
  const verificarFacturasExistentes = async (idPedido) => {
    try {
      console.log(`Verificando facturas para pedido ${idPedido}`)

      // Primero intentar con el endpoint específico del pedido
      let respuesta = await fetch(`/api/pedidos/${idPedido}/facturas`)

      if (!respuesta.ok) {
        console.warn(`Endpoint de pedido falló, intentando con facturas-clientes`)
        // Si falla, intentar con el endpoint de facturas-clientes
        respuesta = await fetch(`/api/finanzas/facturas-clientes?idPedido=${idPedido}`)
      }

      if (!respuesta.ok) {
        console.warn(`Error ${respuesta.status} al verificar facturas para pedido ${idPedido}`)
        return false
      }

      const datos = await respuesta.json()

      // Verificar diferentes formatos de respuesta
      let tieneFacturas = false
      if (datos.tieneFacturas !== undefined) {
        tieneFacturas = datos.tieneFacturas
      } else if (Array.isArray(datos) && datos.length > 0) {
        tieneFacturas = true
      } else if (datos.facturas && Array.isArray(datos.facturas) && datos.facturas.length > 0) {
        tieneFacturas = true
      }

      console.log(`Pedido ${idPedido} tiene facturas:`, tieneFacturas)
      return tieneFacturas
    } catch (error) {
      console.error(`Error al verificar facturas para pedido ${idPedido}:`, error)
      return false
    }
  }

  // Función para cargar información de facturas para los pedidos
  const cargarInfoFacturas = async (pedidosList) => {
    if (!pedidosList || pedidosList.length === 0) {
      setPedidosConFacturas(new Set())
      return
    }

    setCargandoFacturas(true)
    const pedidosConFacturasSet = new Set()

    try {
      // Procesar en lotes más pequeños para mejor rendimiento
      const batchSize = 3
      for (let i = 0; i < pedidosList.length; i += batchSize) {
        const batch = pedidosList.slice(i, i + batchSize)

        const promesas = batch.map(async (pedido) => {
          try {
            const tieneFacturas = await verificarFacturasExistentes(pedido.idPedido)
            if (tieneFacturas) {
              pedidosConFacturasSet.add(pedido.idPedido)
            }
            return { idPedido: pedido.idPedido, tieneFacturas }
          } catch (error) {
            console.error(`Error procesando pedido ${pedido.idPedido}:`, error)
            return { idPedido: pedido.idPedido, tieneFacturas: false }
          }
        })

        await Promise.all(promesas)

        // Pequeña pausa entre lotes para no sobrecargar el servidor
        if (i + batchSize < pedidosList.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      setPedidosConFacturas(pedidosConFacturasSet)
      console.log(`Cargadas facturas para ${pedidosConFacturasSet.size} de ${pedidosList.length} pedidos`)
    } catch (error) {
      console.error("Error general al cargar info de facturas:", error)
    } finally {
      setCargandoFacturas(false)
    }
  }

  // Función para refrescar el estado de facturas de un pedido específico
  const refrescarEstadoFactura = async (idPedido) => {
    try {
      const tieneFacturas = await verificarFacturasExistentes(idPedido)
      setPedidosConFacturas((prev) => {
        const nuevo = new Set(prev)
        if (tieneFacturas) {
          nuevo.add(idPedido)
        } else {
          nuevo.delete(idPedido)
        }
        return nuevo
      })
      return tieneFacturas
    } catch (error) {
      console.error(`Error al refrescar estado de factura para pedido ${idPedido}:`, error)
      return false
    }
  }

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

    const timeoutId = setTimeout(buscarClientes, 300)
    return () => clearTimeout(timeoutId)
  }, [filtros.busquedaCliente])

  // Función para abrir diálogo de facturación
  const abrirDialogoFacturacion = (pedido) => {
    setPedidoAFacturar(pedido)
    setTipoFactura("")

    // Calcular fecha de vencimiento por defecto (30 días)
    const fechaVencimiento = new Date()
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30)

    setConfiguracionFactura({
      metodoPago: 1,
      observaciones: `Factura generada desde pedido #${pedido.idPedido}`,
      diasCredito: 30,
      fechaVencimiento: fechaVencimiento.toISOString().split("T")[0],
    })
    setDialogoFacturacion(true)
  }

  // Función para generar factura
  const generarFactura = async () => {
    if (!pedidoAFacturar || !tipoFactura) {
      setSnackbar({
        abierto: true,
        mensaje: "Debe seleccionar el tipo de factura",
        tipo: "warning",
      })
      return
    }

    setCargandoFactura(true)

    try {
      const datosFactura = {
        tipo: tipoFactura,
        idCliente: pedidoAFacturar.cliente.idCliente,
        idPedido: pedidoAFacturar.idPedido,
        observacion: configuracionFactura.observaciones,
        operador: 1, // TODO: Obtener del usuario autenticado
      }

      // Agregar campos específicos según el tipo
      if (tipoFactura === "contado") {
        datosFactura.idMetodoPago = configuracionFactura.metodoPago
      } else if (tipoFactura === "credito") {
        datosFactura.plazoPago = configuracionFactura.diasCredito
        datosFactura.fechaVencimiento = configuracionFactura.fechaVencimiento
      }

      console.log("Enviando datos de factura:", datosFactura)

      const respuesta = await fetch("/api/finanzas/facturas-clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosFactura),
      })

      if (!respuesta.ok) {
        const errorData = await respuesta.json()
        throw new Error(errorData.error || "Error al generar factura")
      }

      const resultado = await respuesta.json()
      console.log("Factura generada exitosamente:", resultado)

      // Actualizar inmediatamente el estado local
      setPedidosConFacturas((prev) => new Set([...prev, pedidoAFacturar.idPedido]))

      // Refrescar el estado desde el servidor para confirmar
      setTimeout(async () => {
        await refrescarEstadoFactura(pedidoAFacturar.idPedido)
      }, 1000)

      setSnackbar({
        abierto: true,
        mensaje: `Factura ${tipoFactura} generada exitosamente. El pedido mantiene su estado actual para permitir la entrega física.`,
        tipo: "success",
      })

      // Cerrar diálogo
      setDialogoFacturacion(false)
      setPedidoAFacturar(null)
      setTipoFactura("")
    } catch (error) {
      console.error("Error al generar factura:", error)
      setSnackbar({
        abierto: true,
        mensaje: error.message || "Error al generar factura",
        tipo: "error",
      })
    } finally {
      setCargandoFactura(false)
    }
  }

  // Función para calcular fecha de vencimiento basada en días de crédito
  const calcularFechaVencimiento = (dias) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + Number.parseInt(dias))
    return fecha.toISOString().split("T")[0]
  }

  // Función para manejar cambio en días de crédito
  const handleDiasCreditoChange = (dias) => {
    const nuevaFechaVencimiento = calcularFechaVencimiento(dias)
    setConfiguracionFactura((prev) => ({
      ...prev,
      diasCredito: dias,
      fechaVencimiento: nuevaFechaVencimiento,
    }))
  }

  // Función para manejar cambios en la configuración
  const handleConfiguracionChange = (campo, valor) => {
    setConfiguracionFactura((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

  // Función para manejar cambios en los filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({
      ...prev,
      [campo]: valor,
    }))
  }

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

  // Aplicar filtros y buscar pedidos
  const aplicarFiltros = async (nuevaPagina = 1) => {
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

      const respuesta = await fetch(`/api/pedidos/buscar?${params.toString()}`)

      if (!respuesta.ok) {
        throw new Error(`Error al cargar pedidos: ${respuesta.status}`)
      }

      const datos = await respuesta.json()

      setPedidos(datos.pedidos || [])
      setPaginacion({
        ...paginacion,
        pagina: nuevaPagina,
        totalPaginas: datos.totalPaginas || 1,
        totalRegistros: datos.totalRegistros || 0,
      })
      setFiltrosAplicados(true)

      // Cargar información de facturas
      await cargarInfoFacturas(datos.pedidos || [])

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

      const respuesta = await fetch(`/api/pedidos/buscar?${params.toString()}`)

      if (!respuesta.ok) {
        throw new Error(`Error al cargar pedidos: ${respuesta.status}`)
      }

      const datos = await respuesta.json()

      setPedidos(datos.pedidos || [])
      setPaginacion({
        ...paginacion,
        pagina: nuevaPagina,
        totalPaginas: datos.totalPaginas || 1,
        totalRegistros: datos.totalRegistros || 0,
      })
      setFiltrosAplicados(true)

      // Cargar información de facturas
      await cargarInfoFacturas(datos.pedidos || [])

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

  // Función mejorada para renderizar botones de acción según el estado
  const renderBotonesAccion = (pedido) => {
    const idEstado = pedido.estadoPedido?.idEstadoPedido
    const tieneFacturas = pedidosConFacturas.has(pedido.idPedido)

    console.log(`Pedido ${pedido.idPedido}: estado=${idEstado}, tieneFacturas=${tieneFacturas}`)

    return (
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
        {/* Botón Ver detalles - siempre habilitado */}
        <IconButton color="info" onClick={() => irAVerPedido(pedido.idPedido)} title="Ver detalles">
          <VisibilityIcon />
        </IconButton>

        {/* Botón Eliminar - solo si está pendiente y no tiene facturas */}
        {idEstado === 1 && !tieneFacturas && (
          <Tooltip title="Eliminar pedido">
            <IconButton color="error" onClick={() => confirmarEliminar(pedido)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Botón Cancelar - solo si está pendiente y no tiene facturas */}
        {idEstado === 1 && !tieneFacturas && (
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

        {/* Mostrar FACTURADO si ya tiene facturas */}
        {tieneFacturas && (
          <Chip
            label="FACTURADO"
            color="success"
            size="small"
            sx={{
              fontWeight: "bold",
              backgroundColor: "#4caf50",
              color: "white",
            }}
          />
        )}

        {/* Botón Generar Factura - solo si está listo para entrega y NO tiene facturas */}
        {idEstado === 3 && !tieneFacturas && (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => abrirDialogoFacturacion(pedido)}
            startIcon={<ReceiptIcon />}
            sx={{ minWidth: "auto", px: 1 }}
          >
            FACTURAR
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

        {/* Indicador de carga de facturas */}
        {cargandoFacturas && <CircularProgress size={16} sx={{ ml: 1 }} />}
      </Box>
    )
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
    setPedidosConFacturas(new Set())
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

      // Remover del estado de facturas también
      setPedidosConFacturas((prev) => {
        const nuevo = new Set(prev)
        nuevo.delete(pedidoAEliminar.idPedido)
        return nuevo
      })

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

  // Función para verificar si un pedido está en estado pendiente
  const esPedidoPendiente = (pedido) => {
    if (!pedido || !pedido.estadoPedido) return false
    const idEstado = pedido.estadoPedido.idEstadoPedido
    return idEstado === 1 || idEstado === "1"
  }

  return (
    <>
      {/* Título con botón de finanzas */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, borderBottom: "1px solid #eaeaea", paddingBottom: "8px" }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontSize: "28px",
            fontWeight: 400,
            color: "#333",
          }}
        >
          Lista Pedidos
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          component={Link}
          href="/finanzas"
          sx={{
            backgroundColor: "#1976d2",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
          }}
        >
          IR A FINANZAS
        </Button>
      </Box>

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
              </Box>
            </Grid>
          </Grid>

          {/* Botones adicionales */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" color="secondary" onClick={() => mostrarTodos(1)} disabled={cargando} size="small">
                Mostrar Todos
              </Button>
              <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={limpiarFiltros} size="small">
                Limpiar Filtros
              </Button>
            </Box>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={irACrearPedido}>
              Nuevo Pedido
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Información de paginación */}
      {filtrosAplicados && (
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Mostrando {pedidos.length} de {paginacion.totalRegistros} pedidos
              {paginacion.totalPaginas > 1 && ` (Página ${paginacion.pagina} de ${paginacion.totalPaginas})`}
              {cargandoFacturas && " (Cargando estado de facturas...)"}
            </Typography>
            {pedidos.length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={toggleAllExpansions}
                startIcon={pedidoExpandido === null ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                sx={{ ml: 2 }}
              >
                {pedidoExpandido === null ? "Expandir Primero" : "Contraer Todo"}
              </Button>
            )}
          </Box>
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
              Use los filtros y haga clic en "Buscar" para encontrar pedidos específicos, o haga clic en "Mostrar Todos"
              para ver todos los pedidos del sistema.
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
                  <React.Fragment key={pedido.idPedido}>
                    <TableRow>
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
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          {renderBotonesAccion(pedido)}
                          <Tooltip title={pedidoExpandido === pedido.idPedido ? "Contraer detalles" : "Expandir detalles"}>
                            <IconButton
                              size="small"
                              onClick={() => handleExpansion(pedido.idPedido)}
                              sx={{ 
                                p: 0,
                                color: pedidoExpandido === pedido.idPedido ? "#1976d2" : "#666",
                                "&:hover": {
                                  color: "#1976d2",
                                  backgroundColor: "rgba(25, 118, 210, 0.04)"
                                }
                              }}
                            >
                              {pedidoExpandido === pedido.idPedido ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    {/* Fila expandible con detalles */}
                    <TableRow>
                      <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                        <Collapse in={pedidoExpandido === pedido.idPedido} timeout="auto" unmountOnExit>
                          <Box sx={{ 
                            p: 3, 
                            backgroundColor: "#fafafa", 
                            borderTop: "2px solid #e3f2fd",
                            borderLeft: "4px solid #1976d2",
                            borderRadius: "0 0 8px 8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                          }}>
                            <Typography
                              variant="h4"
                              component="h2"
                              sx={{
                                fontSize: "28px",
                                fontWeight: 400,
                                color: "#333",
                                mb: 3,
                                borderBottom: "1px solid #eaeaea",
                                paddingBottom: "8px"
                              }}
                            >
                              Detalles Pedido #{pedido.idPedido}
                            </Typography>
                            <DetallePedido id={pedido.idPedido} isEmbedded={true} />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
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

      {/* Diálogo de confirmación para eliminar */}
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

      {/* Diálogo para cancelar pedido */}
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

      {/* Diálogo para cambiar estado */}
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

      {/* Diálogo para generar factura */}
      <Dialog open={dialogoFacturacion} onClose={() => setDialogoFacturacion(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generar Factura</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>Pedido #{pedidoAFacturar?.idPedido}</strong> - Cliente:{" "}
            {pedidoAFacturar && formatearNombreCliente(pedidoAFacturar.cliente)}
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            <strong>Monto Total: ₲ {pedidoAFacturar?.montoTotal?.toLocaleString("es-PY") || "0"}</strong>
          </DialogContentText>

          <Typography variant="h6" sx={{ mb: 2 }}>
            Tipo de Factura:
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Button
                variant={tipoFactura === "contado" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setTipoFactura("contado")}
                sx={{ width: "100%", p: 2, textAlign: "left" }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Factura al Contado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pago inmediato al momento de la entrega
                  </Typography>
                </Box>
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <Button
                variant={tipoFactura === "credito" ? "contained" : "outlined"}
                color="secondary"
                onClick={() => setTipoFactura("credito")}
                sx={{ width: "100%", p: 2, textAlign: "left" }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Factura a Crédito
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pago diferido con fecha de vencimiento
                  </Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>

          {/* Configuración específica para contado */}
          {tipoFactura === "contado" && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configuración de Factura al Contado:
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={configuracionFactura.metodoPago}
                      onChange={(e) => handleConfiguracionChange("metodoPago", e.target.value)}
                      label="Método de Pago"
                    >
                      <MenuItem value={1}>Efectivo</MenuItem>
                      <MenuItem value={2}>Transferencia</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={2}
                    value={configuracionFactura.observaciones}
                    onChange={(e) => handleConfiguracionChange("observaciones", e.target.value)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Configuración específica para crédito */}
          {tipoFactura === "credito" && (
            <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Configuración de Factura a Crédito:
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Días de Crédito</InputLabel>
                    <Select
                      value={configuracionFactura.diasCredito}
                      onChange={(e) => handleDiasCreditoChange(e.target.value)}
                      label="Días de Crédito"
                    >
                      <MenuItem value={15}>15 días</MenuItem>
                      <MenuItem value={30}>30 días</MenuItem>
                      <MenuItem value={45}>45 días</MenuItem>
                      <MenuItem value={60}>60 días</MenuItem>
                      <MenuItem value={90}>90 días</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Vencimiento"
                    type="date"
                    value={configuracionFactura.fechaVencimiento}
                    onChange={(e) => handleConfiguracionChange("fechaVencimiento", e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Observaciones"
                    multiline
                    rows={2}
                    value={configuracionFactura.observaciones}
                    onChange={(e) => handleConfiguracionChange("observaciones", e.target.value)}
                    size="small"
                    placeholder="Condiciones de pago, términos especiales, etc."
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: "info.light", borderRadius: 1 }}>
                    <Typography variant="body2" color="info.dark">
                      <strong>Nota:</strong> Las facturas a crédito generarán automáticamente una cuenta por cobrar que
                      podrá ser gestionada desde el módulo de finanzas.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogoFacturacion(false)} disabled={cargandoFactura}>
            Cancelar
          </Button>
          <Button
            onClick={generarFactura}
            variant="contained"
            disabled={!tipoFactura || cargandoFactura}
            startIcon={cargandoFactura ? <CircularProgress size={20} /> : <ReceiptIcon />}
          >
            {cargandoFactura ? "Generando..." : "Generar Factura"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </>
  )
}
