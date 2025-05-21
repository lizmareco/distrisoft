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

export default function ProductosInventarioPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [cantidad, setCantidad] = useState("")
  const [observacion, setObservacion] = useState("")
  const [tiposProducto, setTiposProducto] = useState([])
  const [filtroTipo, setFiltroTipo] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [estadosProducto, setEstadosProducto] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })

  // Cargar productos
  const fetchProductos = async () => {
    setLoading(true)
    try {
      let url = "/api/productos/stock"
      const params = new URLSearchParams()

      if (searchTerm) params.append("nombre", searchTerm)
      if (filtroTipo) params.append("tipoProducto", filtroTipo)
      if (filtroEstado) params.append("estado", filtroEstado)

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Error al cargar los productos")
      }

      const data = await response.json()
      setProductos(data.productos || [])
      setError(null)
    } catch (err) {
      console.error("Error al cargar productos:", err)
      setError("Error al cargar los productos. Por favor, intente nuevamente.")
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar tipos de producto
  const fetchTiposProducto = async () => {
    try {
      const response = await fetch("/api/tipoproducto")
      if (!response.ok) {
        throw new Error("Error al cargar tipos de producto")
      }

      const data = await response.json()
      setTiposProducto(data || [])
    } catch (err) {
      console.error("Error al cargar tipos de producto:", err)
    }
  }

  // Cargar estados de producto
  const fetchEstadosProducto = async () => {
    try {
      const response = await fetch("/api/estadoproducto")
      if (!response.ok) {
        throw new Error("Error al cargar estados de producto")
      }

      const data = await response.json()
      setEstadosProducto(data || [])
    } catch (err) {
      console.error("Error al cargar estados de producto:", err)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchProductos()
    fetchTiposProducto()
    fetchEstadosProducto()
  }, [])

  // Actualizar productos cuando cambian los filtros
  useEffect(() => {
    fetchProductos()
  }, [searchTerm, filtroTipo, filtroEstado])

  // Abrir diálogo para ajustar stock
  const handleOpenDialog = (producto) => {
    setSelectedProducto(producto)
    setCantidad("")
    setObservacion("")
    setOpenDialog(true)
  }

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedProducto(null)
  }

  // Actualizar stock
  const handleUpdateStock = async () => {
    if (!selectedProducto || !cantidad) {
      setSnackbar({
        open: true,
        message: "Por favor, ingrese una cantidad válida",
        severity: "error",
      })
      return
    }

    try {
      const response = await fetch("/api/productos/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idProducto: selectedProducto.idProducto,
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
      fetchProductos()
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
        Inventario de Productos
      </Typography>

      <InventarioNav activeTab="productos" />

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
            <Button variant="contained" color="primary" startIcon={<RefreshIcon />} onClick={fetchProductos} fullWidth>
              Actualizar
            </Button>
          </Grid>
        </Grid>

        {showFilters && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Producto</InputLabel>
                <Select value={filtroTipo} label="Tipo de Producto" onChange={(e) => setFiltroTipo(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {tiposProducto.map((tipo) => (
                    <MenuItem key={tipo.idTipoProducto} value={tipo.idTipoProducto}>
                      {tipo.descTipoProducto}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={filtroEstado} label="Estado" onChange={(e) => setFiltroEstado(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {estadosProducto.map((estado) => (
                    <MenuItem key={estado.idEstadoProducto} value={estado.idEstadoProducto}>
                      {estado.descEstadoProducto}
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
                <TableCell>Tipo</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Stock Actual</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                productos.map((producto) => (
                  <TableRow key={producto.idProducto}>
                    <TableCell>{producto.nombreProducto}</TableCell>
                    <TableCell>{producto.descripcion}</TableCell>
                    <TableCell>{producto.tipoProducto?.descTipoProducto || "N/A"}</TableCell>
                    <TableCell>{producto.unidadMedida?.nombreUnidadMedida || "N/A"}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          {Number.parseFloat(producto.stockActual || 0).toFixed(2)}
                        </Typography>
                        {renderStockStatus(producto.stockActual || 0)}
                      </Box>
                    </TableCell>
                    <TableCell>{producto.estadoProducto?.descEstadoProducto || "N/A"}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleOpenDialog(producto)} title="Añadir stock">
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => {
                          setSelectedProducto(producto)
                          setCantidad("-")
                          setObservacion("")
                          setOpenDialog(true)
                        }}
                        title="Reducir stock"
                        disabled={(producto.stockActual || 0) <= 0}
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
          {selectedProducto && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Producto: {selectedProducto.nombreProducto}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Stock actual: {Number.parseFloat(selectedProducto.stockActual || 0).toFixed(2)}{" "}
                {selectedProducto.unidadMedida?.nombreUnidadMedida || ""}
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
                        ? -Number.parseFloat(selectedProducto.stockActual || 0)
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
