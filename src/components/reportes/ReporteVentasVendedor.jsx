"use client"

import { useState, useEffect, useRef } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/material"
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import { exportToExcel } from "@/src/utils/export-utils"
import dynamic from "next/dynamic"

// Importación dinámica de Chart.js para evitar problemas de SSR
const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  ),
})

export default function ReporteVentasVendedor({ onVolver }) {
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [ventasVendedor, setVentasVendedor] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [chartLoaded, setChartLoaded] = useState(false)

  // Referencia al gráfico para poder descargarlo
  const chartRef = useRef(null)

  // Registrar componentes de Chart.js
  useEffect(() => {
    const registerChartComponents = async () => {
      try {
        const { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } = await import("chart.js")

        Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
        setChartLoaded(true)
      } catch (error) {
        console.error("Error al cargar Chart.js:", error)
      }
    }

    registerChartComponents()
  }, [])

  // Generar reporte
  const handleGenerarReporte = async () => {
    if (!fechaDesde || !fechaHasta) {
      setError("Las fechas desde y hasta son requeridas")
      return
    }

    setLoading(true)
    setError(null)
    setBusquedaRealizada(true)

    try {
      const url = `/api/reportes/ventas-vendedor?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al obtener datos")
      }

      const datos = await response.json()
      setVentasVendedor(datos)
    } catch (error) {
      console.error("Error al generar reporte:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Exportar a Excel
  const handleExportarExcel = () => {
    if (ventasVendedor.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      exportToExcel(ventasVendedor, `reporte-ventas-vendedor-${fechaDesde}-${fechaHasta}`)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      setError("Error al exportar a Excel: " + error.message)
    }
  }

  // Exportar a PDF
  const handleExportarPDF = () => {
    if (ventasVendedor.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      const printWindow = window.open("", "_blank")
      const total = ventasVendedor.reduce((sum, venta) => sum + (venta.TOTAL_VENDIDO || 0), 0)

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Ventas por Vendedor</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; background-color: #f9f9f9; }
              .text-right { text-align: right; }
            </style>
          </head>
          <body>
            <h1>Reporte de Ventas por Vendedor</h1>
            <div class="info">
              <p><strong>Período:</strong> ${fechaDesde} al ${fechaHasta}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Cantidad de Ventas</th>
                  <th>Total Vendido</th>
                </tr>
              </thead>
              <tbody>
                ${ventasVendedor
                  .map(
                    (venta) => `
                  <tr>
                    <td>${venta.VENDEDOR_USER || ""}</td>
                    <td>${venta.NOMBRE || ""}</td>
                    <td>${venta.APELLIDO || ""}</td>
                    <td class="text-right">${venta.CANTIDAD_VENTAS || 0}</td>
                    <td class="text-right">₲ ${(venta.TOTAL_VENDIDO || 0).toLocaleString("es-PY")}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr class="total">
                  <td colspan="3"><strong>Total</strong></td>
                  <td class="text-right"><strong>${ventasVendedor.reduce((sum, venta) => sum + (venta.CANTIDAD_VENTAS || 0), 0)}</strong></td>
                  <td class="text-right"><strong>₲ ${total.toLocaleString("es-PY")}</strong></td>
                </tr>
              </tbody>
            </table>
          </body>
        </html>
      `)

      printWindow.document.close()
      printWindow.print()
    } catch (error) {
      console.error("Error al exportar a PDF:", error)
      setError("Error al exportar a PDF: " + error.message)
    }
  }

  // Descargar gráfico como PNG
  const handleDescargarGrafico = () => {
    if (!chartRef.current) {
      setError("No se puede acceder al gráfico")
      return
    }

    try {
      const canvas = chartRef.current.canvas
      const link = document.createElement("a")
      link.download = `grafico-ventas-vendedor-${fechaDesde}-${fechaHasta}.png`
      link.href = canvas.toDataURL("image/png")
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al descargar gráfico:", error)
      setError("Error al descargar el gráfico: " + error.message)
    }
  }

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (ventasVendedor.length === 0) return null

    const totalVentas = ventasVendedor.reduce((sum, item) => sum + (item.TOTAL_VENDIDO || 0), 0)
    const totalCantidad = ventasVendedor.reduce((sum, item) => sum + (item.CANTIDAD_VENTAS || 0), 0)
    const promedioVentas = totalVentas / ventasVendedor.length
    const ventaMaxima = Math.max(...ventasVendedor.map((item) => item.TOTAL_VENDIDO || 0))
    const ventaMinima = Math.min(...ventasVendedor.map((item) => item.TOTAL_VENDIDO || 0))

    return {
      totalVentas,
      totalCantidad,
      promedioVentas,
      ventaMaxima,
      ventaMinima,
      cantidadVendedores: ventasVendedor.length,
    }
  }

  // Preparar datos para el gráfico
  const prepararDatosGrafico = () => {
    if (ventasVendedor.length === 0) return null

    return {
      labels: ventasVendedor.map((item) => item.VENDEDOR_USER),
      datasets: [
        {
          label: "Total Vendido",
          data: ventasVendedor.map((item) => item.TOTAL_VENDIDO || 0),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    }
  }

  // Opciones del gráfico
  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Ventas por Vendedor",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `Total: ₲ ${(context.parsed.y || 0).toLocaleString("es-PY")}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => "₲ " + (value || 0).toLocaleString("es-PY"),
        },
        title: {
          display: true,
          text: "Monto Total (₲)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Vendedor",
        },
      },
    },
  }

  const estadisticas = calcularEstadisticas()
  const datosGrafico = prepararDatosGrafico()

  return (
    <Box sx={{ p: 3 }}>
      {/* Botón de volver */}
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ mb: 2 }}>
          Volver a Reportes
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Reporte de Ventas por Vendedor
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              onClick={handleGenerarReporte}
              disabled={loading}
            >
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Mostrar mensaje de "Sin resultados" solo después de realizar una búsqueda */}
      {!loading && !error && busquedaRealizada && ventasVendedor.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Sin resultados
          </Typography>
          <Typography>
            No se encontraron ventas en el período del <strong>{fechaDesde}</strong> al <strong>{fechaHasta}</strong>.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Verifique que:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0 }}>
              <li>Las fechas estén en el formato correcto</li>
              <li>Existan ventas en el rango de fechas especificado</li>
            </Box>
          </Box>
        </Alert>
      )}

      {ventasVendedor.length > 0 && (
        <>
          {/* Botones de exportación */}
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportarExcel} color="success">
              Exportar Excel
            </Button>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportarPDF} color="error">
              Exportar PDF
            </Button>
          </Box>

          {/* Gráfico de ventas por vendedor */}
          {chartLoaded && datosGrafico && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">📊 Ventas por Vendedor</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDescargarGrafico}
                    color="primary"
                  >
                    Descargar PNG
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 400 }}>
                  <Bar ref={chartRef} data={datosGrafico} options={opcionesGrafico} />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas */}
          {estadisticas && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Estadísticas del Período
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {estadisticas.cantidadVendedores}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Vendedores activos
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        ₲ {estadisticas.totalVentas.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total vendido
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {estadisticas.totalCantidad}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total de ventas
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        ₲ {estadisticas.ventaMaxima.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Vendedor top
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary.main">
                        ₲ {Math.round(estadisticas.promedioVentas).toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Promedio por vendedor
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Tabla de resultados */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Apellido</TableCell>
                  <TableCell align="right">Cantidad de Ventas</TableCell>
                  <TableCell align="right">Total Vendido</TableCell>
                  <TableCell align="right">Promedio por Venta</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasVendedor.map((venta, index) => (
                  <TableRow key={index}>
                    <TableCell>{venta.VENDEDOR_USER || ""}</TableCell>
                    <TableCell>{venta.NOMBRE || ""}</TableCell>
                    <TableCell>{venta.APELLIDO || ""}</TableCell>
                    <TableCell align="right">{venta.CANTIDAD_VENTAS || 0}</TableCell>
                    <TableCell align="right">₲ {(venta.TOTAL_VENDIDO || 0).toLocaleString("es-PY")}</TableCell>
                    <TableCell align="right">
                      ₲{" "}
                      {venta.CANTIDAD_VENTAS > 0
                        ? Math.round((venta.TOTAL_VENDIDO || 0) / venta.CANTIDAD_VENTAS).toLocaleString("es-PY")
                        : "0"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell colSpan={3}>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{ventasVendedor.reduce((sum, venta) => sum + (venta.CANTIDAD_VENTAS || 0), 0)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      ₲{" "}
                      {ventasVendedor
                        .reduce((sum, venta) => sum + (venta.TOTAL_VENDIDO || 0), 0)
                        .toLocaleString("es-PY")}
                    </strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>-</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  )
}
