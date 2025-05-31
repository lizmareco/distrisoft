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
  Autocomplete,
} from "@mui/material"
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
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

export default function ReporteVentasProducto() {
  const [productos, setProductos] = useState([])
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")
  const [ventasDetalladas, setVentasDetalladas] = useState([])
  const [ventasAgrupadas, setVentasAgrupadas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [chartLoaded, setChartLoaded] = useState(false)

  // Referencia al gráfico para poder descargarlo
  const chartRef = useRef(null)

  // Cargar productos al montar el componente
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await fetch("/api/productos")
        if (response.ok) {
          const data = await response.json()
          setProductos(data)
        }
      } catch (error) {
        console.error("Error al cargar productos:", error)
      }
    }

    cargarProductos()
  }, [])

  // Registrar componentes de Chart.js
  useEffect(() => {
    const registerChartComponents = async () => {
      try {
        const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } = await import(
          "chart.js"
        )

        Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)
        setChartLoaded(true)
      } catch (error) {
        console.error("Error al cargar Chart.js:", error)
      }
    }

    registerChartComponents()
  }, [])

  // Generar reporte
  const handleGenerarReporte = async () => {
    if (!productoSeleccionado || !fechaDesde || !fechaHasta) {
      setError("Todos los campos son requeridos")
      return
    }

    setLoading(true)
    setError(null)
    setBusquedaRealizada(true)
    console.log("Iniciando generación de reporte con:", { productoSeleccionado, fechaDesde, fechaHasta })

    try {
      // Obtener datos detallados
      const urlDetallado = `/api/reportes/ventas-producto?idProducto=${productoSeleccionado.idProducto}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&tipo=detallado`
      console.log("Llamando a URL detallado:", urlDetallado)

      const responseDetallado = await fetch(urlDetallado)
      console.log("Response detallado status:", responseDetallado.status)

      if (!responseDetallado.ok) {
        const errorData = await responseDetallado.json()
        console.error("Error en response detallado:", errorData)
        throw new Error(errorData.error || "Error al obtener datos detallados")
      }

      const datosDetallados = await responseDetallado.json()
      console.log("Datos detallados recibidos:", datosDetallados)
      setVentasDetalladas(datosDetallados)

      if (datosDetallados.length === 0) {
        console.log("No se encontraron datos detallados")
        setVentasAgrupadas([])
        return
      }

      // Obtener datos agrupados para estadísticas y gráfico
      const urlAgrupado = `/api/reportes/ventas-producto?idProducto=${productoSeleccionado.idProducto}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&tipo=agrupado`
      console.log("Llamando a URL agrupado:", urlAgrupado)

      const responseAgrupado = await fetch(urlAgrupado)
      console.log("Response agrupado status:", responseAgrupado.status)

      if (!responseAgrupado.ok) {
        const errorData = await responseAgrupado.json()
        console.error("Error en response agrupado:", errorData)
        throw new Error(errorData.error || "Error al obtener datos agrupados")
      }

      const datosAgrupados = await responseAgrupado.json()
      console.log("Datos agrupados recibidos:", datosAgrupados)
      setVentasAgrupadas(datosAgrupados)

      console.log("Reporte generado exitosamente")
    } catch (error) {
      console.error("Error al generar reporte:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Exportar a Excel
  const handleExportarExcel = () => {
    if (ventasDetalladas.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      console.log("Exportando a Excel:", ventasDetalladas)
      exportToExcel(ventasDetalladas, `reporte-ventas-producto-${productoSeleccionado?.nombreProducto || "producto"}`)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      setError("Error al exportar a Excel: " + error.message)
    }
  }

  // Exportar a PDF
  const handleExportarPDF = () => {
    if (ventasDetalladas.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      console.log("Exportando a PDF:", ventasDetalladas)
      const printWindow = window.open("", "_blank")
      const total = ventasDetalladas.reduce((sum, venta) => sum + (venta.SUBTOTAL || 0), 0)

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Ventas por Producto</title>
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
            <h1>Reporte de Ventas por Producto</h1>
            <div class="info">
              <p><strong>Producto:</strong> ${productoSeleccionado?.nombreProducto || ""}</p>
              <p><strong>Descripción:</strong> ${productoSeleccionado?.descripcion || ""}</p>
              <p><strong>Período:</strong> ${fechaDesde} al ${fechaHasta}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Fecha</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${ventasDetalladas
                  .map(
                    (venta) => `
                  <tr>
                    <td>${venta.NOMBRE_PRODUCTO || ""}</td>
                    <td>${venta.FECHA_VENTA || ""}</td>
                    <td>${venta.CANTIDAD || 0}</td>
                    <td class="text-right">₲ ${(venta.PRECIO_UNITARIO || 0).toLocaleString("es-PY")}</td>
                    <td class="text-right">₲ ${(venta.SUBTOTAL || 0).toLocaleString("es-PY")}</td>
                  </tr>
                `,
                  )
                  .join("")}
                <tr class="total">
                  <td colspan="4"><strong>Total</strong></td>
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
      // Obtener el canvas del gráfico
      const canvas = chartRef.current.canvas

      // Crear un enlace temporal para la descarga
      const link = document.createElement("a")
      link.download = `grafico-ventas-producto-${productoSeleccionado?.nombreProducto || "producto"}-${fechaDesde}-${fechaHasta}.png`
      link.href = canvas.toDataURL("image/png")

      // Simular click para descargar
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("Gráfico descargado exitosamente")
    } catch (error) {
      console.error("Error al descargar gráfico:", error)
      setError("Error al descargar el gráfico: " + error.message)
    }
  }

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    if (ventasAgrupadas.length === 0) return null

    const totalVentas = ventasAgrupadas.reduce((sum, item) => sum + (item.totalVenta || 0), 0)
    const promedioVentas = totalVentas / ventasAgrupadas.length
    const ventaMaxima = Math.max(...ventasAgrupadas.map((item) => item.totalVenta || 0))
    const ventaMinima = Math.min(...ventasAgrupadas.map((item) => item.totalVenta || 0))

    return {
      totalVentas,
      promedioVentas,
      ventaMaxima,
      ventaMinima,
      cantidadDias: ventasAgrupadas.length,
    }
  }

  // Función para parsear fecha en formato DD-MM-YYYY
  const parsearFecha = (fechaStr) => {
    if (!fechaStr) return new Date(0)

    // Si la fecha viene en formato DD-MM-YYYY
    if (fechaStr.includes("-") && fechaStr.length === 10) {
      const [dia, mes, año] = fechaStr.split("-")
      return new Date(año, mes - 1, dia) // mes - 1 porque los meses en JS van de 0-11
    }

    // Si viene en otro formato, intentar parsearlo directamente
    return new Date(fechaStr)
  }

  // Preparar datos para el gráfico
  const prepararDatosGrafico = () => {
    if (ventasAgrupadas.length === 0) return null

    console.log("Datos agrupados antes de ordenar:", ventasAgrupadas)

    // Ordenar por fecha correctamente
    const datosOrdenados = [...ventasAgrupadas].sort((a, b) => {
      const fechaA = parsearFecha(a.fecha)
      const fechaB = parsearFecha(b.fecha)
      return fechaA - fechaB
    })

    console.log("Datos ordenados:", datosOrdenados)

    return {
      labels: datosOrdenados.map((item) => {
        // Mantener el formato original de la fecha para mostrar
        return item.fecha
      }),
      datasets: [
        {
          label: "Ventas del Producto por Día",
          data: datosOrdenados.map((item) => item.totalVenta || 0),
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointBackgroundColor: "rgb(255, 99, 132)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
          pointRadius: 5,
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
        text: "Evolución de Ventas del Producto",
        font: {
          size: 16,
          weight: "bold",
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `Ventas: ₲ ${(context.parsed.y || 0).toLocaleString("es-PY")}`,
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
          text: "Monto de Ventas (₲)",
        },
      },
      x: {
        title: {
          display: true,
          text: "Fecha",
        },
      },
    },
  }

  const estadisticas = calcularEstadisticas()
  const datosGrafico = prepararDatosGrafico()

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Reporte de Ventas por Producto
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="end">
          <Grid item xs={12} md={3}>
            <Autocomplete
              fullWidth
              options={productos}
              getOptionLabel={(option) => `${option.nombreProducto || ""} - ${option.descripcion || ""}`}
              value={productoSeleccionado}
              onChange={(event, newValue) => setProductoSeleccionado(newValue)}
              renderInput={(params) => <TextField {...params} label="Seleccionar Producto" />}
              isOptionEqualToValue={(option, value) => option.idProducto === value?.idProducto}
            />
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
      {!loading && !error && busquedaRealizada && ventasDetalladas.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📋 Sin resultados
          </Typography>
          <Typography>
            No se encontraron ventas para el producto <strong>{productoSeleccionado?.nombreProducto || ""}</strong> en
            el período del <strong>{fechaDesde}</strong> al <strong>{fechaHasta}</strong>.
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              Verifique que:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 0 }}>
              <li>El producto seleccionado sea correcto</li>
              <li>El producto tenga ventas completadas en el período seleccionado</li>
              <li>Las fechas estén en el formato correcto</li>
            </Box>
          </Box>
        </Alert>
      )}

      {ventasDetalladas.length > 0 && (
        <>
          {/* Botones de exportación */}
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button variant="outlined" startIcon={<ExcelIcon />} onClick={handleExportarExcel} color="success">
              Exportar Excel
            </Button>
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportarPDF} color="error">
              Exportar PDF
            </Button>
            {chartLoaded && datosGrafico && (
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDescargarGrafico} color="primary">
                Descargar Gráfico PNG
              </Button>
            )}
          </Box>

          {/* Gráfico de evolución de ventas */}
          {chartLoaded && datosGrafico && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">📈 Evolución de Ventas del Producto</Typography>
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
                        Días con ventas
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
                        ₲ {Math.round(estadisticas.promedioVentas).toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Promedio por día
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        ₲ {estadisticas.ventaMaxima.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Venta máxima
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={2.4}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="error.main">
                        ₲ {estadisticas.ventaMinima.toLocaleString("es-PY")}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Venta mínima
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
                  <TableCell>Producto</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Precio Unitario</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventasDetalladas.map((venta, index) => (
                  <TableRow key={index}>
                    <TableCell>{venta.NOMBRE_PRODUCTO || ""}</TableCell>
                    <TableCell>{venta.FECHA_VENTA || ""}</TableCell>
                    <TableCell align="right">{venta.CANTIDAD || 0}</TableCell>
                    <TableCell align="right">₲ {(venta.PRECIO_UNITARIO || 0).toLocaleString("es-PY")}</TableCell>
                    <TableCell align="right">₲ {(venta.SUBTOTAL || 0).toLocaleString("es-PY")}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell colSpan={4}>
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>
                      ₲{" "}
                      {ventasDetalladas.reduce((sum, venta) => sum + (venta.SUBTOTAL || 0), 0).toLocaleString("es-PY")}
                    </strong>
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
