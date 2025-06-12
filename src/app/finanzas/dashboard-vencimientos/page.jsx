"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  LinearProgress,
} from "@mui/material"
import {
  Warning,
  Schedule,
  TrendingUp,
  AccountBalance,
  Refresh,
  Payment,
  Visibility,
} from "@mui/icons-material"
import { useRootContext } from "@/src/app/context/root"

export default function DashboardVencimientosPage() {
  // Declarar todos los hooks siempre, sin condicionales
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  // Obtener el contexto y los permisos
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find((permiso) => permiso === "VIEW_FACTURACLIENTE") ||
    context.session?.isAdmin

  // Hook useEffect para cargar el dashboard
  useEffect(() => {
    cargarDashboard()
    const interval = setInterval(cargarDashboard, 5 * 60 * 1000) // cada 5 minutos
    return () => clearInterval(interval)
  }, [])

  const cargarDashboard = async () => {
    setLoading(true)
    try {
      const respuesta = await fetch("/api/finanzas/-vencimientos")
      if (respuesta.ok) {
        const datos = await respuesta.json()
        setDashboardData(datos.data)
        setUltimaActualizacion(new Date())
      }
    } catch (error) {
      console.error("Error al cargar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const actualizarEstados = async () => {
    try {
      const respuesta = await fetch("/api/finanzas/actualizar-estados", {
        method: "POST",
      })
      if (respuesta.ok) {
        cargarDashboard()
      }
    } catch (error) {
      console.error("Error al actualizar estados:", error)
    }
  }

  const getColorPorDias = (dias) => {
    if (dias > 30) return "error"
    if (dias > 7) return "warning"
    if (dias > 0) return "info"
    return "success"
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-PY")
  }

  // Al final, en lugar de retornar temprano, usamos un condicional para el contenido
  const content = !hasPermission ? (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Alert severity="error">No tiene permisos para ver esta página</Alert>
    </Container>
  ) : loading ? (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <LinearProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Cargando dashboard de vencimientos...
      </Typography>
    </Container>
  ) : (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Dashboard de Vencimientos
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={actualizarEstados}
            sx={{ mr: 2 }}
          >
            Actualizar Estados
          </Button>
          <Button variant="contained" startIcon={<Refresh />} onClick={cargarDashboard}>
            Refrescar
          </Button>
        </Box>
      </Box>
      {ultimaActualizacion && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Última actualización: {ultimaActualizacion.toLocaleString("es-PY")}
        </Alert>
      )}
      {/* Resumen General */}
      {dashboardData?.resumen && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AccountBalance color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total por Cobrar
                    </Typography>
                    <Typography variant="h4" color="primary">
                      ₲ {dashboardData.resumen.totalPorCobrar.toLocaleString("es-PY")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Warning color="error" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Facturas Vencidas
                    </Typography>
                    <Typography variant="h4" color="error.main">
                      {dashboardData.resumen.facturasVencidas}
                    </Typography>
                    <Typography variant="body2" color="error.main">
                      ₲ {dashboardData.resumen.montoVencido.toLocaleString("es-PY")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Schedule color="warning" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Vencen en 7 días
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {dashboardData.resumen.vencenEn7Dias}
                    </Typography>
                    <Typography variant="body2" color="warning.main">
                      ₲ {dashboardData.resumen.montoVenceEn7Dias.toLocaleString("es-PY")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrendingUp color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Cobrado este mes
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      ₲ {dashboardData.resumen.cobradoEsteMes.toLocaleString("es-PY")}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alertas Críticas */}
      {dashboardData?.alertas && dashboardData.alertas.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              🚨 Alertas Críticas
            </Typography>
            {dashboardData.alertas.map((alerta, index) => (
              <Alert key={index} severity={alerta.tipo} sx={{ mb: 1 }}>
                {alerta.mensaje}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Facturas por Vencer */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📅 Facturas Próximas a Vencer (30 días)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell>
                    <strong>Factura</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Fecha Venc.</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Días</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Monto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Estado</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData?.proximasVencer?.map((factura) => (
                  <TableRow key={factura.nroFactura}>
                    <TableCell>#{factura.nroFactura}</TableCell>
                    <TableCell>{factura.cliente}</TableCell>
                    <TableCell>{formatearFecha(factura.fechaVencimiento)}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${factura.diasParaVencer} días`}
                        color={getColorPorDias(factura.diasParaVencer)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>₲ {factura.saldoRestante.toLocaleString("es-PY")}</TableCell>
                    <TableCell>
                      <Chip
                        label={factura.estadoCuenta}
                        color={factura.estadoCuenta === "Vencida" ? "error" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="success">
                        <Payment />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Facturas Vencidas */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom color="error">
            ⚠️ Facturas Vencidas (Requieren Atención Inmediata)
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#ffebee" }}>
                  <TableCell>
                    <strong>Factura</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Cliente</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Fecha Venc.</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Días Vencida</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Monto</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Último Pago</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData?.facturasVencidas?.map((factura) => (
                  <TableRow key={factura.nroFactura} sx={{ backgroundColor: "#fff3f3" }}>
                    <TableCell>#{factura.nroFactura}</TableCell>
                    <TableCell>{factura.cliente}</TableCell>
                    <TableCell>{formatearFecha(factura.fechaVencimiento)}</TableCell>
                    <TableCell>
                      <Chip label={`${factura.diasVencido} días`} color="error" size="small" />
                    </TableCell>
                    <TableCell>₲ {factura.saldoRestante.toLocaleString("es-PY")}</TableCell>
                    <TableCell>
                      {factura.ultimoPago ? (
                        <Typography variant="caption">{formatearFecha(factura.ultimoPago.fecha)}</Typography>
                      ) : (
                        <Typography variant="caption" color="error">
                          Sin pagos
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                      <IconButton size="small" color="success">
                        <Payment />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Container>
  )

  return content
}
