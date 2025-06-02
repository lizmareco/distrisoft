"use client"

import { useState, useEffect, useRef } from "react"
import {
    Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Alert, CircularProgress
} from "@mui/material"
import { PictureAsPdf as PdfIcon, TableChart as ExcelIcon, Search as SearchIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material"
import { exportToExcel } from "@/src/utils/export-utils"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from "chart.js"
import { FileDownload as FileDownloadIcon } from "@mui/icons-material"
import html2canvas from "html2canvas"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend)

function formatFecha(fechaStr) {
    if (!fechaStr) return ""
    const [y, m, d] = fechaStr.split("-")
    if (y && m && d) return `${d}-${m}-${y}`
    return fechaStr
}

export default function ReporteCuentasPorCobrar({ onVolver }) {
    const [cuentas, setCuentas] = useState([])
    const [fechaDesde, setFechaDesde] = useState("")
    const [fechaHasta, setFechaHasta] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [busquedaRealizada, setBusquedaRealizada] = useState(false)
    const chartRef = useRef(null)

    // Buscar cuentas por cobrar
    const handleBuscar = async () => {
        setLoading(true)
        setError(null)
        setBusquedaRealizada(true)
        try {
            const params = []
            if (fechaDesde) params.push(`fechaDesde=${fechaDesde}`)
            if (fechaHasta) params.push(`fechaHasta=${fechaHasta}`)
            const query = params.length ? `?${params.join("&")}` : ""
            const res = await fetch(`/api/reportes/cuentas-por-cobrar${query}`)
            if (!res.ok) throw new Error("Error al obtener datos")
            const data = await res.json()
            setCuentas(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Exportar a Excel
    const handleExportarExcel = () => {
        if (cuentas.length === 0) {
            setError("No hay datos para exportar")
            return
        }
        try {
            const datosFormateados = cuentas.map((c) => ({
                "Factura": c.nro_factura,
                "Documento": c.nro_documento,
                "Nombre": c.nombre,
                "Apellido": c.apellido,
                "Monto Original": c.monto_original,
                "Saldo Restante": c.saldo_restante,
                "Fecha Emisión": formatFecha(c.fecha_emision),
                "Fecha Vencimiento": formatFecha(c.fecha_vencimiento),
                "Plazo (días)": c.plazo_pago,
                "Días Vencidos": c.dias_vencidos,
                "Estado": c.desc_estado_cuenta,
            }))
            exportToExcel(datosFormateados, "cuentas-por-cobrar")
        } catch (error) {
            setError("Error al exportar a Excel: " + error.message)
        }
    }

    // Exportar a PDF
    const handleExportarPDF = () => {
        if (cuentas.length === 0) {
            setError("No hay datos para exportar")
            return
        }
        try {
            const printWindow = window.open("", "_blank")
            printWindow.document.write(`
        <html>
          <head>
            <title>Distribuidora Las Niñas</title>
            <title>Reporte de Cuentas por Cobrar</title>
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
            <h1>Reporte de Cuentas por Cobrar</h1>
            <div class="info">
              <p><strong>Período:</strong> ${formatFecha(fechaDesde) || "-"} al ${formatFecha(fechaHasta) || "-"}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Documento</th>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Monto Original</th>
                  <th>Saldo Restante</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Vencimiento</th>
                  <th>Plazo</th>
                  <th>Días Vencidos</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${cuentas.map(c => `
                  <tr>
                    <td>${c.nro_factura}</td>
                    <td>${c.nro_documento}</td>
                    <td>${c.nombre}</td>
                    <td>${c.apellido}</td>
                    <td class="text-right">₲ ${(c.monto_original || 0).toLocaleString("es-PY")}</td>
                    <td class="text-right">₲ ${(c.saldo_restante || 0).toLocaleString("es-PY")}</td>
                    <td>${formatFecha(c.fecha_emision)}</td>
                    <td>${formatFecha(c.fecha_vencimiento)}</td>
                    <td class="text-right">${c.plazo_pago}</td>
                    <td class="text-right">${c.dias_vencidos}</td>
                    <td>${c.desc_estado_cuenta}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `)
            printWindow.document.close()
            printWindow.print()
        } catch (error) {
            setError("Error al exportar a PDF: " + error.message)
        }
    }

    // Prepara los datos para el gráfico (por cliente)
    const prepararDatosGrafico = () => {
        if (cuentas.length === 0) return null
        const agrupado = {}
        cuentas.forEach((c) => {
            const key = `${c.nombre} ${c.apellido}`
            agrupado[key] = (agrupado[key] || 0) + (c.saldo_restante || 0)
        })
        const labels = Object.keys(agrupado)
        const data = Object.values(agrupado)
        return {
            labels,
            datasets: [
                {
                    label: "Saldo Restante",
                    data,
                    backgroundColor: "rgba(255, 99, 132, 0.6)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                },
            ],
        }
    }

    const opcionesGrafico = {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Cuentas por Cobrar por Cliente" },
            tooltip: {
                callbacks: {
                    label: (context) => `₲ ${context.parsed.x.toLocaleString("es-PY")}`,
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `₲ ${value.toLocaleString("es-PY")}`,
                },
            },
        },
    }

    const handleDescargarGrafico = async () => {
        if (!chartRef.current) return
        try {
            const canvas = await html2canvas(chartRef.current)
            const url = canvas.toDataURL("image/png")
            const link = document.createElement("a")
            link.download = `cuentas-por-cobrar-${new Date().toISOString().slice(0, 10)}.png`
            link.href = url
            link.click()
        } catch (err) {
            setError("No se pudo descargar el gráfico")
        }
    }

    // Estadísticas
    const totalCuentas = cuentas.length
    const totalSaldo = cuentas.reduce((sum, c) => sum + (c.saldo_restante || 0), 0)
    const promedioSaldo = totalCuentas ? totalSaldo / totalCuentas : 0

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 2 }}>
                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ mb: 2 }}>
                    Volver a Reportes
                </Button>
            </Box>
            <Typography variant="h5" gutterBottom>
                Cuentas por Cobrar
            </Typography>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3} alignItems="end">
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
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                            onClick={handleBuscar}
                            disabled={loading}
                        >
                            {loading ? "Buscando..." : "Buscar"}
                        </Button>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="primary"
                            onClick={() => {
                                setFechaDesde("")
                                setFechaHasta("")
                                handleBuscar()
                            }}
                        >
                            Mostrar todas
                        </Button>
                    </Grid>
                </Grid>
                {/* ...resto del código... */}
            </Paper>
            {cuentas.length > 0 && (
                <>
                    <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportarExcel} color="success">
                            Exportar Excel
                        </Button>
                        <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportarPDF} color="error">
                            Exportar PDF
                        </Button>
                    </Box>
                    {cuentas.length > 0 && (
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={8}>
                                <Paper sx={{ p: 2, height: 400 }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                        <Typography variant="h6">Cuentas por Cobrar por Cliente</Typography>
                                        <Button
                                            variant="outlined"
                                            startIcon={<FileDownloadIcon />}
                                            onClick={handleDescargarGrafico}
                                            color="primary"
                                        >
                                            Descargar Gráfico
                                        </Button>
                                    </Box>
                                    <Box ref={chartRef} sx={{ height: 320 }}>
                                        <Bar data={prepararDatosGrafico()} options={opcionesGrafico} />
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Paper sx={{ p: 2, height: "100%" }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Total de Cuentas
                                    </Typography>
                                    <Typography variant="h5">{totalCuentas}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                                        Saldo Total
                                    </Typography>
                                    <Typography variant="h5">₲ {totalSaldo.toLocaleString("es-PY")}</Typography>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                                        Promedio por Cuenta
                                    </Typography>
                                    <Typography variant="h5">₲ {promedioSaldo.toLocaleString("es-PY")}</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Factura</TableCell>
                                    <TableCell>Documento</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Apellido</TableCell>
                                    <TableCell align="right">Monto Original</TableCell>
                                    <TableCell align="right">Saldo Restante</TableCell>
                                    <TableCell>Fecha Emisión</TableCell>
                                    <TableCell>Fecha Vencimiento</TableCell>
                                    <TableCell align="right">Plazo</TableCell>
                                    <TableCell align="right">Días Vencidos</TableCell>
                                    <TableCell>Estado</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cuentas.map((c, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{c.nro_factura}</TableCell>
                                        <TableCell>{c.nro_documento}</TableCell>
                                        <TableCell>{c.nombre}</TableCell>
                                        <TableCell>{c.apellido}</TableCell>
                                        <TableCell align="right">₲ {(c.monto_original || 0).toLocaleString("es-PY")}</TableCell>
                                        <TableCell align="right">₲ {(c.saldo_restante || 0).toLocaleString("es-PY")}</TableCell>
                                        <TableCell>{formatFecha(c.fecha_emision)}</TableCell>
                                        <TableCell>{formatFecha(c.fecha_vencimiento)}</TableCell>
                                        <TableCell align="right">{c.plazo_pago}</TableCell>
                                        <TableCell align="right">{c.dias_vencidos}</TableCell>
                                        <TableCell>{c.desc_estado_cuenta}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
            {!loading && busquedaRealizada && cuentas.length === 0 && (
                <Alert severity="info" sx={{ mt: 3 }}>
                    No se encontraron cuentas por cobrar para el período seleccionado.
                </Alert>
            )}
        </Box>
    )
}