"use client"

import { useState, useMemo } from "react"
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from "@mui/material"
import {
  Search as SearchIcon,
  TableChart as ExcelIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import { exportToExcel } from "@/src/utils/export-utils"
import dynamic from "next/dynamic"
import "chart.js/auto";

const estadosOptions = [
  "PENDIENTE",
  "RECIBIDO",
  "PARCIALMENTE RECIBIDO",
  "ANULADO",
]

// Importación dinámica de Chart components
const LineChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Line), { ssr: false })
const BarChart = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), { ssr: false })

export default function ReporteComprasOrden({ onVolver }) {
  const [ruc, setRuc] = useState("")
  const [selectedEstados, setSelectedEstados] = useState([])
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [ordenes, setOrdenes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  const handleGenerarReporte = async () => {
    setLoading(true)
    setError(null)
    setBusquedaRealizada(true)
    let query = "/api/reportes/compras/orden-compra"
    const params = []
    if (ruc) params.push(`ruc=${encodeURIComponent(ruc)}`)
    if (selectedEstados.length > 0)
      params.push(`estados=${encodeURIComponent(selectedEstados.join(","))}`)
    if (fechaDesde) params.push(`fechaDesde=${encodeURIComponent(fechaDesde)}`)
    if (fechaHasta) params.push(`fechaHasta=${encodeURIComponent(fechaHasta)}`)
    if (params.length > 0) query += "?" + params.join("&")

    try {
      const res = await fetch(query)
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Error al obtener datos")
      }
      const data = await res.json()
      setOrdenes(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportarExcel = () => {
    if (!ordenes.length) {
      setError("No hay datos para exportar")
      return
    }
    exportToExcel(ordenes, "reporte-ordenes-compra")
  }

  const handleExportarPDF = () => {
    if (!ordenes.length) {
      setError("No hay datos para exportar")
      return
    }
    // Obtener data URLs de los canvas de los gráficos de línea y de barras
    const getChartDataUrl = (chartId) => {
      const canvas = document.querySelector(`#${chartId} canvas`)
      return canvas ? canvas.toDataURL("image/png") : ""
    }
    
    const lineChartImage = getChartDataUrl("lineChart")
    const barChartImage = getChartDataUrl("barChart")

    const printWindow = window.open("", "_blank")
    let htmlContent = `
      <html>
        <head>
          <title>Reporte de Órdenes de Compra</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
            th { background-color: #f2f2f2; }
            .chart { margin-top: 40px; text-align: center; }
            .chart img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <h1>Reporte de Órdenes de Compra</h1>
          <table>
            <thead>
              <tr>
                <th>Fecha Orden</th>
                <th>Estado</th>
                <th>Proveedor</th>
                <th>RUC</th>
                <th>Monto Compra</th>
              </tr>
            </thead>
            <tbody>`
    ordenes.forEach(orden => {
      htmlContent += `
              <tr>
                <td>${new Date(orden.fechaOrden).toLocaleDateString()}</td>
                <td>${orden.estado}</td>
                <td>${orden.proveedor?.nombre || "-"}</td>
                <td>${orden.proveedor?.ruc || "-"}</td>
                <td>${new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(orden.montoCompra)}</td>
              </tr>`
    })
    htmlContent += `
            </tbody>
          </table>
          <div class="chart">
            <h2>Evolución del Monto Total</h2>
            ${lineChartImage ? `<img src="${lineChartImage}" alt="Gráfico de Línea">` : "<p>No disponible</p>"}
          </div>
          <div class="chart">
            <h2>Órdenes por Estado (Barra)</h2>
            ${barChartImage ? `<img src="${barChartImage}" alt="Gráfico de Barras">` : "<p>No disponible</p>"}
          </div>
        </body>
      </html>`
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  // Gráfico de línea: Evolución del monto total por fecha
  const lineChartData = useMemo(() => {
    // Agrupar por fecha (en formato local) y sumar montoCompra
    const groups = {}
    ordenes.forEach(orden => {
      const fecha = new Date(orden.fechaOrden).toLocaleDateString()
      groups[fecha] = (groups[fecha] || 0) + Number(orden.montoCompra)
    })
    const labels = Object.keys(groups).sort((a, b) => new Date(a) - new Date(b))
    const data = labels.map(label => groups[label])
    return {
      labels,
      datasets: [
        {
          label: "Evolución del Monto Total",
          data,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: "rgb(75, 192, 192)",
          pointBorderColor: "#fff",
          pointRadius: 5,
        }
      ]
    }
  }, [ordenes])

  // Gráfico de barras: Cantidad de órdenes por estado
  const barChartData = useMemo(() => {
    const counts = {}
    ordenes.forEach(orden => {
      const estado = orden.estado || "SIN ESTADO"
      counts[estado] = (counts[estado] || 0) + 1
    })
    const labels = Object.keys(counts)
    const data = labels.map(label => counts[label])
    return {
      labels,
      datasets: [
        {
          label: "Órdenes por Estado",
          data,
          backgroundColor: ["#42a5f5", "#66bb6a", "#ffa726", "#ef5350"],
          borderColor: "#fff",
          borderWidth: 1,
        }
      ]
    }
  }, [ordenes])

  return (
    <Box sx={{ p: 3 }}>
      {/* Botón para volver */}
      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onVolver}>
          Volver a Reportes
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Reporte de Órdenes de Compra
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Filtro por RUC"
              placeholder="Ingrese parte del RUC"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="estados-select-label">Estados</InputLabel>
              <Select
                labelId="estados-select-label"
                multiple
                value={selectedEstados}
                onChange={(e) => setSelectedEstados(e.target.value)}
                input={<OutlinedInput label="Estados" />}
                renderValue={(selected) => (selected.length ? selected.join(", ") : "Todos")}
              >
                {estadosOptions.map((estado) => (
                  <MenuItem key={estado} value={estado}>
                    <Checkbox checked={selectedEstados.indexOf(estado) > -1} />
                    <ListItemText primary={estado} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
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
          <Grid item xs={12} md={12}>
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

      {busquedaRealizada && !loading && ordenes.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No se encontraron órdenes de compra con los filtros indicados.
        </Alert>
      )}

      {ordenes.length > 0 && (
        <>
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportarExcel} color="success">
              Exportar Excel
            </Button>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportarPDF} color="error">
              Exportar PDF
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Fecha Orden</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Proveedor</strong></TableCell>
                  <TableCell><strong>RUC</strong></TableCell>
                  <TableCell align="right"><strong>Monto Compra</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordenes.map((orden, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{new Date(orden.fechaOrden).toLocaleDateString()}</TableCell>
                    <TableCell>{orden.estado}</TableCell>
                    <TableCell>{orden.proveedor?.nombre || "-"}</TableCell>
                    <TableCell>{orden.proveedor?.ruc || "-"}</TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", minimumFractionDigits: 0 }).format(orden.montoCompra)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Gráficos */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Evolución del Monto Total
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }} id="lineChart">
              <LineChart data={lineChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "top" },
                  title: { display: true, text: "Evolución del Monto Total" },
                  tooltip: {
                    callbacks: {
                      label: (context) =>
                        new Intl.NumberFormat("es-PY", {
                          style: "currency",
                          currency: "PYG",
                          minimumFractionDigits: 0
                        }).format(context.parsed.y || 0)
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Monto (₲)" }
                  },
                  x: { title: { display: true, text: "Fecha" } }
                }
              }} height={300} />
            </Paper>

            <Typography variant="h6" gutterBottom>
              Órdenes por Estado (Barra)
            </Typography>
            <Paper sx={{ p: 2, mb: 3 }} id="barChart">
              <BarChart data={barChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: "Cantidad de Órdenes por Estado" },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Cantidad" }
                  },
                  x: { title: { display: true, text: "Estado" } }
                }
              }} height={300} />
            </Paper>
          </Box>
        </>
      )}

      {!loading && !error && !ordenes.length && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Ingrese los filtros y haga clic en "Generar Reporte" para ver las órdenes de compra.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}