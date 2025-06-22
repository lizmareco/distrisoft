"use client"

import React from "react"

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Grid,
  IconButton,
} from "@mui/material"
import { Close as CloseIcon, Print as PrintIcon } from "@mui/icons-material"

export default function VistaPreviaFactura({ open, onClose, facturaId }) {
  const [datosFactura, setDatosFactura] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    if (open && facturaId) {
      cargarDatosFactura()
    }
  }, [open, facturaId])

  const cargarDatosFactura = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log("Cargando factura ID:", facturaId)
      const response = await fetch(`/api/finanzas/facturas-clientes/${facturaId}`)
      const data = await response.json()

      console.log("Respuesta completa de la API:", data)

      if (!data.success) {
        throw new Error(data.error || "Error al cargar la factura")
      }

      if (!data.data) {
        throw new Error("No se recibieron datos de la factura")
      }

      // Usar los datos reales de la API
      const facturaData = data.data
      console.log("Datos reales de la factura:", facturaData)

      // Formatear datos para la vista previa usando datos reales
      const facturaFormateada = {
        numero: `001-001-${String(facturaData.nroFactura || 0).padStart(7, "0")}`,
        timbrado: "17184746",
        fechaEmision: facturaData.fechaEmision
          ? new Date(facturaData.fechaEmision).toLocaleDateString("es-PY")
          : new Date().toLocaleDateString("es-PY"),
        condicion: facturaData.esContado ? "CONTADO" : "CREDITO",

        // Datos reales del cliente
        cliente: {
          nombre: facturaData.cliente?.nombre || "Cliente no especificado",
          ruc: facturaData.cliente?.ruc || "N/A",
          direccion: facturaData.cliente?.direccion || "N/A",
        },

        // Productos con datos reales del detalle
        productos: (facturaData.detalles || []).map((detalle, index) => {
          console.log(`Procesando detalle real ${index}:`, detalle)

          // Usar la descripción completa que ya viene de la API
          let descripcionCompleta = detalle.descripcion || `Producto ${index + 1}`
          const unidadesPorPaquete = detalle.unidadesPorPaquete || 1

          // Solo agregar información de paquetes si no está ya incluida en la descripción
          if (!descripcionCompleta.includes("paq.") && !descripcionCompleta.includes("cajas")) {
            const tipoProducto = detalle.tipoProducto?.toLowerCase() || ""
            
            if (tipoProducto.includes("edulcorante") || tipoProducto.includes("sal")) {
              descripcionCompleta += ` (${detalle.cantidad || 0} paq. x ${unidadesPorPaquete} sobres)`
            } else if (tipoProducto.includes("azúcar") || tipoProducto.includes("azucar")) {
              descripcionCompleta += ` (${detalle.cantidad || 0} paq. x ${unidadesPorPaquete} sobres)`
            } else if (tipoProducto.includes("cocido")) {
              descripcionCompleta += ` (${detalle.cantidad || 0} cajas x ${unidadesPorPaquete} unid.)`
            }
          }

          return {
            cantidad: detalle.cantidad || 0,
            descripcion: descripcionCompleta,
            precioUnitario: detalle.precioUnitario || 0,
            total: detalle.totalLinea || 0, // Usar totalLinea de la BD
            iva: detalle.montoImpuesto || 0, // Usar montoImpuesto de la BD
            tipoProducto: detalle.tipoProducto,
          }
        }),

        // Total real de la factura
        montoTotal: facturaData.montoTotalFactura || 0,
        observaciones: facturaData.observacion || "",
      }

      console.log("Factura formateada con datos reales:", facturaFormateada)
      setDatosFactura(facturaFormateada)
    } catch (error) {
      console.error("Error al cargar factura:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImprimir = async () => {
    if (!facturaId) return

    try {
      const response = await fetch(`/api/finanzas/facturas-clientes/${facturaId}/pdf`)
      const blob = await response.blob()

      // Crear URL del blob y abrir en nueva ventana para imprimir
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url, "_blank")

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (error) {
      console.error("Error al generar PDF:", error)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>Cargando factura...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography color="error" variant="h6" gutterBottom>
              Error al cargar la factura
            </Typography>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
            <Button onClick={onClose} variant="outlined" sx={{ mt: 2 }}>
              Cerrar
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  if (!datosFactura) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography>No se pudieron cargar los datos de la factura</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  // Usar el total real de la factura
  const totalGeneral = datosFactura.montoTotal
  const ivaGeneral = Math.round(totalGeneral * 0.1)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Vista Previa - Factura {datosFactura.numero}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Paper
          sx={{
            p: 3,
            border: "2px solid #000",
            fontFamily: "Arial, sans-serif",
            backgroundColor: "#fff",
            fontSize: "12px",
          }}
        >
          {/* Encabezado principal */}
          <Box sx={{ border: "2px solid #000", mb: 2, display: "flex", minHeight: "120px" }}>
            {/* Sección izquierda - Información de la empresa */}
            <Box sx={{ flex: 1, p: 2, borderRight: "2px solid #000" }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                  DISTRIBUIDORA 'LAS NIÑAS'
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  de Victor Manuel Barreto Barrios
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  ELABORACIÓN DE COMIDAS Y PLATOS PREPARADOS
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 0.5 }}>
                  COMERCIO AL POR MENOR DE OTROS ARTICULOS N.C.P
                </Typography>
                <Typography variant="caption" sx={{ display: "block", mb: 1 }}>
                  OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                  TELÉFONO: (0993) 540-258
                </Typography>
              </Box>
            </Box>

            {/* Sección derecha - Datos de factura */}
            <Box sx={{ width: "280px", p: 2, backgroundColor: "#f5f5f5" }}>
              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  R.U.C.
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  4006624-0
                </Typography>
              </Box>

              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  TIMBRADO Nº
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                  {datosFactura.timbrado}
                </Typography>
              </Box>

              <Box sx={{ border: "2px solid #000", p: 1, mb: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  FACTURA
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Nº {datosFactura.numero}
                </Typography>
              </Box>

              <Box sx={{ border: "2px solid #000", p: 1, backgroundColor: "white", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  CONDICIÓN DE VENTA
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                  <Typography variant="caption">{datosFactura.condicion === "CONTADO" ? "☑" : "☐"} CONTADO</Typography>
                  <Typography variant="caption">{datosFactura.condicion === "CREDITO" ? "☑" : "☐"} CRÉDITO</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Información del cliente */}
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={8}>
              <Box sx={{ border: "1px solid #000", p: 1, height: "100%" }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Fecha de Emisión:</strong> {datosFactura.fechaEmision}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Condición de Venta:</strong> {datosFactura.condicion}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Cliente o Razón Social:</strong> {datosFactura.cliente.nombre}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>R.U.C.:</strong> {datosFactura.cliente.ruc}
                </Typography>
                <Typography variant="body2">
                  <strong>Dirección:</strong> {datosFactura.cliente.direccion}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={4}>
              <Box sx={{ border: "1px solid #000", p: 1, height: "100%", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 2 }}>
                  Nro de Remisión:
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Tabla de productos */}
          <TableContainer component={Box} sx={{ border: "1px solid #000", mb: 2 }}>
            <Table size="small" sx={{ "& td, & th": { border: "1px solid #000", fontSize: "0.75rem", p: 0.5 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "8%", textAlign: "center", fontWeight: "bold" }}>Cant.</TableCell>
                  <TableCell sx={{ width: "45%", textAlign: "center", fontWeight: "bold" }}>Descripción</TableCell>
                  <TableCell sx={{ width: "12%", textAlign: "center", fontWeight: "bold" }}>
                    Precio
                    <br />
                    Unitario
                  </TableCell>
                  <TableCell sx={{ width: "12%", textAlign: "center", fontWeight: "bold" }}>Exentas</TableCell>
                  <TableCell sx={{ width: "11%", textAlign: "center", fontWeight: "bold" }}>5%</TableCell>
                  <TableCell sx={{ width: "12%", textAlign: "center", fontWeight: "bold" }}>10%</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datosFactura.productos.map((producto, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ textAlign: "center" }}>{producto.cantidad}</TableCell>
                    <TableCell sx={{ textAlign: "left" }}>{producto.descripcion}</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>
                      ₲ {producto.precioUnitario.toLocaleString("es-PY")}
                    </TableCell>
                    <TableCell sx={{ textAlign: "right" }}>-</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>-</TableCell>
                    <TableCell sx={{ textAlign: "right" }}>₲ {producto.total.toLocaleString("es-PY")}</TableCell>
                  </TableRow>
                ))}
                {/* Filas vacías para completar el diseño */}
                {Array.from({ length: Math.max(0, 6 - datosFactura.productos.length) }).map((_, index) => (
                  <TableRow key={`empty-${index}`} sx={{ height: "25px" }}>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                    <TableCell>&nbsp;</TableCell>
                  </TableRow>
                ))}
                {/* Fila de subtotales */}
                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                  <TableCell colSpan={3} sx={{ textAlign: "center", fontWeight: "bold" }}>
                    Sub Total:
                  </TableCell>
                  <TableCell sx={{ textAlign: "right", fontWeight: "bold" }}>₲ 0</TableCell>
                  <TableCell sx={{ textAlign: "right", fontWeight: "bold" }}>₲ 0</TableCell>
                  <TableCell sx={{ textAlign: "right", fontWeight: "bold" }}>
                    ₲ {totalGeneral.toLocaleString("es-PY")}
                  </TableCell>
                </TableRow>
                {/* Fila de total */}
                <TableRow sx={{ backgroundColor: "#e0e0e0" }}>
                  <TableCell colSpan={3} sx={{ textAlign: "center", fontWeight: "bold" }}>
                    Total a Pagar Gs.(Exentas):
                  </TableCell>
                  <TableCell colSpan={3} sx={{ textAlign: "center", fontWeight: "bold", fontSize: "1rem" }}>
                    ₲ {totalGeneral.toLocaleString("es-PY")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Sección de totales e IVA */}
          <Grid container spacing={1}>
            <Grid item xs={6}>
              {/* Espacio vacío */}
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ border: "1px solid #000", p: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Total I.V.A.: ₲ {ivaGeneral.toLocaleString("es-PY")}
                </Typography>
                <Divider sx={{ borderColor: "#000", borderWidth: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold", textAlign: "center", mt: 1 }}>
                  TOTAL: ₲ {totalGeneral.toLocaleString("es-PY")}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
        <Button onClick={handleImprimir} variant="contained" startIcon={<PrintIcon />} color="primary">
          Imprimir PDF
        </Button>
      </DialogActions>
    </Dialog>
  )
}
