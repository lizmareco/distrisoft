"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
} from "@mui/material"
import { Add, Visibility, Edit, Print, Search } from "@mui/icons-material"
import { descargarXMLFactura } from "@/components/facturas/GeneradorXMLFactura"

export default function FacturasClientesPage() {
  const [facturas, setFacturas] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [tipoFactura, setTipoFactura] = useState("contado")
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(false)

  // Datos de ejemplo
  const facturasEjemplo = [
    {
      nroFactura: 1001,
      fecha: "2024-01-15",
      cliente: "Juan Pérez",
      tipo: "contado",
      monto: 150000,
      estado: "Pagada",
      metodoPago: "Efectivo",
    },
    {
      nroFactura: 1002,
      fecha: "2024-01-16",
      cliente: "María González",
      tipo: "credito",
      monto: 250000,
      estado: "Pendiente",
      saldoRestante: 250000,
      fechaVencimiento: "2024-02-16",
    },
  ]

  useEffect(() => {
    setFacturas(facturasEjemplo)
  }, [])

  const handleNuevaFactura = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "Pagada":
        return "success"
      case "Pendiente":
        return "warning"
      case "Vencida":
        return "error"
      default:
        return "default"
    }
  }

  const getTipoColor = (tipo) => {
    return tipo === "contado" ? "primary" : "secondary"
  }

  // Agregar función para generar XML
  const handleGenerarXML = (datosFactura) => {
    const datosXML = {
      numero: datosFactura.numero,
      timbrado: datosFactura.timbrado,
      fechaEmision: datosFactura.fechaEmision,
      condicion: datosFactura.condicion,
      cliente: datosFactura.cliente,
      productos: datosFactura.productos,
      totales: {
        subtotalExentas: datosFactura.productos.reduce((sum, p) => sum + p.exentas, 0),
        subtotalIva5: datosFactura.productos.reduce((sum, p) => sum + p.iva5, 0),
        subtotalIva10: datosFactura.productos.reduce((sum, p) => sum + p.iva10, 0),
        totalIva: datosFactura.productos.reduce((sum, p) => sum + p.iva5 * 0.05 + p.iva10 * 0.1, 0),
        totalGeneral: datosFactura.productos.reduce(
          (sum, p) => sum + p.exentas + p.iva5 + p.iva10 + p.iva5 * 0.05 + p.iva10 * 0.1,
          0,
        ),
      },
    }

    descargarXMLFactura(datosXML, `factura_${datosFactura.numero}.xml`)
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Facturas de Clientes
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleNuevaFactura}>
          Nueva Factura
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Buscar por cliente"
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: <Search />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select label="Tipo">
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="contado">Contado</MenuItem>
                  <MenuItem value="credito">Crédito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select label="Estado">
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="pagada">Pagada</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="vencida">Vencida</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Fecha desde" type="date" size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField fullWidth label="Fecha hasta" type="date" size="small" InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button variant="contained" fullWidth>
                Filtrar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de facturas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nro. Factura</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Monto Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Saldo Restante</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facturas.map((factura) => (
              <TableRow key={factura.nroFactura}>
                <TableCell>{factura.nroFactura}</TableCell>
                <TableCell>{factura.fecha}</TableCell>
                <TableCell>{factura.cliente}</TableCell>
                <TableCell>
                  <Chip label={factura.tipo.toUpperCase()} color={getTipoColor(factura.tipo)} size="small" />
                </TableCell>
                <TableCell>₲ {factura.monto.toLocaleString()}</TableCell>
                <TableCell>
                  <Chip label={factura.estado} color={getEstadoColor(factura.estado)} size="small" />
                </TableCell>
                <TableCell>{factura.saldoRestante ? `₲ ${factura.saldoRestante.toLocaleString()}` : "-"}</TableCell>
                <TableCell>
                  <IconButton size="small" color="primary">
                    <Visibility />
                  </IconButton>
                  <IconButton size="small" color="secondary">
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
                    <Print />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para nueva factura */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Factura de Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Factura</InputLabel>
                <Select value={tipoFactura} label="Tipo de Factura" onChange={(e) => setTipoFactura(e.target.value)}>
                  <MenuItem value="contado">Contado</MenuItem>
                  <MenuItem value="credito">Crédito</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Emisión"
                type="date"
                InputLabelProps={{ shrink: true }}
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={[]}
                renderInput={(params) => <TextField {...params} label="Seleccionar Cliente" fullWidth />}
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                options={[]}
                renderInput={(params) => <TextField {...params} label="Seleccionar Pedido" fullWidth />}
              />
            </Grid>
            {tipoFactura === "contado" && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Método de Pago</InputLabel>
                  <Select label="Método de Pago">
                    <MenuItem value={1}>Efectivo</MenuItem>
                    <MenuItem value={2}>Tarjeta de Crédito</MenuItem>
                    <MenuItem value={3}>Transferencia</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            {tipoFactura === "credito" && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Plazo de Pago (días)" type="number" defaultValue={30} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Fecha de Vencimiento" type="date" InputLabelProps={{ shrink: true }} />
                </Grid>
              </>
            )}
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Descuento (%)" type="number" defaultValue={0} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Timbrado" type="number" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Observaciones" multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button variant="contained" onClick={handleCloseDialog}>
            Generar Factura
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              // Aquí se abriría la vista previa de la factura
              window.open("/finanzas/facturas/preview", "_blank")
            }}
          >
            Vista Previa
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
