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

export default function ProductosInventarioPage() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [cantidad, setCantidad] = useState("")
  const [observacion, setObservacion] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [estadosProducto, setEstadosProducto] = useState([])
  const [hasSearched, setHasSearched] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  })
  const [loadingEstados, setLoadingEstados] = useState(true)

  // Cargar productos
  const fetchProductos = async () => {
    setLoading(true)
    try {
      let url = "/api/productos/stock"
      const params = new URLSearchParams()
      let loadAll = false

      if (searchTerm) {
        params.append("nombre", searchTerm)
        loadAll = true
      }

      if (filtroEstado && filtroEstado !== "todos") {
        params.append("estado", filtroEstado)
        loadAll = true
      }

      // Si se seleccionó "Todos" explícitamente en el filtro de estado
      if (filtroEstado === "todos") {
        loadAll = true
      }

      if (loadAll) {
        params.append("loadAll", "true")
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log("Consultando productos:", url)
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Error al cargar los productos")
      }

      const data = await response.json()
      console.log("Productos recibidos:", data)
      setProductos(data.productos || [])
      setHasSearched(true)
      setError(null)
    } catch (err) {
      console.error("Error al cargar productos:", err)
      setError("Error al cargar los productos. Por favor, intente nuevamente.")
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar estados de producto
  const fetchEstadosProducto = async () => {
    setLoadingEstados(true)
    try {
      console.log("Consultando estados de producto")
      const response = await fetch("/api/estadoproducto")
      if (!response.ok) {
        throw new Error("Error al cargar estados de producto")
      }

      const data = await response.json()
      console.log("Estados de producto recibidos:", data)

      // Verificar la estructura de los datos recibidos
      if (Array.isArray(data)) {
        setEstadosProducto(data)
      } else if (data && Array.isArray(data.estadosProducto)) {
        setEstadosProducto(data.estadosProducto)
      } else {
        console.error("Formato de datos inesperado para estados de producto:", data)
        setEstadosProducto([])
      }
    } catch (err) {
      console.error("Error al cargar estados de producto:", err)
      setEstadosProducto([])
    } finally {
      setLoadingEstados(false)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    fetchEstadosProducto()
    // No cargar productos automáticamente al inicio
  }, [])

  // Actualizar productos cuando cambian los filtros
  const handleSearch = () => {
    fetchProductos()
  }

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

  // Estilos para los botones de acción
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventario de Productos
      </Typography>

      <InventarioNav activeTab="productos" />

      <Paper sx={{ p: 2, mb: 3 }}>
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
                {loadingEstados ? (
                  <MenuItem disabled>Cargando estados...</MenuItem>
                ) : estadosProducto && estadosProducto.length > 0 ? (
                  estadosProducto.map((estado) => (
                    <MenuItem key={estado.idEstadoProducto} value={estado.idEstadoProducto.toString()}>
                      {estado.descEstadoProducto}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No hay estados disponibles</MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant="contained"
              sx={actionButtonStyles.actualizar}
              startIcon={<RefreshIcon />}
              onClick={handleSearch}
              fullWidth
            >
              ACTUALIZAR
            </Button>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <Button variant="contained" sx={actionButtonStyles.crear} href="/producto/formulario" fullWidth>
              CREAR
            </Button>
          </Grid>
        </Grid>
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
      ) : !hasSearched ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Utilice los filtros para buscar productos
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Ingrese un término de búsqueda o seleccione un estado para ver resultados
          </Typography>
        </Paper>
      ) : productos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" color="error">
            No se encontraron productos con los filtros seleccionados
          </Typography>
        </Paper>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((producto) => (
                <TableRow
                  key={producto.idProducto}
                  hover
                  onClick={() => handleOpenDialog(producto)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{producto.nombreProducto}</TableCell>
                  <TableCell>{producto.descripcion}</TableCell>
                  <TableCell>{producto.tipoProducto?.descTipoProducto || "N/A"}</TableCell>
                  <TableCell>
                    {producto.unidadMedida
                      ? `${producto.unidadMedida.descUnidadMedida} (${producto.unidadMedida.abreviatura})`
                      : "N/A"}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {Number.parseFloat(producto.stockActual || 0).toFixed(2)}
                      </Typography>
                      {renderStockStatus(producto.stockActual || 0)}
                    </Box>
                  </TableCell>
                  <TableCell>{producto.estadoProducto?.descEstadoProducto || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Diálogo para ajustar stock */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Ajustar Stock</DialogTitle>
        <DialogContent>
          {selectedProducto && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Producto: {selectedProducto.nombreProducto}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Stock actual: {Number.parseFloat(selectedProducto.stockActual || 0).toFixed(2)}{" "}
                {selectedProducto.unidadMedida ? selectedProducto.unidadMedida.abreviatura : ""}
              </Typography>

              <TextField
                autoFocus
                margin="dense"
                label="Cantidad"
                type="number"
                fullWidth
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                helperText="Ingrese un valor positivo para añadir o negativo para reducir"
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
