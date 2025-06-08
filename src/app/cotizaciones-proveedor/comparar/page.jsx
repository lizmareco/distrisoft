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
} from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import { useRootContext } from "@/src/app/context/root"

export default function CompararCotizacionesPage() {
  const context = useRootContext()
  // Verificación de permisos
  const permisos = context.session?.permisos || []
  const hasPermission = permisos.find((permiso) => permiso === "VIEW_COTIZACIONPROVEEDOR")
  const searchParams = useSearchParams()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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


  const todasMaterias = [...new Set(cotizaciones.flatMap((c) =>
    (c.detalles || []).map((d) => d.nombre)
  ))]

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

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Materia Prima</strong></TableCell>
                {cotizaciones.map((c) => (
                  <TableCell key={c.idCotizacionProveedor}>
                    <strong>{c.proveedor}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {todasMaterias.map((materia) => (
                <TableRow key={materia}>
                  <TableCell>{materia}</TableCell>
                  {cotizaciones.map((c) => {
                    const detalle = (c.detalles || []).find((d) => d.nombre === materia)
                    return (
                      <TableCell key={`${c.idCotizacionProveedor}-${materia}`}>
                        {detalle ? (
                          <>
                            Cantidad: {detalle.cantidad}<br />
                            Precio: {new Intl.NumberFormat("es-PY", {
                              style: "currency",
                              currency: "PYG"
                            }).format(detalle.precioUnitario)}<br />
                            Total: {new Intl.NumberFormat("es-PY", {
                              style: "currency",
                              currency: "PYG"
                            }).format(detalle.subtotal)}
                          </>
                        ) : "-"}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  )
}
