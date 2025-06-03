import { useState } from "react"
import { Box, Typography, Button, Paper, Grid, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material"
import { Download, PictureAsPdf, InsertChart } from "@mui/icons-material"
import { DatePicker } from "@mui/x-date-pickers"
import dayjs from "dayjs"
import { saveAs } from "file-saver"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import "jspdf-autotable"
import autoTable from "jspdf-autotable"
import { Bar } from "react-chartjs-2"
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

function formatFecha(fechaStr) {
    if (!fechaStr) return ""
    const [y, m, d] = fechaStr.split("-")
    if (y && m && d) return `${d}-${m}-${y}`
    return fechaStr
}

const ESTADOS = [
    { label: "Emitida", value: 1 },
    { label: "Cobrada", value: 3 },
    { label: "Anulada", value: 4 },
]

// Simulación de fetch, reemplaza por tu llamada real a la API
async function fetchFacturas({ fechaDesde, fechaHasta, estado }) {
    const res = await fetch("/api/reportes/facturas-emitidas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fechaDesde, fechaHasta, estado }),
    })
    const json = await res.json()
    return json.data || []
}

export default function ReporteFacturasEmitidas({ onVolver }) {
    const [fechaDesde, setFechaDesde] = useState(dayjs().startOf("month"))
    const [fechaHasta, setFechaHasta] = useState(dayjs())
    const [estado, setEstado] = useState(1)
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    const handleBuscar = async () => {
        setLoading(true)
        const facturas = await fetchFacturas({
            fechaDesde: fechaDesde.format("YYYY-MM-DD"),
            fechaHasta: fechaHasta.format("YYYY-MM-DD"),
            estado,
        })
        setData(facturas)
        setLoading(false)
    }

    // Estadísticos
    const totalFacturas = data.length
    const totalMonto = data.reduce((acc, f) => acc + Number(f.MONTO_TOTAL), 0)

    // Datos para gráfico
    const chartData = {
        labels: data.map(f => f.NRO_FACTURA),
        datasets: [
            {
                label: "Monto Total",
                data: data.map(f => f.MONTO_TOTAL),
                backgroundColor: "#1976d2",
            },
        ],
    }

    // Exportar Excel
    const handleExportExcel = () => {
        const dataToExport = data.map(f => ({
            ...f,
            FECHA_EMISION: formatFecha(f.FECHA_EMISION),
            FECHA_VENCIMIENTO: formatFecha(f.FECHA_VENCIMIENTO),
        }))
        const ws = XLSX.utils.json_to_sheet(dataToExport) // <--- usa dataToExport aquí
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Facturas")
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        saveAs(new Blob([buf]), "facturas_emitidas.xlsx")
    }

    // Exportar PDF
    const handleExportPDF = () => {
        if (data.length === 0) {
            alert("No hay datos para exportar")
            return
        }
        try {
            const printWindow = window.open("", "_blank")
            printWindow.document.write(`
<html>
  <head>
    <title>Distribuidora Las Niñas</title>
    <title>Reporte de Facturas Emitidas</title>
    <style>
      @media print {
        @page { size: landscape; }
      }
      body { font-family: Arial, sans-serif; margin: 10px; }
      h1 { color: #333; font-size: 16px; }
      .info { margin-bottom: 10px; font-size: 11px; }
      .table-container { width: 100%; overflow-x: auto; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 8px; table-layout: fixed; }
      th, td { border: 1px solid #ddd; padding: 2px 1px; text-align: left; word-break: break-word; }
      th { background-color: #f2f2f2; }
      .total { font-weight: bold; background-color: #f9f9f9; }
      .text-right { text-align: right; }
    </style>
  </head>
  <body>
    <h1>Reporte de Facturas Emitidas</h1>
    <div class="info">
      <p><strong>Período:</strong> ${formatFecha(fechaDesde.format("YYYY-MM-DD")) || "-"} al ${formatFecha(fechaHasta.format("YYYY-MM-DD")) || "-"}</p>
      <p><strong>Estado:</strong> ${ESTADOS.find(e => e.value === estado)?.label || "-"}</p>
    </div>
    <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width:55px;">Nro Factura</th>
          <th style="width:45px;">F. Emisión</th>
          <th style="width:45px;">Doc.</th>
          <th style="width:55px;">Nombre</th>
          <th style="width:55px;">Apellido</th>
          <th style="width:40px;">ID Pedido</th>
          <th style="width:45px;">Usuario</th>
          <th style="width:45px;">Impuesto</th>
          <th style="width:55px;">Monto</th>
          <th style="width:45px;">Estado</th>
          <th style="width:35px;">Contado</th>
          <th style="width:55px;">Mét. Pago</th>
          <th style="width:40px;">Plazo</th>
          <th style="width:45px;">Venc.</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(f => `
          <tr>
            <td>${f.NRO_FACTURA}</td>
            <td>${formatFecha(f.FECHA_EMISION)}</td>
            <td>${f.NRO_DOCUMENTO}</td>
            <td>${f.NOMBRE}</td>
            <td>${f.APELLIDO}</td>
            <td>${f.ID_PEDIDO}</td>
            <td>${f.USUARIO}</td>
            <td>${f.IMPUESTO}</td>
            <td class="text-right">${(f.MONTO_TOTAL || 0).toLocaleString("es-PY")}</td>
            <td>${f.ESTADO_FACTURA}</td>
            <td>${f.ES_CONTADO ? "Sí" : "No"}</td>
            <td>${f.METODO_PAGO}</td>
            <td class="text-right">${f.PLAZO_PAGO}</td>
            <td>${formatFecha(f.FECHA_VENCIMIENTO)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    </div>
  </body>
</html>
`)
            printWindow.document.close()
            printWindow.print()
        } catch (error) {
            alert("Error al exportar a PDF: " + error.message)
        }
    }

    // Exportar gráfico
    const handleExportChart = () => {
        const chart = document.getElementById("facturas-chart")
        if (!chart) return
        const url = chart.toDataURL("image/png")
        const a = document.createElement("a")
        a.href = url
        a.download = "grafico_facturas.png"
        a.click()
    }

    return (
        <Box>
            <Button onClick={onVolver} variant="outlined" sx={{ mb: 2 }}>
                Volver
            </Button>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <DatePicker
                            label="Desde"
                            value={fechaDesde}
                            onChange={setFechaDesde}
                            format="DD-MM-YYYY"
                            slotProps={{ textField: { fullWidth: true, size: "small" } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <DatePicker
                            label="Hasta"
                            value={fechaHasta}
                            onChange={setFechaHasta}
                            format="DD-MM-YYYY"
                            slotProps={{ textField: { fullWidth: true, size: "small" } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <ToggleButtonGroup
                            value={estado}
                            exclusive
                            onChange={(_, v) => v && setEstado(v)}
                            size="small"
                            fullWidth
                        >
                            {ESTADOS.map(e => (
                                <ToggleButton key={e.value} value={e.value}>{e.label}</ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={12} sm={12}>
                        <Button variant="contained" onClick={handleBuscar} disabled={loading}>
                            Buscar
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1">Estadísticas</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Typography>Total Facturas: <b>{totalFacturas}</b></Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Typography>Total Monto: <b>{totalMonto.toLocaleString()}</b></Typography>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Gráfico de Montos por Factura</Typography>
                <Bar
                    id="facturas-chart"
                    data={chartData}
                    options={{
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: { x: { title: { display: true, text: "Nro de Factura" } }, y: { title: { display: true, text: "Monto" } } }
                    }}
                />
                <Box sx={{ mt: 1 }}>
                    <Button startIcon={<InsertChart />} onClick={handleExportChart}>Exportar Gráfico</Button>
                </Box>
            </Paper>

            <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Detalle de Facturas</Typography>
                <Box sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th>Nro Factura</th>
                                <th>Fecha Emisión</th>
                                <th>Documento</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>ID Pedido</th>
                                <th>Usuario</th>
                                <th>Impuesto</th>
                                <th>Monto Total</th>
                                <th>Estado</th>
                                <th>Contado</th>
                                <th>Método Pago</th>
                                <th>Plazo Pago</th>
                                <th>Vencimiento</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((f, i) => (
                                <tr key={i}>
                                    <td>{f.NRO_FACTURA}</td>
                                    <td>{formatFecha(f.FECHA_EMISION)}</td>
                                    <td>{f.NRO_DOCUMENTO}</td>
                                    <td>{f.NOMBRE}</td>
                                    <td>{f.APELLIDO}</td>
                                    <td>{f.ID_PEDIDO}</td>
                                    <td>{f.USUARIO}</td>
                                    <td>{f.IMPUESTO}</td>
                                    <td>{f.MONTO_TOTAL.toLocaleString()}</td>
                                    <td>{f.ESTADO_FACTURA}</td>
                                    <td>{f.ES_CONTADO ? "Sí" : "No"}</td>
                                    <td>{f.METODO_PAGO}</td>
                                    <td>{f.PLAZO_PAGO}</td>
                                    <td>{formatFecha(f.FECHA_VENCIMIENTO)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Button startIcon={<Download />} onClick={handleExportExcel} sx={{ mr: 1 }}>Exportar Excel</Button>
                    <Button startIcon={<PictureAsPdf />} onClick={handleExportPDF}>Exportar PDF</Button>
                </Box>
            </Paper>
        </Box>
    )
}