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
import { Refresh as RefreshIcon, Search as SearchIcon } from "@mui/icons-material"
import InventarioNav from "@/src/components/inventario-nav"

// Estilos personalizados para los botones de acción
const actionButtonStyles = {
  actualizar: {
    backgroundColor: "#0099cc",
    color: "white",
    "&:hover": {
      backgroundColor: "#007399",
    },
  },
  crear: {
    backgroundColor: "#28a745",
    color: "white",
    "&:hover": {
      backgroundColor: "#218838",
    },
  },
}

export default function MateriaPrimaPage() {
  const [materiasPrimas, setMateriasPrimas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedMateriaPrima, setSelectedMateriaPrima] = useState(null)
  const [cantidad, setCantidad] = useState("")
  const [observacion, setObservacion] = useState("")
  const [estadosMateriaPrima, setEstadosMateriaPrima] = useState([])
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })
  const [hasSearched, setHasSearched] = useState(false)

  // Cargar estados de materia prima al inicio
  useEffect(() => {
    fetchEstadosMateriaPrima()
  }, [])

  // Cargar materias primas
  const fetchMateriasPrimas = async () => {
    setLoading(true)
    setHasSearched(true)
    try {
      let url = "/api/materiaprima/stock"
      const params = new URLSearchParams()

      if (searchTerm) params.append("query", searchTerm)
      if (filtroEstado && filtroEstado !== "todos") params.append("estado", filtroEstado)

      // Si el estado es "Todos" o hay un término de búsqueda, cargar todos los datos
      if (filtroEstado === "todos" || searchTerm) {
        params.append("loadAll", "true")
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log("Fetching URL:", url)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Error al cargar las materias primas")
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)
      setMateriasPrimas(data || [])
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
      console.log("Estados recibidos:", data)
      setEstadosMateriaPrima(data || [])
    } catch (err) {
      console.error("Error al cargar estados de materia prima:", err)
    }
  }

  // Manejar búsqueda
  const handleSearch = (e) => {
    e.preventDefault()
    fetchMateriasPrimas()
  }

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
  setSnackbar({
    open: true,
    message: errorData.error || errorData.mensaje || "Error al actualizar stock",
    severity: "error",
  })
  return
}

      const data = await response.json()

      setSnackbar({
        open: true,
        message: data.cambioRealizado ? "Stock actualizado correctamente" : "No hubo cambios en el stock",
        severity: data.cambioRealizado ? "success" : "info",
      })

      handleCloseDialog()

      // Solo recargar si hubo cambios
      if (data.cambioRealizado) {
        fetchMateriasPrimas()
      }
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

      <InventarioNav activeTab="materiasprimas" />

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
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

            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={filtroEstado} label="Estado" onChange={(e) => setFiltroEstado(e.target.value)}>
                  <MenuItem value="todos">Todos</MenuItem>
                  {estadosMateriaPrima.map((estado) => (
                    <MenuItem key={estado.idEstadoMateriaPrima} value={estado.idEstadoMateriaPrima.toString()}>
                      {estado.descEstadoMateriaPrima}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Button
                type="submit"
                variant="contained"
                sx={actionButtonStyles.actualizar}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                ACTUALIZAR
              </Button>
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <Button
                variant="contained"
                sx={actionButtonStyles.crear}
                component="a"
                href="/materiaprima/formulario"
                fullWidth
              >
                CREAR
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!hasSearched ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Utilice los filtros para buscar materias primas
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Ingrese un término de búsqueda o seleccione un estado para ver resultados
          </Typography>
        </Paper>
      ) : loading ? (
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
              </TableRow>
            </TableHead>
            <TableBody>
              {materiasPrimas.length === 0 && hasSearched ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No se encontraron materias primas con los filtros seleccionados
                  </TableCell>
                </TableRow>
              ) : (
                materiasPrimas.map((materiaPrima) => (
                  <TableRow
                    key={materiaPrima.idMateriaPrima}
                    hover
                    onClick={() => handleOpenDialog(materiaPrima)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{materiaPrima.nombreMateriaPrima}</TableCell>
                    <TableCell>{materiaPrima.descMateriaPrima}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {Number.parseFloat(materiaPrima.stockActual || 0).toFixed(2)}
                        </Typography>
                        {renderStockStatus(materiaPrima.stockActual || 0)}
                      </Box>
                    </TableCell>
                    <TableCell>{materiaPrima.estadoMateriaPrima?.descEstadoMateriaPrima || "N/A"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para ajustar stock */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Ajustar Stock</DialogTitle>
        <DialogContent>
          {selectedMateriaPrima && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Materia Prima: {selectedMateriaPrima.nombreMateriaPrima}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Stock actual: {Number.parseFloat(selectedMateriaPrima.stockActual || 0).toFixed(2)}
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
                    min: -Number.parseFloat(selectedMateriaPrima.stockActual || 0),
                    step: 0.01,
                  },
                }}
                sx={{ mt: 2 }}
                helperText="Ingrese un valor positivo para añadir o negativo para reducir"
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
          <Button
            onClick={handleUpdateStock}
            variant="contained"
            sx={actionButtonStyles.actualizar}
            disabled={!cantidad}
          >
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
