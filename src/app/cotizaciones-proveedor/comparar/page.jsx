"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Alert,
  Button,
  Chip,
} from "@mui/material"
import { ArrowBack, CheckCircle, Cancel } from "@mui/icons-material"
import Link from "next/link"
import { useRootContext } from "@/src/app/context/root"
import { green, red, grey } from "@mui/material/colors"

export default function CompararCotizacionesPage() {
  const context = useRootContext()
  // Verificación de permisos
  const permisos = context.session?.permisos || []
  const hasPermission = permisos.find((permiso) => permiso === "VIEW_COTIZACIONPROVEEDOR")
  const searchParams = useSearchParams()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [aprobando, setAprobando] = useState(null)
  const [aprobadaId, setAprobadaId] = useState(null)
  const [estados, setEstados] = useState({}) // { idCotizacion: 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' }
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const ids = searchParams.get("ids")?.split(",").map((id) => parseInt(id)).filter(Boolean) || []

  useEffect(() => {
    if (!hasPermission) return
    const fetchComparacion = async () => {
      const ids = searchParams.get("ids")?.split(",").map((id) => parseInt(id)).filter(Boolean) || []

      if (ids.length < 2) {
        setError("Seleccione al menos dos cotizaciones para comparar")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/cotizaciones-proveedor/comparar?ids=${ids.join(",")}`)
        const data = await response.json()

        if (!response.ok) {
          console.warn("Error en API:", data)
          setError(data?.error || "No se pudieron obtener las cotizaciones")
          return
        }

        setCotizaciones(data)
      } catch (err) {
        console.error("Error inesperado:", err)
        setError("Ocurrió un error inesperado al obtener las cotizaciones")
      } finally {
        setLoading(false)
      }
    }

    fetchComparacion()
  }, [searchParams])

  // Cargar estados reales de las cotizaciones al cargar
  useEffect(() => {
    if (!hasPermission || cotizaciones.length === 0) return
    const fetchEstados = async () => {
      const nuevosEstados = {}
      for (const c of cotizaciones) {
        try {
          const res = await fetch(`/api/cotizaciones-proveedor/${c.idCotizacionProveedor}`)
          if (res.ok) {
            const data = await res.json()
            nuevosEstados[c.idCotizacionProveedor] = data.estado || 'PENDIENTE'
            if (data.estado === 'APROBADA') setAprobadaId(c.idCotizacionProveedor)
          }
        } catch {}
      }
      setEstados(nuevosEstados)
    }
    fetchEstados()
  }, [cotizaciones, hasPermission])

  // Aprobar una cotización y rechazar las demás
  const handleAprobar = async (idAprobar) => {
    setAprobando(idAprobar)
    try {
      // Aprobar la seleccionada
      const resAprobar = await fetch(`/api/cotizaciones-proveedor/${idAprobar}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'APROBADA' })
      })
      if (!resAprobar.ok) throw new Error('Error al aprobar la cotización')
      // Rechazar las demás
      const promises = cotizaciones.filter(c => c.idCotizacionProveedor !== idAprobar).map(c =>
        fetch(`/api/cotizaciones-proveedor/${c.idCotizacionProveedor}/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'RECHAZADA' })
        })
      )
      await Promise.all(promises)
      // Actualizar estados en UI
      const nuevosEstados = {}
      cotizaciones.forEach(c => {
        nuevosEstados[c.idCotizacionProveedor] = c.idCotizacionProveedor === idAprobar ? 'APROBADA' : 'RECHAZADA'
      })
      setEstados(nuevosEstados)
      setAprobadaId(idAprobar)
      setSnackbar({ open: true, message: 'Cotización aprobada y las demás rechazadas.', severity: 'success' })
    } catch (e) {
      setSnackbar({ open: true, message: e.message || 'Error al aprobar', severity: 'error' })
    } finally {
      setAprobando(null)
    }
  }

  // Filtrar solo cotizaciones PENDIENTES
  const cotizacionesPendientes = cotizaciones.filter(c => (estados[c.idCotizacionProveedor] || 'PENDIENTE') === 'PENDIENTE')
  const todasMaterias = [...new Set(cotizacionesPendientes.flatMap((c) => (c.detalles || []).map((d) => d.nombre)))]

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button component={Link} href="/cotizaciones-proveedor" startIcon={<ArrowBack />} variant="outlined" sx={{ mb: 2 }}>
        Volver
      </Button>

      <Typography variant="h4" gutterBottom>
        Comparación de Cotizaciones
      </Typography>

      {/* Snackbar feedback */}
      {snackbar.open && (
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ mb: 2 }}>
          {snackbar.message}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : cotizacionesPendientes.length < 2 ? (
        <Alert severity="info">Solo se pueden comparar cotizaciones con estado PENDIENTE y debe haber al menos dos.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                {cotizacionesPendientes.map((c) => (
                  <TableCell key={c.idCotizacionProveedor} align="center" sx={{ fontWeight: 'bold', fontSize: 16 }}>
                    {c.proveedor}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {todasMaterias.map((materia) => (
                <TableRow key={materia}>
                  <TableCell sx={{ fontWeight: 500 }}>{materia}</TableCell>
                  {cotizacionesPendientes.map((c) => {
                    const detalle = (c.detalles || []).find((d) => d.nombre === materia)
                    return (
                      <TableCell key={`${c.idCotizacionProveedor}-${materia}`} align="center">
                        {detalle ? (
                          <>
                            <div><strong>Subtotal:</strong> {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(detalle.subtotal)}</div>
                            <div><strong>Cantidad:</strong> {detalle.cantidad}</div>
                            <div><strong>Precio unitario:</strong> {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(detalle.precioUnitario)}</div>
                          </>
                        ) : <span style={{ color: '#aaa' }}>-</span>}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
              {/* Fila de total */}
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>TOTAL</TableCell>
                {cotizacionesPendientes.map((c) => (
                  <TableCell key={c.idCotizacionProveedor + '-total'} align="center" sx={{ fontWeight: 700 }}>
                    {c.detalles && c.detalles.length > 0
                      ? new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                          c.detalles.reduce((acc, d) => acc + (d.subtotal || 0), 0)
                        )
                      : '-'}
                  </TableCell>
                ))}
              </TableRow>
              {/* Fila de botón aprobar */}
              <TableRow>
                <TableCell />
                {cotizacionesPendientes.map((c) => (
                  <TableCell key={c.idCotizacionProveedor + '-aprobar'} align="center">
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      size="large"
                      sx={{ fontWeight: 700, fontSize: 18, background: '#43a047', py: 2 }}
                      disabled={!!aprobadaId || aprobando !== null}
                      onClick={() => handleAprobar(c.idCotizacionProveedor)}
                    >
                      APROBAR
                    </Button>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
