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
  Divider
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
const Line = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <CircularProgress />
    </Box>
  ),
})

// Importación dinámica de los componentes de Chart.js
const ChartJS = dynamic(() => import("chart.js").then((mod) => mod.Chart), { ssr: false })

export default function ReporteComprasProducto({ onVolver }) {
  // Ahora se ingresa el id de la materia prima directamente
  const [idMateriaPrima, setIdMateriaPrima] = useState("")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [comprasDetalladas, setComprasDetalladas] = useState([])
  const [comprasAgrupadas, setComprasAgrupadas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [chartLoaded, setChartLoaded] = useState(false)

  // Referencia al gráfico para descargar
  const chartRef = useRef(null)

  // Registrar componentes de Chart.js
  useEffect(() => {
    const registerChartComponents = async () => {
      try {
        const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } = await import("chart.js")
        Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)
        setChartLoaded(true)
      } catch (err) {
        console.error("Error al cargar Chart.js:", err)
      }
    }
    registerChartComponents()
  }, [])

  // Generar reporte de compras por producto
  const handleGenerarReporte = async () => {
    if (!idMateriaPrima || !fechaDesde || !fechaHasta) {
      setError("Todos los campos son requeridos")
      return
    }
    setLoading(true)
    setError(null)
    setBusquedaRealizada(true)
    console.log("Iniciando reporte de compras con:", { idMateriaPrima, fechaDesde, fechaHasta })
    try {
      // Solicitar datos detallados
      const urlDetallado = `/api/reportes/compras/producto?idMateriaPrima=${idMateriaPrima}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&tipo=detallado`
      const responseDetallado = await fetch(urlDetallado)
      if (!responseDetallado.ok) {
        const errorData = await responseDetallado.json()
        throw new Error(errorData.error || "Error al obtener datos detallados")
      }
      const datosDetallados = await responseDetallado.json()
      setComprasDetalladas(datosDetallados)

      if (datosDetallados.length === 0) {
        setComprasAgrupadas([])
        return
      }

      // Solicitar datos agrupados para estadísticas y gráfico
      const urlAgrupado = `/api/reportes/compras/producto?idMateriaPrima=${idMateriaPrima}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&tipo=agrupado`
      const responseAgrupado = await fetch(urlAgrupado)
      if (!responseAgrupado.ok) {
        const errorData = await responseAgrupado.json()
        throw new Error(errorData.error || "Error al obtener datos agrupados")
      }
      const datosAgrupados = await responseAgrupado.json()
      setComprasAgrupadas(Array.isArray(datosAgrupados) ? datosAgrupados : [])
      console.log("Reporte generado exitosamente")
    } catch (err) {
      console.error("Error al generar reporte:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Exportar a Excel
  const handleExportarExcel = () => {
    if (comprasDetalladas.length === 0) {
      setError("No hay datos para exportar")
      return
    }
    try {
      exportToExcel(comprasDetalladas, `reporte-compras-producto-${idMateriaPrima}`)
    } catch (err) {
      setError("Error al exportar a Excel: " + err.message)
    }
  }

  // Exportar a PDF
  const handleExportarPDF = () => {
    if (comprasDetalladas.length === 0) {
      setError("No hay datos para exportar")
      return
    }
    try {
      const printWindow = window.open("", "_blank")
      const total = comprasDetalladas.reduce((sum, compra) => sum + (compra.SUBTOTAL || 0), 0)
      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Compras por Producto</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { text-align: center; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>Reporte de Compras por Producto</h1>
            <table>
              <thead>
                <tr>
                  <th>ID Producto</th>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Compras Totales</th>
                  <th>Cantidad Total</th>
                  <th>Monto Total</th>
                  <th>Precio Promedio</th>
                </tr>
              </thead>
              <tbody>
                ${comprasDetalladas.map(item => `
                  <tr>
                    <td>${item.producto.id}</td>
                    <td>${item.producto.nombre}</td>
                    <td>${item.producto.estado}</td>
                    <td>${item.estadisticas.comprasTotales}</td>
                    <td>${item.estadisticas.cantidadTotal}</td>
                    <td>${new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(item.estadisticas.montoTotal)}</td>
                    <td>${new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(item.estadisticas.precioPromedio)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <p style="text-align: center; margin-top: 20px;">
              Total General: ${new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(total)}
            </p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    } catch (err) {
      setError("Error al exportar a PDF: " + err.message)
    }
  }

  // Preparar datos para el gráfico
  const parsearFecha = (fechaStr) => {
    if (!fechaStr) return new Date(0)
    if (fechaStr.includes("-") && fechaStr.length === 10) {
      const [dia, mes, año] = fechaStr.split("-")
      return new Date(año, mes - 1, dia)
    }
    return new Date(fechaStr)
  }

  const prepararDatosGrafico = () => {
    if (comprasAgrupadas.length === 0) return null
    const datosOrdenados = [...comprasAgrupadas].sort((a, b) => {
      const fechaA = new Date(a.detalle[0].fecha)
      const fechaB = new Date(b.detalle[0].fecha)
      return fechaA - fechaB
    })
    return {
      labels: datosOrdenados.map(item => new Date(item.detalle[0].fecha).toLocaleDateString()),
      datasets: [
        {
          label: "Compras del Producto por Día",
          data: datosOrdenados.map(item => Number(item.estadisticas.montoTotal) || 0),
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: "rgb(54, 162, 235)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
        }
      ]
    }
  }

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Evolución de Compras del Producto",
        font: { size: 16, weight: "bold" }
      },
      tooltip: {
        callbacks: {
          label: (context) => `Compras: ${new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(context.parsed.y || 0)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(value || 0)
        },
        title: { display: true, text: "Monto de Compras (₲)" }
      },
      x: { title: { display: true, text: "Fecha" } }
    }
  }

  const calcularEstadisticas = () => {
    if (comprasAgrupadas.length === 0) return null
    const totalCompras = comprasAgrupadas.reduce((sum, item) => sum + (Number(item.estadisticas.montoTotal) || 0), 0)
    const promedioCompras = totalCompras / comprasAgrupadas.length
    const compraMaxima = Math.max(...comprasAgrupadas.map(item => Number(item.estadisticas.montoTotal) || 0))
    const compraMinima = Math.min(...comprasAgrupadas.map(item => Number(item.estadisticas.montoTotal) || 0))
    return { totalCompras, promedioCompras, compraMaxima, compraMinima, cantidadDias: comprasAgrupadas.length }
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
        Reporte de Compras por Producto
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="ID Materia Prima"
              placeholder="Ej: 101"
              value={idMateriaPrima}
              onChange={(e) => setIdMateriaPrima(e.target.value)}
            />
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

          <Grid item xs={12} md={4}>
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

      {!loading && !error && busquedaRealizada && comprasDetalladas.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Sin resultados
          </Typography>
          <Typography>
            No se encontraron compras para el ID de materia prima <strong>{idMateriaPrima}</strong> en el período del{" "}
            <strong>{fechaDesde}</strong> al <strong>{fechaHasta}</strong>.
          </Typography>
        </Alert>
      )}

      {comprasDetalladas.length > 0 && (
        <>
          {/* Botones de Exportación */}
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportarExcel} color="success">
              Exportar Excel
            </Button>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportarPDF} color="error">
              Exportar PDF
            </Button>
          </Box>

          {/* Gráfico de Evolución */}
          {chartLoaded && datosGrafico && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">📈 Evolución de Compras del Producto</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      if (chartRef.current) {
                        const canvas = chartRef.current.canvas
                        const link = document.createElement("a")
                        link.download = `grafico-compras-producto-${idMateriaPrima}-${fechaDesde}-${fechaHasta}.png`
                        link.href = canvas.toDataURL("image/png")
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      } else {
                        setError("No se puede acceder al gráfico")
                      }
                    }}
                    color="primary"
                  >
                    Descargar PNG
                  </Button>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 400 }}>
                  <Line ref={chartRef} data={datosGrafico} options={opcionesGrafico} />
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
                        {estadisticas.cantidadDias}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Días con compras
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        ₲ {estadisticas.totalCompras.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total comprado
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        ₲ {Math.round(estadisticas.promedioCompras).toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Promedio por día
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        ₲ {estadisticas.compraMaxima.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Compra máxima
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        ₲ {estadisticas.compraMinima.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Compra mínima
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Tabla de Resultados Detallados */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID Producto</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Compras Totales</strong></TableCell>
                  <TableCell align="center"><strong>Cantidad Total</strong></TableCell>
                  <TableCell align="right"><strong>Monto Total</strong></TableCell>
                  <TableCell align="right"><strong>Precio Promedio</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comprasDetalladas.map((item, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{item.producto.id}</TableCell>
                    <TableCell>{item.producto.nombre}</TableCell>
                    <TableCell>{item.producto.estado}</TableCell>
                    <TableCell align="center">{item.estadisticas.comprasTotales}</TableCell>
                    <TableCell align="center">{item.estadisticas.cantidadTotal}</TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(item.estadisticas.montoTotal)}
                    </TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(item.estadisticas.precioPromedio)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {comprasDetalladas.length === 0 && !loading && !error && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Ingrese los filtros y haga clic en "Generar Reporte" para ver los resultados.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}