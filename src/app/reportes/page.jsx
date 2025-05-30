"use client"

import { useState } from "react"
import { Box, Typography, Paper, Grid, Card, CardContent, CardActions, Button, Tabs, Tab } from "@mui/material"
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

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("ventas")
  const [selectedReport, setSelectedReport] = useState(null)

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
      financiero: [
        { id: "balance", title: "Balance General", icon: <BarChartIcon fontSize="large" /> },
        { id: "resultados", title: "Estado de Resultados", icon: <TrendingUpIcon fontSize="large" /> },
        { id: "flujo", title: "Flujo de Caja", icon: <AttachMoneyIcon fontSize="large" /> },
      ],
      ventas: [
        { id: "ventas-cliente", title: "Ventas por Cliente", icon: <PieChartIcon fontSize="large" /> },
        { id: "ventas-producto", title: "Ventas por Producto", icon: <StorefrontIcon fontSize="large" /> },
        { id: "ventas-rango-fecha", title: "Ventas por Rango de Fecha", icon: <DateRangeIcon fontSize="large" /> },
        { id: "ventas-vendedor", title: "Ventas por Vendedor", icon: <GroupIcon fontSize="large" /> },
        { id: "productos-mas-vendidos", title: "Productos Más Vendidos", icon: <TrendingUpIcon fontSize="large" /> },
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

  return (
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
          <Tab label="Financiero" value="financiero" icon={<AttachMoneyIcon />} iconPosition="start" />
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
  )
}
