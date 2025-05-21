"use client"

import { useState, useEffect, useRef } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material"
import {
  ExpandMore as ExpandMoreIcon,
  Print as PrintIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useReactToPrint } from "react-to-print"

export default function ReporteInventarioPage() {
  const [reporte, setReporte] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reporteRef = useRef(null)

  // Cargar reporte de inventario
  const fetchReporte = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener el token de autenticación
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        sessionStorage.getItem("token") ||
        document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1")

      const response = await fetch("/api/inventario/reporte", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar el reporte de inventario")
      }

      const data = await response.json()
      setReporte(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchReporte()
  }, [])

  // Configurar impresión
  const handlePrint = useReactToPrint({
    content: () => reporteRef.current,
    documentTitle: "Reporte de Inventario",
    onBeforeGetContent: () => {
      // Expandir todos los acordeones antes de imprimir
      const accordions = document.querySelectorAll(".MuiAccordion-root")
      accordions.forEach((accordion) => {
        if (!accordion.classList.contains("Mui-expanded")) {
          accordion.classList.add("Mui-expanded")
          const accordionSummary = accordion.querySelector(".MuiAccordionSummary-root")
          if (accordionSummary) {
            accordionSummary.classList.add("Mui-expanded")
          }
          const accordionDetails = accordion.querySelector(".MuiAccordionDetails-root")
          if (accordionDetails) {
            accordionDetails.style.display = "block"
          }
        }
      })
    },
  })

  // Calcular totales
  const totalMateriasPrimas = reporte.length
  const totalRegistros = reporte.reduce((total, item) => total + item.registros.length, 0)

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Reporte de Inventario
        </Typography>
        <Box>
          <Button component={Link} href="/inventario" variant="outlined" startIcon={<ArrowBackIcon />} sx={{ mr: 1 }}>
            Volver
          </Button>
          <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint}>
            Imprimir
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <div ref={reporteRef}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Resumen de Inventario
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total de Materias Primas:</strong> {totalMateriasPrimas}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total de Registros:</strong> {totalRegistros}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Fecha del Reporte:</strong>{" "}
                      {format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {reporte.length > 0 ? (
            reporte.map((item) => (
              <Accordion key={item.materiaPrima.idMateriaPrima} defaultExpanded={false} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <InventoryIcon sx={{ mr: 2, color: "primary.main" }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {item.materiaPrima.nombreMateriaPrima}
                    </Typography>
                    <Chip
                      label={`${item.cantidadTotal} ${item.unidadMedida}`}
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {item.materiaPrima.descMateriaPrima}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    Movimientos de Inventario
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          <TableCell>Unidad</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell>Orden de Compra</TableCell>
                          <TableCell>Observación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {item.registros.map((registro) => (
                          <TableRow key={registro.idInventario}>
                            <TableCell>{registro.idInventario}</TableCell>
                            <TableCell align="right">{registro.cantidad}</TableCell>
                            <TableCell>{registro.unidadMedida}</TableCell>
                            <TableCell>
                              {format(new Date(registro.fechaIngreso), "dd/MM/yyyy HH:mm", { locale: es })}
                            </TableCell>
                            <TableCell>
                              {registro.idOrdenCompra ? (
                                <Link href={`/ordenes-compra/${registro.idOrdenCompra}`}>
                                  #{registro.ordenCompra?.numeroOrdenCompra || registro.idOrdenCompra}
                                </Link>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>{registro.observacion || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: "center" }}>
              <Typography variant="body1">No se encontraron registros de inventario</Typography>
            </Paper>
          )}
        </div>
      )}
    </Container>
  )
}
