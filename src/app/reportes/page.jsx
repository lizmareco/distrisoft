"use client"

import { useState } from "react"
import { Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Tabs, Tab, Alert, Container } from "@mui/material"
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Storefront as StorefrontIcon,
  DateRange as DateRangeIcon,
  Group as GroupIcon,
} from "@mui/icons-material"
import ReporteVentasCliente from "@/src/components/reportes/ReporteVentasCliente"
import ReporteVentasProducto from "@/src/components/reportes/ReporteVentasProducto"
import ReporteVentasRangoFecha from "@/src/components/reportes/ReporteVentasRangoFecha"
import ReporteVentasVendedor from "@/src/components/reportes/ReporteVentasVendedor"
import ReporteProductosMasVendidos from "@/src/components/reportes/ReporteProductosMasVendidos"
import ReporteClientesMasVentas from "@/src/components/reportes/ReporteClientesMasVentas"
import ReporteCuentasPorCobrar from "@/src/components/reportes/ReporteCuentasPorCobrar"
import ReporteFacturasEmitidas from "@/src/components/reportes/ReporteFacturasEmitidas"
import { LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import ReporteComprasProveedor from "@/src/components/reportes/ReporteComprasProveedor"
import ReporteComprasProducto from "@/src/components/reportes/ReporteComprasProducto"
import ReporteComprasOrden from "@/src/components/reportes/ReporteComprasOrden"
import { useRootContext } from "@/src/app/context/root"

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("ventas")
  const [selectedReport, setSelectedReport] = useState(null)

  // Permisos
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_EMPRESA") || context.session?.isAdmin

  // Cambiar pestaña activa
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setSelectedReport(null)
  }

  // Seleccionar un reporte específico
  const handleSelectReport = (reportType) => {
    setSelectedReport(reportType)
  }

  // Volver a la lista de reportes
  const handleVolver = () => {
    setSelectedReport(null)
  }

  // Renderizar tarjetas de reporte según la categoría
  const renderReportCards = () => {
    const reportsByCategory = {
      administracion: [
        { id: "cuentas_por_cobrar", title: "Cuentas por cobrar", icon: <BarChartIcon fontSize="large" /> },
        //{ id: "cuentas_por_pagar", title: "Cuentas por pagar", icon: <TrendingUpIcon fontSize="large" /> },
        //{ id: "utilidad_bruta", title: "Utilidad Bruta", icon: <AttachMoneyIcon fontSize="large" /> },
        { id: "facturas_emtidas", title: "Facturas Emitidas", icon: <AttachMoneyIcon fontSize="large" /> },
        //{ id: "resultados", title: "Estados de Resultados por periodo", icon: <AttachMoneyIcon fontSize="large" /> }
      ],
      ventas: [
        { id: "ventas-cliente", title: "Ventas por Cliente", icon: <PieChartIcon fontSize="large" /> },
        { id: "ventas-producto", title: "Ventas por Producto", icon: <StorefrontIcon fontSize="large" /> },
        { id: "ventas-rango-fecha", title: "Ventas por Rango de Fecha", icon: <DateRangeIcon fontSize="large" /> },
        { id: "ventas-vendedor", title: "Ventas por Vendedor", icon: <GroupIcon fontSize="large" /> },
        { id: "productos-mas-vendidos", title: "Productos Más Vendidos", icon: <TrendingUpIcon fontSize="large" /> },
        { id: "clientes-mas-ventas", title: "Clientes con Más Ventas", icon: <GroupIcon fontSize="large" /> },
        //{ id: "cotizaciones", title: "Cotizaciones a Clientes", icon: <AttachMoneyIcon fontSize="large" /> },
      ],
      compras: [
        { id: "compras-proveedor", title: "Compras por Proveedor", icon: <PieChartIcon fontSize="large" /> },
        { id: "compras-producto", title: "Compras por Producto", icon: <ShoppingCartIcon fontSize="large" /> },
        { id: "ordenes", title: "Órdenes de Compra", icon: <InventoryIcon fontSize="large" /> },
      ],
      inventario: [
        { id: "stock", title: "Estado de Stock", icon: <InventoryIcon fontSize="large" /> },
        { id: "movimientos", title: "Movimientos de Inventario", icon: <TrendingUpIcon fontSize="large" /> },
        { id: "valoracion", title: "Valoración de Inventario", icon: <AttachMoneyIcon fontSize="large" /> },
      ],
    }

    const reports = reportsByCategory[activeTab] || []

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {reports.map((report) => (
          <Grid item xs={12} sm={6} md={4} key={report.id}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Box sx={{ mb: 2 }}>{report.icon}</Box>
                <Typography variant="h6" component="div">
                  {report.title}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                <Button size="small" variant="contained" onClick={() => handleSelectReport(report.id)}>
                  Generar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
  }

  // Renderizar el reporte seleccionado
  const renderSelectedReport = () => {
    switch (selectedReport) {
      case "cuentas_por_cobrar":
        return <ReporteCuentasPorCobrar onVolver={handleVolver} />
      case "ventas-cliente":
        return <ReporteVentasCliente onVolver={handleVolver} />
      case "ventas-producto":
        return <ReporteVentasProducto onVolver={handleVolver} />
      case "ventas-rango-fecha":
        return <ReporteVentasRangoFecha onVolver={handleVolver} />
      case "ventas-vendedor":
        return <ReporteVentasVendedor onVolver={handleVolver} />
      case "productos-mas-vendidos":
        return <ReporteProductosMasVendidos onVolver={handleVolver} />
      case "clientes-mas-ventas":
        return <ReporteClientesMasVentas onVolver={handleVolver} />
      case "facturas_emtidas":
        return <ReporteFacturasEmitidas onVolver={handleVolver} />
      case "compras-proveedor":
        return <ReporteComprasProveedor />
      case "compras-producto":
        return <ReporteComprasProducto />
      case "ordenes":
        return <ReporteComprasOrden onVolver={handleVolver} />
      default:
        return (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body1">
              Este reporte está en desarrollo. Por favor, seleccione otro reporte o intente más tarde.
            </Typography>
          </Paper>
        )
    }
  }

  // Permiso: si no tiene permiso, mostrar alerta y no permitir acceso
  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
        </Button>
      </Box>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Reportes
        </Typography>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Administracion" value="administracion" icon={<AttachMoneyIcon />} iconPosition="start" />
            <Tab label="Ventas" value="ventas" icon={<StorefrontIcon />} iconPosition="start" />
            <Tab label="Compras" value="compras" icon={<ShoppingCartIcon />} iconPosition="start" />
            <Tab label="Inventario" value="inventario" icon={<InventoryIcon />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Reportes de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Typography>
            {!selectedReport && renderReportCards()}
            {selectedReport && renderSelectedReport()}
          </Box>
        </Paper>
      </Box>
    </LocalizationProvider>
  )
}
