"use client"

import { useState } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
} from "@mui/material"
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Storefront as StorefrontIcon,
  Download as DownloadIcon,
} from "@mui/icons-material"

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState("financiero")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [tipoReporte, setTipoReporte] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Cambiar pestaña activa
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setTipoReporte("")
  }

  // Generar reporte
  const handleGenerarReporte = () => {
    setLoading(true)
    setError(null)

    // Simulación de generación de reporte
    setTimeout(() => {
      setLoading(false)
      // Aquí iría la lógica real para generar el reporte
    }, 1500)
  }

  // Exportar reporte
  const handleExportarReporte = (formato) => {
    // Aquí iría la lógica para exportar el reporte en el formato especificado
    alert(`Exportando reporte en formato ${formato}`)
  }

  // Renderizar opciones de reporte según la pestaña activa
  const renderOpcionesReporte = () => {
    switch (activeTab) {
      case "financiero":
        return (
          <FormControl fullWidth>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select value={tipoReporte} label="Tipo de Reporte" onChange={(e) => setTipoReporte(e.target.value)}>
              <MenuItem value="">Seleccione un tipo</MenuItem>
              <MenuItem value="balance">Balance General</MenuItem>
              <MenuItem value="resultados">Estado de Resultados</MenuItem>
              <MenuItem value="flujo">Flujo de Caja</MenuItem>
              <MenuItem value="ventas">Ventas por Período</MenuItem>
              <MenuItem value="compras">Compras por Período</MenuItem>
            </Select>
          </FormControl>
        )
      case "produccion":
        return (
          <FormControl fullWidth>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select value={tipoReporte} label="Tipo de Reporte" onChange={(e) => setTipoReporte(e.target.value)}>
              <MenuItem value="">Seleccione un tipo</MenuItem>
              <MenuItem value="produccion">Producción por Período</MenuItem>
              <MenuItem value="eficiencia">Eficiencia de Producción</MenuItem>
              <MenuItem value="consumo">Consumo de Materias Primas</MenuItem>
              <MenuItem value="productos">Productos Fabricados</MenuItem>
            </Select>
          </FormControl>
        )
      case "compras":
        return (
          <FormControl fullWidth>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select value={tipoReporte} label="Tipo de Reporte" onChange={(e) => setTipoReporte(e.target.value)}>
              <MenuItem value="">Seleccione un tipo</MenuItem>
              <MenuItem value="proveedor">Compras por Proveedor</MenuItem>
              <MenuItem value="materiaPrima">Compras por Materia Prima</MenuItem>
              <MenuItem value="ordenes">Órdenes de Compra</MenuItem>
              <MenuItem value="cotizaciones">Cotizaciones a Proveedores</MenuItem>
            </Select>
          </FormControl>
        )
      case "ventas":
        return (
          <FormControl fullWidth>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select value={tipoReporte} label="Tipo de Reporte" onChange={(e) => setTipoReporte(e.target.value)}>
              <MenuItem value="">Seleccione un tipo</MenuItem>
              <MenuItem value="cliente">Ventas por Cliente</MenuItem>
              <MenuItem value="producto">Ventas por Producto</MenuItem>
              <MenuItem value="cotizaciones">Cotizaciones a Clientes</MenuItem>
              <MenuItem value="pedidos">Pedidos</MenuItem>
            </Select>
          </FormControl>
        )
      default:
        return null
    }
  }

  // Renderizar tarjetas de reporte
  const renderTarjetasReporte = () => {
    const tarjetas = {
      financiero: [
        { titulo: "Balance General", icono: <BarChartIcon fontSize="large" /> },
        { titulo: "Estado de Resultados", icono: <TrendingUpIcon fontSize="large" /> },
        { titulo: "Flujo de Caja", icono: <AttachMoneyIcon fontSize="large" /> },
      ],
      produccion: [
        { titulo: "Producción por Período", icono: <InventoryIcon fontSize="large" /> },
        { titulo: "Eficiencia de Producción", icono: <TrendingUpIcon fontSize="large" /> },
        { titulo: "Consumo de Materias Primas", icono: <BarChartIcon fontSize="large" /> },
      ],
      compras: [
        { titulo: "Compras por Proveedor", icono: <PieChartIcon fontSize="large" /> },
        { titulo: "Compras por Materia Prima", icono: <ShoppingCartIcon fontSize="large" /> },
        { titulo: "Órdenes de Compra", icono: <InventoryIcon fontSize="large" /> },
      ],
      ventas: [
        { titulo: "Ventas por Cliente", icono: <PieChartIcon fontSize="large" /> },
        { titulo: "Ventas por Producto", icono: <StorefrontIcon fontSize="large" /> },
        { titulo: "Cotizaciones a Clientes", icono: <AttachMoneyIcon fontSize="large" /> },
      ],
    }

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {tarjetas[activeTab].map((tarjeta, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Box sx={{ mb: 2 }}>{tarjeta.icono}</Box>
                <Typography variant="h6" component="div">
                  {tarjeta.titulo}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    setTipoReporte(tarjeta.titulo.toLowerCase().replace(/\s+/g, ""))
                  }}
                >
                  Generar
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    )
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
          <Tab label="Producción" value="produccion" icon={<InventoryIcon />} iconPosition="start" />
          <Tab label="Compras" value="compras" icon={<ShoppingCartIcon />} iconPosition="start" />
          <Tab label="Ventas" value="ventas" icon={<StorefrontIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generar Reporte de {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              {renderOpcionesReporte()}
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha Desde"
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Fecha Hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                disabled={!tipoReporte || !fechaDesde || !fechaHasta || loading}
                onClick={handleGenerarReporte}
                sx={{ mr: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : "Generar Reporte"}
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={!tipoReporte || !fechaDesde || !fechaHasta || loading}
                onClick={() => handleExportarReporte("excel")}
                sx={{ mr: 2 }}
              >
                Excel
              </Button>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={!tipoReporte || !fechaDesde || !fechaHasta || loading}
                onClick={() => handleExportarReporte("pdf")}
              >
                PDF
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </Box>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" gutterBottom>
        Reportes Disponibles
      </Typography>

      {renderTarjetasReporte()}
    </Box>
  )
}
