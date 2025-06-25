"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Tooltip,
} from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"
import PersonIcon from "@mui/icons-material/Person"
import InventoryIcon from "@mui/icons-material/Inventory"
import FactoryIcon from "@mui/icons-material/Factory"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function DetallePedido({ id, isEmbedded = false }) {
  const router = useRouter()
  const [pedido, setPedido] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [verificandoStock, setVerificandoStock] = useState(false)
  const [stockSuficiente, setStockSuficiente] = useState(null)
  const [materialesFaltantes, setMaterialesFaltantes] = useState([])
  const [resultadosVerificacion, setResultadosVerificacion] = useState([])

  // Cargar datos del pedido
  useEffect(() => {
    const cargarPedido = async () => {
      try {
        setCargando(true)
        const respuesta = await fetch(`/api/pedidos/${id}`)

        if (!respuesta.ok) {
          throw new Error(`Error al cargar pedido: ${respuesta.status}`)
        }

        const datos = await respuesta.json()
        console.log("Datos del pedido recibidos:", datos)
        console.log("Estado del pedido:", datos.estadoPedido)
        setPedido(datos)
      } catch (error) {
        console.error("Error:", error)
        setError("No se pudo cargar el pedido. Por favor, intenta de nuevo más tarde.")
      } finally {
        setCargando(false)
      }
    }

    if (id) {
      cargarPedido()
    }
  }, [id])

  // Verificar si el pedido está en estado PENDIENTE (ID 1)
  const esPedidoPendiente = () => {
    if (!pedido || !pedido.estadoPedido) return false

    const idEstado = pedido.estadoPedido.idEstadoPedido
    console.log("Verificando estado del pedido:")
    console.log("- idEstadoPedido:", idEstado)
    console.log("- Tipo:", typeof idEstado)
    console.log("- Comparación con 1:", idEstado === 1)
    console.log("- Comparación con '1':", idEstado === "1")

    // Verificar tanto número como string por si acaso
    return idEstado === 1 || idEstado === "1"
  }

  // Obtener mensaje de tooltip para botones deshabilitados
  const getMensajeBotonDeshabilitado = () => {
    if (!pedido) return ""

    const estadoActual = pedido.estadoPedido?.descEstadoPedido || "Desconocido"
    return `No se puede editar o generar orden de producción. El pedido está en estado: ${estadoActual}`
  }

  // Ir a editar pedido
  const irAEditarPedido = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!esPedidoPendiente()) {
      console.log("No se puede editar: pedido no está pendiente")
      return
    }

    console.log("Redirigiendo a editar pedido")
    router.push(`/pedidos/editar/${id}`)
  }

  // Volver a la lista de pedidos
  const volverALista = () => {
    router.push("/pedidos")
  }

  // Función para formatear fecha
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

  // Función para obtener la descripción detallada del producto
  const getDescripcionDetallada = (detalle) => {
    if (!detalle.producto) return `Producto #${detalle.idProducto}`

    const nombre = detalle.producto.nombreProducto
    const cantidadUnidades = detalle.cantidadUnidades || detalle.cantidad
    const cantidadPaquetes = detalle.cantidadPaquetes || 0
    const unidadesPorPaquete = detalle.unidadesPorPaquete || 1

    return `${nombre} - ${cantidadUnidades} unidades (${cantidadPaquetes} paquetes de ${unidadesPorPaquete} unid.)`
  }

  // Función para formatear la cantidad faltante según el tipo de material
  const formatearCantidadFaltante = (material) => {
  
    const faltanteGramos = Math.ceil(material.faltante)
    const necesarioGramos = Math.ceil(material.cantidadNecesaria)
    const stockActualGramos = Math.floor(material.stockActual)
  
    const formatKg = (value) => {
      return new Intl.NumberFormat("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 1000)
    }
  
    const faltanteKg = formatKg(faltanteGramos)
    const stockActualKg = formatKg(stockActualGramos)
    const necesarioKg = formatKg(necesarioGramos)
  
    // Usar el tamaño de lote real de la fórmula
    const tamPaquete = Number(material.detalleCalculo?.cantidadPorLote) || null
    let paquetesFaltantes = null
    let paquetesStock = null
    let paquetesNecesarios = null
    if (tamPaquete && tamPaquete > 0) {
      paquetesFaltantes = Math.ceil(faltanteGramos / tamPaquete)
      paquetesStock = Math.floor(stockActualGramos / tamPaquete)
      paquetesNecesarios = Math.ceil(necesarioGramos / tamPaquete)
    }
  
    // Construir mensaje
    let mensaje = `Faltan ${faltanteGramos}g (${faltanteKg}kg)`
    
    mensaje += `. Stock actual: ${stockActualGramos}g (${stockActualKg}kg)`
   
    mensaje += `, Necesario: ${necesarioGramos}g (${necesarioKg}kg)`
    
    return mensaje
  }

  // Función para verificar el stock de materias primas
  const verificarStockYGenerarOrden = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!esPedidoPendiente()) {
      console.log("No se puede generar orden: pedido no está pendiente")
      return
    }

    try {
      setVerificandoStock(true)
      setError(null)
      console.log("Iniciando verificación de stock para pedido:", id)

      const respuesta = await fetch(`/api/pedidos/verificar-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idPedido: id }),
      })

      if (!respuesta.ok) {
        const errorData = await respuesta.json()
        throw new Error(errorData.error || `Error al verificar el stock: ${respuesta.status}`)
      }

      const datos = await respuesta.json()
      console.log("Respuesta de verificación de stock:", datos)

      setStockSuficiente(datos.stockSuficiente)
      setMaterialesFaltantes(datos.materialesFaltantes || [])
      setResultadosVerificacion(datos.resultadosVerificacion || [])

      if (datos.stockSuficiente) {
        console.log("Stock suficiente, redirigiendo a crear orden de producción")
        // Si hay stock suficiente, redirigir a la página de creación de orden de producción
        router.push(`/produccion/crear-orden/${id}`)
      } else {
        console.log("Stock insuficiente, mostrando alerta")
      }
    } catch (error) {
      console.error("Error al verificar el stock:", error)
      setError(`Error al verificar el stock: ${error.message}`)
      setStockSuficiente(false)
      setMaterialesFaltantes([])
      setResultadosVerificacion([])
    } finally {
      setVerificandoStock(false)
    }
  }

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }

  if (!pedido) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography>No se encontró el pedido solicitado.</Typography>
      </Box>
    )
  }

  const pedidoPendiente = esPedidoPendiente()
  console.log("¿Pedido pendiente?", pedidoPendiente)

  return (
    <>
      {/* Solo mostrar botones de acción si no está embebido */}
      {!isEmbedded && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          {/* Botón Volver a la izquierda */}
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={volverALista}
            sx={{ mr: 2 }}
          >
            Volver a Pedidos
          </Button>
          
          {/* Botones de acción a la derecha */}
          <Box sx={{ display: "flex", gap: 2 }}>
            {pedidoPendiente ? (
              <>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={irAEditarPedido} type="button">
                  Editar Pedido
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={verificandoStock ? <CircularProgress size={20} color="inherit" /> : <FactoryIcon />}
                  onClick={verificarStockYGenerarOrden}
                  disabled={verificandoStock}
                  type="button"
                >
                  {verificandoStock ? "Verificando..." : "Generar Orden de Producción"}
                </Button>
              </>
            ) : (
              <>
                <Tooltip title={getMensajeBotonDeshabilitado()}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      disabled
                      type="button"
                      sx={{
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }}
                    >
                      Editar Pedido
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title={getMensajeBotonDeshabilitado()}>
                  <span>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<FactoryIcon />}
                      disabled
                      type="button"
                      sx={{
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }}
                    >
                      Generar Orden de Producción
                    </Button>
                  </span>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Mostrar alerta informativa si el pedido no está pendiente */}
      {!pedidoPendiente && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Este pedido está en estado "{pedido.estadoPedido?.descEstadoPedido || "Desconocido"}" y no puede ser editado
            ni se puede generar una nueva orden de producción.
          </Typography>
        </Alert>
      )}

      {/* Mostrar alerta de confirmación si el pedido está pendiente */}
      {pedidoPendiente && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Este pedido está en estado "Pendiente" y puede ser editado o se puede generar una orden de producción.
          </Typography>
        </Alert>
      )}

      {/* Mostrar alerta si no hay stock suficiente */}
      {stockSuficiente === false && materialesFaltantes.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            No se puede generar la orden de producción
          </Typography>
          <Typography variant="body2" gutterBottom>
            No hay suficiente stock de las siguientes materias primas:
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            {materialesFaltantes.map((material, index) => (
              <Box component="li" key={material.idMateriaPrima || index} sx={{ mb: 0.5 }}>
                <strong>{material.materiaPrima}:</strong> {formatearCantidadFaltante(material)}
              </Box>
            ))}
          </Box>
        </Alert>
      )}

      {/* Mostrar alerta si hay productos sin fórmula */}
      {stockSuficiente === false && materialesFaltantes.length === 0 && resultadosVerificacion.some((r) => r.error) && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            No se puede generar la orden de producción
          </Typography>
          <Typography variant="body2">
            Algunos productos no tienen fórmulas definidas. Por favor, configure las fórmulas antes de continuar.
          </Typography>
          <Box component="ul" sx={{ mt: 1, mb: 0 }}>
            {resultadosVerificacion
              .filter((r) => r.error)
              .map((resultado, index) => (
                <Box component="li" key={index} sx={{ mb: 0.5 }}>
                  <strong>{resultado.producto}:</strong> {resultado.error}
                </Box>
              ))}
          </Box>
        </Alert>
      )}

      {isEmbedded ? (
        // Vista simplificada para modo embebido
        <Grid container spacing={3}>
          {/* Información básica del pedido */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: "#1976d2" }}>
                Información del Pedido
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Fecha Pedido:</Typography>
                  <Typography variant="body2">{formatearFecha(pedido.fechaPedido)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Fecha Entrega:</Typography>
                  <Typography variant="body2">{formatearFecha(pedido.fechaEntrega)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Estado:</Typography>
                  <Chip
                    label={pedido.estadoPedido?.descEstadoPedido || "Desconocido"}
                    color={getEstadoColor(pedido.estadoPedido)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    ₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Información del cliente */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: "#1976d2" }}>
                Cliente
              </Typography>
              {pedido.cliente ? (
                <>
                  <Typography variant="body2" color="text.secondary">Nombre:</Typography>
                  <Typography variant="body2" gutterBottom>
                    {pedido.cliente.persona ? 
                      `${pedido.cliente.persona.nombre} ${pedido.cliente.persona.apellido}` : 
                      "No especificado"
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Documento:</Typography>
                  <Typography variant="body2">
                    {pedido.cliente.persona?.nroDocumento || "No especificado"}
                  </Typography>
                </>
              ) : (
                <Typography color="error">Cliente no encontrado</Typography>
              )}
            </Paper>
          </Grid>

          {/* Productos del pedido */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: "#1976d2" }}>
                Productos ({pedido.pedidoDetalle?.length || 0} productos)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedido.pedidoDetalle && pedido.pedidoDetalle.length > 0 ? (
                      pedido.pedidoDetalle.map((detalle, index) => {
                        const precioUnitario = detalle.precioUnitarioCalculado || 0
                        const cantidadUnidades = detalle.cantidadUnidades || detalle.cantidad
                        const subtotal = detalle.subtotalCalculado || detalle.subtotal || 0

                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {detalle.producto ? detalle.producto.nombreProducto : `Producto #${detalle.idProducto}`}
                            </TableCell>
                            <TableCell align="right">{cantidadUnidades} unid.</TableCell>
                            <TableCell align="right">₲ {precioUnitario.toLocaleString("es-PY")}</TableCell>
                            <TableCell align="right">₲ {subtotal.toLocaleString("es-PY")}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No hay productos en este pedido
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        // Vista completa para modo normal
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <ShoppingCartIcon sx={{ mr: 1 }} /> Información del Pedido
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Número de Pedido</Typography>
                <Typography variant="body1" gutterBottom>
                  #{pedido.idPedido}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Fecha de Pedido</Typography>
                <Typography variant="body1" gutterBottom>
                  {formatearFecha(pedido.fechaPedido)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Fecha de Entrega</Typography>
                <Typography variant="body1" gutterBottom>
                  {formatearFecha(pedido.fechaEntrega)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Estado</Typography>
                <Chip
                  label={pedido.estadoPedido?.descEstadoPedido || "Desconocido"}
                  color={getEstadoColor(pedido.estadoPedido)}
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Total</Typography>
                <Typography variant="body1" gutterBottom>
                  ₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2">Observaciones</Typography>
                <Typography variant="body1" gutterBottom>
                  {pedido.observacion || "Sin observaciones"}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3, height: "100%" }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon sx={{ mr: 1 }} /> Cliente
                </Typography>

                {pedido.cliente ? (
                  <>
                    {pedido.cliente.persona && (
                      <>
                        <Typography variant="subtitle2">Nombre</Typography>
                        <Typography variant="body1" gutterBottom>
                          {pedido.cliente.persona.nombre} {pedido.cliente.persona.apellido}
                        </Typography>

                        <Typography variant="subtitle2">Documento</Typography>
                        <Typography variant="body1" gutterBottom>
                          {pedido.cliente.persona.nroDocumento || "No especificado"}
                        </Typography>
                      </>
                    )}
                  </>
                ) : (
                  <Typography color="error">Cliente no encontrado</Typography>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, mb: 3, height: "100%" }}>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <PersonIcon sx={{ mr: 1 }} /> Usuario
                </Typography>

                {pedido.usuario ? (
                  <>
                    <Typography variant="subtitle2">Nombre de Usuario</Typography>
                    <Typography variant="body1" gutterBottom>
                      {pedido.usuario.nombreUsuario}
                    </Typography>

                    {pedido.usuario.persona && (
                      <>
                        <Typography variant="subtitle2">Nombre</Typography>
                        <Typography variant="body1" gutterBottom>
                          {pedido.usuario.persona.nombre} {pedido.usuario.persona.apellido}
                        </Typography>
                      </>
                    )}
                  </>
                ) : (
                  <Typography color="error">Usuario no encontrado</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <InventoryIcon sx={{ mr: 1 }} /> Productos
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Cantidad (Unidades)</TableCell>
                    <TableCell align="right">Paquetes Necesarios</TableCell>
                    <TableCell align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedido.pedidoDetalle && pedido.pedidoDetalle.length > 0 ? (
                    pedido.pedidoDetalle.map((detalle, index) => {
                      const precioUnitario = detalle.precioUnitarioCalculado || 0
                      const cantidadUnidades = detalle.cantidadUnidades || detalle.cantidad
                      const cantidadPaquetes = detalle.cantidadPaquetes || 0
                      const subtotal = detalle.subtotalCalculado || detalle.subtotal || 0

                      return (
                        <TableRow key={index}>
                          <TableCell>
                            {detalle.producto ? detalle.producto.nombreProducto : `Producto #${detalle.idProducto}`}
                          </TableCell>
                          <TableCell align="right">₲ {precioUnitario.toLocaleString("es-PY")}</TableCell>
                          <TableCell align="right">{cantidadUnidades}</TableCell>
                          <TableCell align="right">{cantidadPaquetes}</TableCell>
                          <TableCell align="right">₲ {subtotal.toLocaleString("es-PY")}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay productos en este pedido
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Información adicional sobre el cálculo */}
            <Box sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Nota:</strong> Los pedidos se ingresan por unidades individuales (sobres).
              </Typography>
            </Box>
          </Paper>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container justifyContent="flex-end">
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" align="right">
                    Total: ₲ {pedido.montoTotal?.toLocaleString("es-PY") || "0"}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}