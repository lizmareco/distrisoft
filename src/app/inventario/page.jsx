"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material"
import { Refresh as RefreshIcon, Search as SearchIcon, FilterList as FilterIcon } from "@mui/icons-material"
import InventarioNav from "@/src/components/inventario-nav"

export default function InventarioPage() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("")
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("")

  // Cargar movimientos de inventario
  const fetchMovimientos = async () => {
    setLoading(true)
    try {
      let url = "/api/inventario"
      const params = new URLSearchParams()

      if (searchTerm) params.append("search", searchTerm)
      if (filtroTipo) params.append("tipo", filtroTipo)
      if (filtroFechaDesde) params.append("fechaDesde", filtroFechaDesde)
      if (filtroFechaHasta) params.append("fechaHasta", filtroFechaHasta)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Error al cargar los movimientos de inventario")
      }

      const data = await response.json()
      setMovimientos(data.movimientos || [])
      setError(null)
    } catch (err) {
      console.error("Error al cargar movimientos:", err)
      setError("Error al cargar los movimientos de inventario. Por favor, intente nuevamente.")
      setMovimientos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchMovimientos()
  }, [])

  // Actualizar movimientos cuando cambian los filtros
  useEffect(() => {
    fetchMovimientos()
  }, [searchTerm, filtroTipo, filtroFechaDesde, filtroFechaHasta])

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Renderizar tipo de movimiento
  const renderTipoMovimiento = (cantidad) => {
    if (cantidad > 0) {
      return <Chip label="Entrada" color="success" size="small" />
    } else {
      return <Chip label="Salida" color="error" size="small" />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Movimientos de Inventario
      </Typography>

      <InventarioNav activeTab="movimientos" />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Buscar por materia prima u observación"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: <SearchIcon color="action" />,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              fullWidth
            >
              Filtros
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={fetchMovimientos}
              fullWidth
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>

        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select value={filtroTipo} label="Tipo de Movimiento" onChange={(e) => setFiltroTipo(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="entrada">Entradas</MenuItem>
                  <MenuItem value="salida">Salidas</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fecha Desde"
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => setFiltroFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fecha Hasta"
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => setFiltroFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Materia Prima</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Orden de Compra</TableCell>
                <TableCell>Observación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimientos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron movimientos de inventario
                  </TableCell>
                </TableRow>
              ) : (
                movimientos.map((movimiento) => (
                  <TableRow key={movimiento.idInventario}>
                    <TableCell>{formatDate(movimiento.fechaIngreso)}</TableCell>
                    <TableCell>{movimiento.materiaPrima?.nombreMateriaPrima || "N/A"}</TableCell>
                    <TableCell align="right">{Math.abs(Number.parseFloat(movimiento.cantidad)).toFixed(2)}</TableCell>
                    <TableCell>{movimiento.unidadMedida}</TableCell>
                    <TableCell>{renderTipoMovimiento(movimiento.cantidad)}</TableCell>
                    <TableCell>
                      {movimiento.ordenCompra ? `#${movimiento.ordenCompra.numeroOrdenCompra}` : "N/A"}
                    </TableCell>
                    <TableCell>{movimiento.observacion || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
