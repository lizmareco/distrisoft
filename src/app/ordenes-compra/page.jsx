"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from "@mui/material"
import {
  Add as AddIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Clear as ClearIcon,
} from "@mui/icons-material"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function OrdenesCompraPage() {
  const [ordenesCompra, setOrdenesCompra] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [idCotizacion, setIdCotizacion] = useState("")
  const [idOrdenCompra, setIdOrdenCompra] = useState("")
  const [idProveedor, setIdProveedor] = useState("")
  const [estado, setEstado] = useState("")
  const [estados, setEstados] = useState([
    { id: "PENDIENTE", nombre: "PENDIENTE" },
    { id: "ENVIADO", nombre: "ENVIADO" },
    { id: "RECIBIDO", nombre: "RECIBIDO" },
    { id: "PARCIALMENTE RECIBIDO", nombre: "PARCIALMENTE RECIBIDO" },
    { id: "ANULADO", nombre: "ANULADO" },
  ])

  // Modificar el estado inicial y el useEffect para no cargar automáticamente
  // Añadir un estado para controlar si se deben mostrar las órdenes
  const [mostrarOrdenes, setMostrarOrdenes] = useState(false)

  // Cargar órdenes de compra
  const fetchOrdenesCompra = async () => {
    try {
      setLoading(true)
      setError(null)
      setMostrarOrdenes(true) // Mostrar órdenes después de buscar

      // Construir URL con parámetros de búsqueda
      let url = "/api/ordenes-compra?"

      if (idCotizacion) {
        url += `idCotizacion=${encodeURIComponent(idCotizacion)}&`
      }

      if (idOrdenCompra) {
        url += `idOrdenCompra=${encodeURIComponent(idOrdenCompra)}&`
      }

      if (idProveedor) {
        url += `idProveedor=${encodeURIComponent(idProveedor)}&`
      }

      if (estado) {
        url += `estado=${encodeURIComponent(estado)}&`
      }

      if (mostrarTodas) {
        url += "mostrarTodas=true&"
      }

      console.log("Fetching URL:", url)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Error al cargar órdenes de compra")
      }

      const data = await response.json()
      setOrdenesCompra(data)
      setPage(0) // Resetear a la primera página al cambiar los datos
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    // No cargar órdenes automáticamente
    setLoading(false) // Quitar el loading inicial
  }, [])

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  // Manejar búsqueda
  const handleSearch = (event) => {
    event.preventDefault()
    fetchOrdenesCompra()
  }

  // Limpiar filtros
  const handleClearFilters = () => {
    setIdCotizacion("")
    setIdOrdenCompra("")
    setIdProveedor("")
    setEstado("")
    setMostrarTodas(false)
    setMostrarOrdenes(false) // Ocultar órdenes al limpiar filtros
    setOrdenesCompra([]) // Limpiar las órdenes existentes
  }

  // Obtener color del chip según el estado
  const getEstadoChipColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pendiente":
        return "warning"
      case "enviado":
        return "info"
      case "recibido":
        return "success"
      case "parcialmente recibido":
        return "secondary"
      case "anulado":
        return "error"
      default:
        return "default"
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Órdenes de Compra
        </Typography>
        <Button
          component={Link}
          href="/ordenes-compra/nueva"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
        >
          Nueva Orden de Compra
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 4 }}>
        <Box component="form" onSubmit={handleSearch} noValidate>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="ID Orden de Compra"
                value={idOrdenCompra}
                onChange={(e) => setIdOrdenCompra(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="ID Cotización"
                value={idCotizacion}
                onChange={(e) => setIdCotizacion(e.target.value)}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel id="estado-label">Estado</InputLabel>
                <Select
                  labelId="estado-label"
                  id="estado"
                  value={estado}
                  label="Estado"
                  onChange={(e) => setEstado(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Button type="submit" variant="contained" color="primary">
                  Aplicar Filtros
                </Button>
                <Button variant="contained" color="primary" startIcon={<SearchIcon />} onClick={fetchOrdenesCompra}>
                  Listar Todas las Órdenes
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchOrdenesCompra}>
                  Actualizar
                </Button>
                {(idCotizacion || idOrdenCompra || idProveedor || estado || mostrarTodas) && (
                  <Button variant="outlined" startIcon={<ClearIcon />} onClick={handleClearFilters} color="error">
                    Limpiar Filtros
                  </Button>
                )}
                <FormControl component="fieldset">
                  <Box display="flex" alignItems="center">
                    <input
                      type="checkbox"
                      id="mostrarTodas"
                      checked={mostrarTodas}
                      onChange={(e) => setMostrarTodas(e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    <label htmlFor="mostrarTodas">Mostrar todas (incluye órdenes antiguas)</label>
                  </Box>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : mostrarOrdenes ? (
          ordenesCompra.length > 0 ? (
            <>
              <TableContainer sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Cotización</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Monto Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ordenesCompra.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((orden) => (
                      <TableRow hover key={orden.idOrdenCompra}>
                        <TableCell>{orden.idOrdenCompra}</TableCell>
                        <TableCell>{format(new Date(orden.fechaOrden), "dd/MM/yyyy", { locale: es })}</TableCell>
                        <TableCell>{orden.cotizacionProveedor?.proveedor?.empresa?.razonSocial || "N/A"}</TableCell>
                        <TableCell>#{orden.idCotizacionProveedor}</TableCell>
                        <TableCell>
                          <Chip
                            label={orden.estadoOrdenCompra?.descEstadoOrdenCompra || "Pendiente"}
                            color={getEstadoChipColor(orden.estadoOrdenCompra?.descEstadoOrdenCompra)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG" }).format(
                            orden.cotizacionProveedor?.montoTotal || 0,
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Ver detalles">
                            <IconButton
                              component={Link}
                              href={`/ordenes-compra/${orden.idOrdenCompra}`}
                              color="primary"
                              size="small"
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={ordenesCompra.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Filas por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          ) : (
            <Box p={3} textAlign="center">
              <Typography variant="body1">No se encontraron órdenes de compra</Typography>
            </Box>
          )
        ) : (
          <Box p={5} textAlign="center">
            <Typography variant="body1">
              Utilice los filtros y haga clic en "Listar Todas las Órdenes" o "Aplicar Filtros" para ver las órdenes de
              compra
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  )
}
