'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Container, Typography, Card, CardContent, Grid,
  TextField, Button, CircularProgress, Alert, Snackbar, Checkbox
} from '@mui/material'
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import Link from 'next/link'

export default function NuevaNotaCredito() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nroFactura = searchParams.get('nroFactura')

  const [factura, setFactura] = useState(null)
  const [detalles, setDetalles] = useState([])
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' })

  // Formatear el número de factura para mostrarlo en el título
  const nroFacturaFormateado = nroFactura ? `001-001-${String(nroFactura).padStart(7, "0")}` : "-"

  // Calcular acreditado por detalle (de notas previas)
  const acreditadoPorDetalle = {};
  if (factura && factura.detalles) {
    factura.detalles.forEach((d) => {
      acreditadoPorDetalle[d.idDetalleFactura] = d.acreditado || 0;
    });
  }

  useEffect(() => {
    if (nroFactura) cargarFactura()
  }, [nroFactura])

  const cargarFactura = async () => {
    try {
      const res = await fetch(`/api/finanzas/facturas-clientes/${nroFactura}`)
      const data = await res.json()
  
      if (!data.success || !data.data) throw new Error("No se pudo obtener la factura")
  
      const facturaRecibida = data.data
      setFactura(facturaRecibida)
  
      setDetalles(
        facturaRecibida.detalles.map((d) => ({
          ...d,
          producto: d.descripcion,
          seleccionado: false,
          cantidadNC: d.cantidad,
        }))
      )
    } catch (err) {
      console.error("Error al cargar factura:", err)
    }
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      const seleccionados = detalles.filter((d) => d.seleccionado && d.cantidadNC > 0)
      if (seleccionados.length === 0) throw new Error('Debe seleccionar al menos un detalle')

      const nota = {
        nroFactura,
        motivo,
        detalles: seleccionados.map((d) => ({
          idDetalleFactura: d.idDetalleFactura,
          cantidad: d.cantidadNC,
          precioUnitario: d.precioUnitario,
          idImpuesto: 2, // IVA 10%
        })),
      }

      const res = await fetch('/api/finanzas/notas-credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nota),
      })

      const result = await res.json()

      if (res.ok) {
        setSnackbar({ abierto: true, mensaje: 'Nota de crédito creada con éxito', tipo: 'success' })
        router.push('/finanzas')
      } else {
        throw new Error(result.error || 'Error al guardar nota')
      }
    } catch (err) {
      setSnackbar({ abierto: true, mensaje: err.message, tipo: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button component={Link} href="/finanzas" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mr: 2 }}>
          Volver 
      </Button>
      <Typography variant="h5" gutterBottom>
        Nueva Nota de Crédito - Factura #{nroFacturaFormateado}
      </Typography>

      {!factura ? (
        <CircularProgress />
      ) : (
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Motivo"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Detalles de la Factura</Typography>
                {detalles.map((d, index) => (
                  <Grid container spacing={1} key={d.idDetalleFactura || index} alignItems="center">
                    <Grid item xs={1} key={`checkbox-${d.idDetalleFactura || index}`}>
                      <Checkbox
                        checked={d.seleccionado}
                        onChange={(e) => {
                          const nuevos = [...detalles]
                          nuevos[index].seleccionado = e.target.checked
                          setDetalles(nuevos)
                        }}
                      />
                    </Grid>
                    <Grid item xs={4} key={`producto-${d.idDetalleFactura || index}`}>{d.producto}</Grid>
                    <Grid item xs={2} key={`precio-${d.idDetalleFactura || index}`}>Precio: ₲ {d.precioUnitario.toLocaleString('es-PY')}</Grid>
                    <Grid item xs={2} key={`facturado-${d.idDetalleFactura || index}`}>Facturado: {d.cantidad}</Grid>
                    <Grid item xs={3} key={`cantidadNC-${d.idDetalleFactura || index}`}>
                      <TextField
                        type="number"
                        label="Cantidad a acreditar"
                        size="small"
                        value={d.cantidadNC}
                        onChange={(e) => {
                          const nuevos = [...detalles]
                          let valor = parseInt(e.target.value) || 0
                          // Validar que no supere la cantidad facturada menos lo ya acreditado
                          const maxAcreditar = d.cantidad - (acreditadoPorDetalle[d.idDetalleFactura] || 0)
                          if (valor > maxAcreditar) valor = maxAcreditar
                          nuevos[index].cantidadNC = valor
                          setDetalles(nuevos)
                        }}
                        inputProps={{ min: 1, max: d.cantidad - (acreditadoPorDetalle[d.idDetalleFactura] || 0) }}
                        error={d.cantidadNC > (d.cantidad - (acreditadoPorDetalle[d.idDetalleFactura] || 0))}
                        helperText={
                          d.cantidadNC > (d.cantidad - (acreditadoPorDetalle[d.idDetalleFactura] || 0))
                            ? `No puede acreditar más de ${d.cantidad - (acreditadoPorDetalle[d.idDetalleFactura] || 0)} (ya acreditado: ${acreditadoPorDetalle[d.idDetalleFactura] || 0})`
                            : (acreditadoPorDetalle[d.idDetalleFactura] > 0 ? `Ya acreditado: ${acreditadoPorDetalle[d.idDetalleFactura]}` : '')
                        }
                      />
                    </Grid>
                  </Grid>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGuardar}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Nota de Crédito'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={snackbar.abierto}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, abierto: false })}
      >
        <Alert
          severity={snackbar.tipo}
          onClose={() => setSnackbar({ ...snackbar, abierto: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Container>
  )
}
