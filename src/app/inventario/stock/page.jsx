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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material"
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material"
import InventarioNav from "@/src/components/inventario-nav"

export default function StockMateriaPrimaPage() {
  const [materiasPrimas, setMateriasPrimas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedMateriaPrima, setSelectedMateriaPrima] = useState(null)
  const [cantidad, setCantidad] = useState("")
  const [observacion, setObservacion] = useState("")
  const [estadosMateriaPrima, setEstadosMateriaPrima] = useState([])
  const [filtroEstado, setFiltroEstado] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })

  // Cargar materias primas
  const fetchMateriasPrimas = async () => {
    setLoading(true)
    try {
      let url = "/api/materiaprima/stock"
      const params = new URLSearchParams()

      if (searchTerm) params.append("nombre", searchTerm)
      if (filtroEstado) params.append("estado", filtroEstado)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Error al cargar las materias primas")
      }

      const data = await response.json()
      setMateriasPrimas(data.materiasPrimas || [])
      setError(null)
    } catch (err) {
      console.error("Error al cargar materias primas:", err)
      setError("Error al cargar las materias primas. Por favor, intente nuevamente.")
      setMateriasPrimas([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar estados de materia prima
  const fetchEstadosMateriaPrima = async () => {
    try {
      const response = await fetch("/api/estadomateriaprima")
      if (!response.ok) {
        throw new Error("Error al cargar estados de materia prima")
      }

      const data = await response.json()
      setEstadosMateriaPrima(data.estadosMateriaPrima || [])
    } catch (err) {
      console.error("Error al cargar estados de materia prima:", err)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchMateriasPrimas()
    fetchEstadosMateriaPrima()
  }, [])

  // Actualizar materias primas cuando cambian los filtros
  useEffect(() => {
    fetchMateriasPrimas()
  }, [searchTerm, filtroEstado])

  // Abrir diálogo para ajustar stock
  const handleOpenDialog = (materiaPrima) => {
    setSelectedMateriaPrima(materiaPrima)
    setCantidad("")
    setObservacion("")
    setOpenDialog(true)
  }

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedMateriaPrima(null)
  }

  // Actualizar stock
  const handleUpdateStock = async () => {
    if (!selectedMateriaPrima || !cantidad) {
      setSnackbar({
        open: true,
        message: "Por favor, ingrese una cantidad válida",
        severity: "error",
      })
      return
    }

    try {
      const response = await fetch("/api/materiaprima/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idMateriaPrima: selectedMateriaPrima.idMateriaPrima,
          cantidad: Number.parseFloat(cantidad),
          observacion,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar stock")
      }

      const data = await response.json()

      setSnackbar({
        open: true,
        message: "Stock actualizado correctamente",
        severity: "success",
      })

      handleCloseDialog()
      fetchMateriasPrimas()
    } catch (err) {
      console.error("Error al actualizar stock:", err)
      setSnackbar({
        open: true,
        message: err.message || "Error al actualizar stock",
        severity: "error",
      })
    }
  }

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    })
  }

  // Renderizar estado de stock con color
  const renderStockStatus = (stock) => {
    if (stock <= 0) {
      return <Chip label="Sin stock" color="error" size="small" />
    } else if (stock < 10) {
      return <Chip label="Stock bajo" color="warning" size="small" />
    } else {
      return <Chip label="En stock" color="success" size="small" />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Stock de Materias Primas
      </Typography>

      <InventarioNav activeTab="materias" />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Buscar por nombre o descripción"
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
              onClick={fetchMateriasPrimas}
              fullWidth
            >
              Actualizar
            </Button>
          </Grid>
        </Grid>

        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={filtroEstado} label="Estado" onChange={(e) => setFiltroEstado(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {estadosMateriaPrima.map((estado) => (
                    <MenuItem key={estado.idEstadoMateriaPrima} value={estado.idEstadoMateriaPrima}>
                      {estado.nombreEstadoMateriaPrima}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Stock Actual</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materiasPrimas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No se encontraron materias primas
                  </TableCell>
                </TableRow>
              ) : (
                materiasPrimas.map((materiaPrima) => (
                  <TableRow key={materiaPrima.idMateriaPrima}>
                    <TableCell>{materiaPrima.nombreMateriaPrima}</TableCell>
                    <TableCell>{materiaPrima.descMateriaPrima}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {Number.parseFloat(materiaPrima.stockActual).toFixed(2)}
                        </Typography>
                        {renderStockStatus(materiaPrima.stockActual)}
                      </Box>
                    </TableCell>
                    <TableCell>{materiaPrima.estadoMateriaPrima?.nombreEstadoMateriaPrima || "N/A"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenDialog(materiaPrima)} title="Añadir stock">
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setSelectedMateriaPrima(materiaPrima)
                          setCantidad("-")
                          setObservacion("")
                          setOpenDialog(true)
                        }}
                        title="Reducir stock"
                        disabled={materiaPrima.stockActual <= 0}
                      >
                        <RemoveIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para ajustar stock */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{cantidad && cantidad.startsWith("-") ? "Reducir Stock" : "Añadir Stock"}</DialogTitle>
        <DialogContent>
          {selectedMateriaPrima && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Materia Prima: {selectedMateriaPrima.nombreMateriaPrima}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Stock actual: {Number.parseFloat(selectedMateriaPrima.stockActual).toFixed(2)}
              </Typography>

              <TextField
                autoFocus
                margin="dense"
                label="Cantidad"
                type="number"
                fullWidth
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                InputProps={{
                  inputProps: {
                    min:
                      cantidad && cantidad.startsWith("-")
                        ? -Number.parseFloat(selectedMateriaPrima.stockActual)
                        : 0.01,
                    step: 0.01,
                  },
                }}
                sx={{ mt: 2 }}
              />

              <TextField
                margin="dense"
                label="Observación"
                fullWidth
                multiline
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleUpdateStock} variant="contained" color="primary" disabled={!cantidad}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
