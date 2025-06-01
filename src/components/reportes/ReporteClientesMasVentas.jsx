import { useState, useRef } from "react"
import { format } from "date-fns"
import {
    Button, Box, Typography, Paper, Grid, TextField, Stack,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { Bar } from "react-chartjs-2"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from "chart.js"
import {
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    Download as DownloadIcon,
} from "@mui/icons-material"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend)

function formatMoneda(valor) {
    return new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: "PYG",
        minimumFractionDigits: 0,
    }).format(valor)
}

export default function ReporteClientesMasVentas({ onVolver }) {
    const [fechaDesde, setFechaDesde] = useState(format(new Date(), "yyyy-MM-01"))
    const [fechaHasta, setFechaHasta] = useState(format(new Date(), "yyyy-MM-dd"))
    const [datos, setDatos] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [reporteGenerado, setReporteGenerado] = useState(false)
    const chartRef = useRef(null)

    const handleGenerar = async () => {
        setLoading(true)
        setError(null)
        setReporteGenerado(false)
        try {
            const res = await fetch(`/api/reportes/clientes-mas-ventas?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`)
            const data = await res.json()
            if (!data.success) throw new Error(data.error)
            setDatos(data.data)
            setReporteGenerado(true)
        } catch (err) {
            setError(err.message)
            setReporteGenerado(true)
        } finally {
            setLoading(false)
        }
    }

    // Exportar a Excel
    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(
            datos.map((item, idx) => ({
                "#": idx + 1,
                "ID Cliente": item.id_cliente,
                Cliente: `${item.NOMBRE} ${item.APELLIDO}`,
                "Total Venta": item.total_venta,
            }))
        )
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "ClientesMasVentas")
        XLSX.writeFile(wb, "clientes_mas_ventas.xlsx")
    }

    // Exportar a PDF (formato igual que ReporteVentasProducto)
    const handleExportPDF = () => {
        if (datos.length === 0) {
            setError("No hay datos para exportar")
            return
        }

        try {
            const printWindow = window.open("", "_blank")
            const total = datos.reduce((sum, item) => sum + (item.total_venta || 0), 0)

            printWindow.document.write(`
            <html>
              <head>
                <title>Reporte de Clientes con Más Ventas</title>
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
                <h1>Reporte de Clientes con Más Ventas</h1>
                <div class="info">
                  <p><strong>Período:</strong> ${fechaDesde} al ${fechaHasta}</p>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>id_Cliente</th>
                      <th>Nombre Cliente</th>
                      <th class="text-right">Total Vendido</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${datos
                    .map(
                        (item, idx) => `
                        <tr>
                          <td>${idx + 1}</td>
                          <td>${item.id_cliente}</td>
                          <td>${item.NOMBRE} ${item.APELLIDO}</td>
                          <td class="text-right">₲ ${(item.total_venta || 0).toLocaleString("es-PY")}</td>
                        </tr>
                      `
                    )
                    .join("")}
                    <tr class="total">
                      <td colspan="3"><strong>Total</strong></td>
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

    // Exportar gráfico como PNG
    const handleExportPNG = () => {
        if (chartRef.current) {
            const url = chartRef.current.toBase64Image()
            saveAs(url, "grafico_clientes_mas_ventas.png")
        }
    }

    // Datos para el gráfico (top 10)
    const topClientes = datos.slice(0, 10)
    const chartData = {
        labels: topClientes.map(c => `${c.NOMBRE} ${c.APELLIDO}`),
        datasets: [
            {
                label: "Total Vendido",
                data: topClientes.map(c => c.total_venta),
                backgroundColor: "rgba(54, 162, 235, 0.7)",
            },
        ],
    }
    const chartOptions = {
        indexAxis: "y",
        responsive: true,
        plugins: {
            legend: { display: false },
            title: { display: true, text: "Top 10 Clientes con Más Ventas" },
            tooltip: {
                callbacks: {
                    label: ctx => formatMoneda(ctx.parsed.x),
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { callback: value => formatMoneda(value) },
            },
            y: { ticks: { maxTicksLimit: 10 } },
        },
    }

    // Resumen
    const total = datos.reduce((sum, c) => sum + c.total_venta, 0)
    const promedio = datos.length ? total / datos.length : 0
    const clienteTop = datos[0] ? `${datos[0].NOMBRE} ${datos[0].APELLIDO}` : ""
    const maximo = datos[0]?.total_venta || 0

    return (
        <Paper sx={{ p: 3, maxWidth: 1100, margin: "0 auto" }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onVolver}
                >
                    Volver
                </Button>
                <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
                    Clientes con Más Ventas
                </Typography>
            </Stack>

            {/* Botones de exportación */}
            <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                    variant="outlined"
                    startIcon={<ExcelIcon />}
                    onClick={handleExportExcel}
                    color="success"
                    disabled={datos.length === 0}
                >
                    Exportar Excel
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<PdfIcon />}
                    onClick={handleExportPDF}
                    color="error"
                    disabled={datos.length === 0}
                >
                    Exportar PDF
                </Button>
                <Button
                    size="small"
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportPNG}
                    color="primary"
                    disabled={datos.length === 0}
                >
                    Descargar PNG
                </Button>
            </Box>

            <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
                <Grid container spacing={2} alignItems="center" justifyContent="center">
                    <Grid item>
                        <TextField
                            label="Desde"
                            type="date"
                            size="small"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item>
                        <TextField
                            label="Hasta"
                            type="date"
                            size="small"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            onClick={handleGenerar}
                            disabled={loading}
                        >
                            Generar
                        </Button>
                    </Grid>
                </Grid>
            </Box>
            {loading && <Typography align="center">Cargando...</Typography>}
            {error && <Typography color="error" align="center">{error}</Typography>}
            {reporteGenerado && datos.length === 0 && !loading && !error && (
                <Typography align="center">No se encontraron datos para el período seleccionado.</Typography>
            )}
            {datos.length > 0 && (
                <>
                    <Box sx={{ height: 350, mb: 3 }}>
                        <Bar ref={chartRef} data={chartData} options={chartOptions} />
                    </Box>
                    <Grid container spacing={2} justifyContent="center" sx={{ mb: 2 }}>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="subtitle2">Total Vendido</Typography>
                                <Typography variant="h6">{formatMoneda(total)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="subtitle2">Promedio por Cliente</Typography>
                                <Typography variant="h6">{formatMoneda(promedio)}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="subtitle2">Cliente Top</Typography>
                                <Typography variant="h6">{clienteTop}</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Paper sx={{ p: 2, textAlign: "center" }}>
                                <Typography variant="subtitle2">Venta Máxima</Typography>
                                <Typography variant="h6">{formatMoneda(maximo)}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                    <Typography variant="h6" sx={{ mt: 2, textAlign: "center" }}>
                        Detalle de Clientes
                    </Typography>
                    <Box sx={{ overflowX: "auto", display: "flex", justifyContent: "center" }}>
                        <table border="1" cellPadding={6} style={{ marginTop: 10, minWidth: 400, textAlign: "center" }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Cliente</th>
                                    <th>Total Venta</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datos.map((item, idx) => (
                                    <tr key={item.id_cliente}>
                                        <td>{idx + 1}</td>
                                        <td>{item.NOMBRE} {item.APELLIDO}</td>
                                        <td>{formatMoneda(item.total_venta)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </>
            )}
        </Paper>
    )
}