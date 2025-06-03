"use client"

import { useState } from "react"
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Menu,
  MenuItem,
} from "@mui/material"
import { 
  Search as SearchIcon, 
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon
} from "@mui/icons-material"
import { exportToExcel } from "@/src/utils/export-utils" // Asegúrate de tener esta utilidad

export default function ReporteComprasProveedor() {
  const [filtros, setFiltros] = useState({
    rucProveedor: "",
    fechaInicio: "",
    fechaFin: "",
  })
  const [compras, setCompras] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [proveedor, setProveedor] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [anchorEl, setAnchorEl] = useState(null)

  // Buscar compras directamente por RUC
  const buscarCompras = async () => {
    if (!filtros.rucProveedor || !filtros.fechaInicio || !filtros.fechaFin) {
      setError("Por favor complete todos los campos requeridos")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Primero obtener todas las compras para buscar por RUC
      const params = new URLSearchParams({
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
      })

      const response = await fetch(`/api/reportes/compras/proveedor?${params}`)

      if (!response.ok) {
        throw new Error("Error al obtener las compras")
      }

      const data = await response.json()

      // Filtrar por RUC del proveedor
      const comprasFiltradas = data.compras.filter((compra) => compra.proveedor?.empresa?.ruc === filtros.rucProveedor)

      if (comprasFiltradas.length === 0) {
        setError(`No se encontraron compras para el RUC ${filtros.rucProveedor} en el período seleccionado`)
        setCompras([])
        setEstadisticas(null)
        setProveedor(null)
        setLoading(false)
        return
      }

      // Establecer información del proveedor desde la primera compra
      setProveedor({
        idProveedor: comprasFiltradas[0].proveedor.idProveedor,
        empresa: comprasFiltradas[0].proveedor.empresa,
      })

      // Calcular estadísticas para las compras filtradas
      const estadisticasFiltradas = {
        totalCompras: comprasFiltradas.length,
        montoTotalGeneral: comprasFiltradas.reduce((sum, compra) => sum + compra.montoTotalFactura, 0),
        comprasContado: comprasFiltradas.filter((c) => c.esContado).length,
        comprasCredito: comprasFiltradas.filter((c) => !c.esContado).length,
        montoContado: comprasFiltradas.filter((c) => c.esContado).reduce((sum, c) => sum + c.montoTotalFactura, 0),
        montoCredito: comprasFiltradas.filter((c) => !c.esContado).reduce((sum, c) => sum + c.montoTotalFactura, 0),
        totalSaldoPendiente: comprasFiltradas
          .filter((c) => !c.esContado && c.cuentaPorPagar)
          .reduce((sum, c) => sum + c.cuentaPorPagar.saldoRestante, 0),
        totalMontoPagado: comprasFiltradas
          .filter((c) => !c.esContado && c.cuentaPorPagar)
          .reduce((sum, c) => sum + c.cuentaPorPagar.montoPagado, 0),
        facturasPendientes: comprasFiltradas.filter(
          (c) => !c.esContado && c.cuentaPorPagar && c.cuentaPorPagar.saldoRestante > 0,
        ).length,
        facturasVencidas: comprasFiltradas.filter(
          (c) => !c.esContado && c.cuentaPorPagar && c.cuentaPorPagar.diasVencido > 0,
        ).length,
      }

      setCompras(comprasFiltradas)
      setEstadisticas(estadisticasFiltradas)
    } catch (error) {
      console.error("Error al buscar compras:", error)
      setError("Error al obtener los datos. Por favor intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  // Formatear moneda
  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(monto)
  }

  // Formatear fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-PY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      rucProveedor: "",
      fechaInicio: "",
      fechaFin: "",
    })
    setCompras([])
    setEstadisticas(null)
    setProveedor(null)
    setError("")
  }

  // Exportar a Excel
  const handleExportarExcel = () => {
    if (compras.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      // Preparar datos para exportación
      const datosExportar = compras.map(compra => ({
        "Nro. Factura": compra.nroFactura,
        "Fecha Emisión": formatearFecha(compra.fechaEmision),
        "Orden Compra": compra.ordenCompra?.idOrdenCompra || "N/A",
        "Tipo": compra.esContado ? "CONTADO" : "CRÉDITO",
        "Estado": compra.estadoFacturaProv?.descEstadoFacturaProv,
        "Monto Total": compra.montoTotalFactura,
        "Saldo Pendiente": compra.esContado ? 0 : (compra.cuentaPorPagar?.saldoRestante || 0)
      }))

      exportToExcel(
        datosExportar, 
        `compras-proveedor-${proveedor?.empresa?.razonSocial || 'proveedor'}-${filtros.fechaInicio}-a-${filtros.fechaFin}`
      )
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      setError("Error al exportar a Excel: " + error.message)
    }
  }

  // Exportar a PDF
  const handleExportarPDF = () => {
    if (compras.length === 0) {
      setError("No hay datos para exportar")
      return
    }

    try {
      const printWindow = window.open("", "_blank")
      const totalMonto = compras.reduce((sum, compra) => sum + compra.montoTotalFactura, 0)
      const totalSaldoPendiente = compras.reduce((sum, compra) => {
        if (!compra.esContado && compra.cuentaPorPagar) {
          return sum + compra.cuentaPorPagar.saldoRestante
        }
        return sum
      }, 0)

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Compras por Proveedor</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; text-align: center; }
              .info { margin-bottom: 20px; background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #f2f2f2; font-weight: bold; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              .text-right { text-align: right; }
              .footer { margin-top: 30px; text-align: right; font-size: 0.8em; color: #666; }
            </style>
          </head>
          <body>
            <h1>Reporte de Compras por Proveedor</h1>
            
            <div class="info">
              <p><strong>Proveedor:</strong> ${proveedor?.empresa?.razonSocial || 'N/A'}</p>
              <p><strong>RUC:</strong> ${proveedor?.empresa?.ruc || 'N/A'}</p>
              <p><strong>Período:</strong> ${filtros.fechaInicio} al ${filtros.fechaFin}</p>
              <p><strong>Total Facturas:</strong> ${compras.length}</p>
              <p><strong>Monto Total:</strong> ${formatearMoneda(totalMonto)}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Nro. Factura</th>
                  <th>Fecha Emisión</th>
                  <th>Orden Compra</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Monto Total</th>
                  <th>Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody>
                ${compras.map(compra => `
                  <tr>
                    <td>${compra.nroFactura}</td>
                    <td>${formatearFecha(compra.fechaEmision)}</td>
                    <td>${compra.ordenCompra?.idOrdenCompra || "N/A"}</td>
                    <td>${compra.esContado ? "CONTADO" : "CRÉDITO"}</td>
                    <td>${compra.estadoFacturaProv?.descEstadoFacturaProv || "N/A"}</td>
                    <td class="text-right">${formatearMoneda(compra.montoTotalFactura)}</td>
                    <td class="text-right">${
                      compra.esContado 
                        ? "PAGADO" 
                        : formatearMoneda(compra.cuentaPorPagar?.saldoRestante || 0)
                    }</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="5">Total General</td>
                  <td class="text-right">${formatearMoneda(totalMonto)}</td>
                  <td class="text-right">${formatearMoneda(totalSaldoPendiente)}</td>
                </tr>
              </tbody>
            </table>
            
            <div class="footer">
              <p>Generado el ${new Date().toLocaleDateString('es-PY')}</p>
            </div>
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

  // Manejar menú de exportación
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Reporte de Compras por Proveedor
      </Typography>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros de Búsqueda
        </Typography>

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="RUC del Proveedor"
              value={filtros.rucProveedor}
              onChange={(e) => setFiltros({ ...filtros, rucProveedor: e.target.value })}
              placeholder="Ej: 36470981-9"
              helperText="Ingrese el RUC completo con guión"
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha Inicio"
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros({ ...filtros, fechaInicio: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha Fin"
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros({ ...filtros, fechaFin: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={buscarCompras}
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={20} /> : "Buscar"}
              </Button>
              <Button variant="outlined" onClick={limpiarFiltros}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Información del Proveedor */}
      {proveedor && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Información del Proveedor
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Razón Social:</strong> {proveedor.empresa?.razonSocial}
              </Typography>
              <Typography variant="body1">
                <strong>RUC:</strong> {proveedor.empresa?.ruc}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Teléfono:</strong> {proveedor.empresa?.telefono || "No disponible"}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {proveedor.empresa?.correoEmpresa || "No disponible"}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Estadísticas */}
      {estadisticas && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {estadisticas.totalCompras}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Facturas
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="success.main">
                  {formatearMoneda(estadisticas.montoTotalGeneral)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto Total
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="info.main">
                  {formatearMoneda(estadisticas.montoContado)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compras Contado ({estadisticas.comprasContado})
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h6" color="warning.main">
                  {formatearMoneda(estadisticas.montoCredito)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compras Crédito ({estadisticas.comprasCredito})
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabla de Compras */}
      {compras.length > 0 && (
        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Detalle de Compras ({compras.length} facturas)</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button 
                startIcon={<DownloadIcon />} 
                variant="outlined" 
                size="small"
                onClick={handleMenuOpen}
              >
                Exportar
              </Button>
              
              {/* Menú de exportación */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => {
                  handleExportarExcel()
                  handleMenuClose()
                }}>
                  <ExcelIcon sx={{ mr: 1, color: 'success.main' }} /> Excel
                </MenuItem>
                <MenuItem onClick={() => {
                  handleExportarPDF()
                  handleMenuClose()
                }}>
                  <PdfIcon sx={{ mr: 1, color: 'error.main' }} /> PDF
                </MenuItem>
              </Menu>
            </Box>
          </Box>

          <Divider />

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Nro. Factura</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Fecha Emisión</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Orden Compra</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Tipo</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Estado</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Monto Total</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Saldo Pendiente</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {compras.map((compra) => (
                  <TableRow key={compra.idFacturaProveedor} hover>
                    <TableCell>{compra.nroFactura}</TableCell>
                    <TableCell>{formatearFecha(compra.fechaEmision)}</TableCell>
                    <TableCell>{compra.ordenCompra?.idOrdenCompra || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={compra.esContado ? "CONTADO" : "CRÉDITO"}
                        color={compra.esContado ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={compra.estadoFacturaProv?.descEstadoFacturaProv} color="info" size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatearMoneda(compra.montoTotalFactura)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {!compra.esContado && compra.cuentaPorPagar ? (
                        <Typography
                          variant="body2"
                          color={compra.cuentaPorPagar.saldoRestante > 0 ? "error" : "success"}
                          fontWeight="bold"
                        >
                          {formatearMoneda(compra.cuentaPorPagar.saldoRestante)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="success">
                          PAGADO
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Mensaje cuando no hay datos */}
      {compras.length === 0 && !loading && !error && (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Ingrese los filtros y haga clic en "Buscar" para ver los resultados.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}