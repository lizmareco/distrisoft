"use client"

import { useState, useRef, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material"
import { FileDownload as FileDownloadIcon, ArrowBack as ArrowBackIcon, PictureAsPdf as PdfIcon } from "@mui/icons-material"
import { format } from "date-fns"
import { useToast } from "@/src/hooks/use-toast"
import ExportarExcel from "@/src/components/ExportarExcel"
import html2canvas from "html2canvas"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend)

export default function ReporteProductosMasVendidos({ onVolver }) {
  const [fechaDesde, setFechaDesde] = useState(format(new Date(), "yyyy-MM-01"))
  const [fechaHasta, setFechaHasta] = useState(format(new Date(), "yyyy-MM-dd"))
  const [datosReporte, setDatosReporte] = useState([])
  const [totalGeneral, setTotalGeneral] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()
  const chartRef = useRef(null)

  // Función para formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(valor)
  }

  const [reporteGenerado, setReporteGenerado] = useState(false)

  // Función para generar el reporte
  const handleGenerarReporte = async () => {
    setLoading(true)
    setError(null)
    setReporteGenerado(false) // Reinicia antes de generar

    try {
      const response = await fetch(
        `/api/reportes/productos-mas-vendidos?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`,
      )
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Error al generar el reporte")
      }

      setDatosReporte(data.data)
      setTotalGeneral(data.totalGeneral)
      setReporteGenerado(true) // Solo aquí lo marcas como generado
      toast({
        title: "Reporte generado",
        description: `Se encontraron ${data.data.length} productos vendidos en el período seleccionado.`,
      })
    } catch (err) {
      console.error("Error:", err)
      setError(err.message)
      setReporteGenerado(true) // También aquí, para mostrar el error si corresponde
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Preparar datos para el gráfico (limitado a los 10 más vendidos)
  const prepararDatosGrafico = () => {
    if (datosReporte.length === 0) return null

    // Tomar solo los 10 productos más vendidos
    const top10 = datosReporte.slice(0, 10)

    return {
      labels: top10.map((item) => item.NOMBRE_PRODUCTO),
      datasets: [
        {
          label: "Total Vendido",
          data: top10.map((item) => item.TOTAL_VENDIDO),
          backgroundColor: "rgba(54, 162, 235, 0.6)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    }
  }

  // Opciones del gráfico
  const opcionesGrafico = {
    indexAxis: "y", // Gráfico horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Top 10 Productos Más Vendidos",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatMoneda(context.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatMoneda(value),
        },
      },
      y: {
        ticks: {
          maxTicksLimit: 10,
        },
      },
    },
  }

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (datosReporte.length === 0) return { total: 0, promedio: 0, maximo: 0, productoTop: "" }

    const total = totalGeneral
    const promedio = total / datosReporte.length
    const productoTop = datosReporte[0]?.NOMBRE_PRODUCTO || ""
    const maximo = datosReporte[0]?.TOTAL_VENDIDO || 0

    return { total, promedio, maximo, productoTop }
  }

  // Descargar gráfico como PNG
  const handleDescargarGrafico = async () => {
    if (!chartRef.current) return

    try {
      const canvas = await html2canvas(chartRef.current)
      const url = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `productos-mas-vendidos-${format(new Date(), "dd-MM-yyyy")}.png`
      link.href = url
      link.click()
    } catch (err) {
      console.error("Error al descargar gráfico:", err)
      toast({
        title: "Error",
        description: "No se pudo descargar el gráfico",
        variant: "destructive",
      })
    }
  }

  // Preparar datos para exportar a Excel
  const prepararDatosExcel = () => {
    return datosReporte.map((item) => ({
      Producto: item.NOMBRE_PRODUCTO,
      Descripción: item.DESCRIPCION,
      "Total Vendido": item.TOTAL_VENDIDO,
      "Cantidad Vendida": item.CANTIDAD_VENDIDA,
      Porcentaje: `${item.PORCENTAJE}%`,
    }))
  }

  const handleExportarPDF = () => {
    if (datosReporte.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      const printWindow = window.open("", "_blank")
      const totalCantidad = datosReporte.reduce((sum, prod) => sum + (prod.CANTIDAD_VENDIDA || 0), 0)
      const totalMonto = datosReporte.reduce((sum, prod) => sum + (prod.TOTAL_VENDIDO || 0), 0)

      printWindow.document.write(`
      <html>
        <head>
          <title>Distribuidora Las Niñas</title>
          <title>Reporte de Productos Más Vendidos</title>
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
          <h1>Reporte de Productos Más Vendidos</h1>
          <div class="info">
            <p><strong>Período:</strong> ${fechaDesde} al ${fechaHasta}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad Vendida</th>
                <th>Monto Total</th>
              </tr>
            </thead>
            <tbody>
              ${datosReporte
          .map(
            (prod) => `
                <tr>
                  <td>${prod.NOMBRE_PRODUCTO || ""}</td>
                  <td class="text-right">${prod.CANTIDAD_VENDIDA || 0}</td>
                  <td class="text-right">₲ ${(prod.TOTAL_VENDIDO || 0).toLocaleString("es-PY")}</td>
                </tr>
              `
          )
          .join("")}
              <tr class="total">
                <td><strong>Total</strong></td>
                <td class="text-right"><strong>${totalCantidad}</strong></td>
                <td class="text-right"><strong>₲ ${totalMonto.toLocaleString("es-PY")}</strong></td>
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

  const estadisticas = calcularEstadisticas()
  const datosGrafico = prepararDatosGrafico()

  return (
    <Box>
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onVolver} variant="outlined">
          Volver
        </Button>
        <Typography variant="h5" component="h2">
          Productos Más Vendidos
        </Typography>
        <Box /> {/* Elemento vacío para mantener el espacio */}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              label="Fecha Desde"
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Fecha Hasta"
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="contained" onClick={handleGenerarReporte} fullWidth disabled={loading}>
              {loading ? <CircularProgress size={24} /> : "Generar"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {datosReporte.length > 0 && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Productos
                  </Typography>
                  <Typography variant="h5">{datosReporte.length}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Vendido
                  </Typography>
                  <Typography variant="h5">{formatMoneda(estadisticas.total)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Promedio por Producto
                  </Typography>
                  <Typography variant="h5">{formatMoneda(estadisticas.promedio)}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Producto Más Vendido
                  </Typography>
                  <Typography variant="h5" noWrap title={estadisticas.productoTop}>
                    {estadisticas.productoTop}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2, height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6">Top 10 Productos Más Vendidos</Typography>
                  <Tooltip title="Descargar Gráfico PNG">
                    <Button
                      variant="outlined"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleDescargarGrafico}
                      color="primary"
                    >
                      Descargar PNG
                    </Button>
                  </Tooltip>
                </Box>
                <Box ref={chartRef} sx={{ height: 400 }}>
                  {datosGrafico && <Bar data={datosGrafico} options={opcionesGrafico} />}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: "100%" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6">Distribución de Ventas</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {datosReporte.slice(0, 10).map((item, index) => (
                    <Box key={index}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: "70%" }} title={item.NOMBRE_PRODUCTO}>
                          {item.NOMBRE_PRODUCTO}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.PORCENTAJE}%
                        </Typography>
                      </Box>
                      <Box sx={{ width: "100%", bgcolor: "background.paper", borderRadius: 1, mt: 0.5 }}>
                        <Box
                          sx={{
                            height: 8,
                            borderRadius: 1,
                            width: `${item.PORCENTAJE}%`,
                            bgcolor: index === 0 ? "primary.main" : "primary.light",
                          }}
                        />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ mt: 3, p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Detalle de Productos Vendidos</Typography>
              <Box>
                <ExportarExcel
                  datos={prepararDatosExcel()}
                  nombreArchivo={`productos-mas-vendidos-${format(new Date(), "dd-MM-yyyy")}`}
                />
                <Button
                  variant="outlined"
                  startIcon={<PdfIcon />}
                  onClick={handleExportarPDF}
                  color="error"
                >
                  Exportar PDF
                </Button>
              </Box>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Total Vendido</TableCell>
                    <TableCell align="right">% del Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {datosReporte.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{item.NOMBRE_PRODUCTO}</TableCell>
                      <TableCell>{item.DESCRIPCION}</TableCell>
                      <TableCell align="right">{item.CANTIDAD_VENDIDA}</TableCell>
                      <TableCell align="right">{formatMoneda(item.TOTAL_VENDIDO)}</TableCell>
                      <TableCell align="right">{item.PORCENTAJE}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {reporteGenerado && datosReporte.length === 0 && !loading && !error && (
        <Alert severity="info">
          No se encontraron datos para el período seleccionado. Ajuste los filtros e intente nuevamente.
        </Alert>
      )}
    </Box>
  )
}
