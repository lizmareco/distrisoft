"use client"

import { useState, useEffect } from "react"
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
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  FormControlLabel,
  Switch,
  Chip,
} from "@mui/material"
import { Add, Edit, Delete, ArrowBack } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ListaProducto() {
  const router = useRouter()
  const [productos, setProductos] = useState([])
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/productos?includeInactive=${includeInactive}`)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error de API:", errorData)
        showSnackbar(`Error al cargar los productos: ${errorData.error || response.statusText}`, "error")
        return
      }

      const data = await response.json()

      // Agregar logs para depuración
      console.log(`Productos cargados: ${data.length}`)
      if (data.length > 0) {
        console.log("Ejemplo de producto:", {
          id: data[0].idProducto,
          nombre: data[0].nombreProducto,
          tipoProducto: data[0].tipoProducto,
        })
      }

      setProductos(data)
    } catch (error) {
      console.error("Error de red:", error)
      showSnackbar(`Error al cargar los productos: ${error.message}`, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [includeInactive])

  const handleEdit = (producto) => {
    router.push(`/producto/formulario?id=${producto.idProducto}`)
  }

  const handleNew = () => {
    router.push("/producto/formulario")
  }

  const handleOpenDelete = (producto) => {
    setSelectedProducto(producto)
    setOpenDelete(true)
  }

  const handleCloseDelete = () => {
    setOpenDelete(false)
    setSelectedProducto(null)
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/productos/${selectedProducto.idProducto}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar producto")

      await fetchProductos()
      handleCloseDelete()
      showSnackbar("Producto eliminado correctamente", "success")
    } catch (error) {
      console.error("Error:", error)
      showSnackbar("Error al eliminar el producto", "error")
    }
  }

  const handleIncludeInactiveChange = (event) => {
    setIncludeInactive(event.target.checked)
  }

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({
      open: true,
      message,
      severity,
    })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    })
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/dashboard" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
        </Button>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Productos
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNew}>
          Nuevo Producto
        </Button>
      </Box>

      {/* Switch para mostrar/ocultar productos inactivos */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <FormControlLabel
          control={<Switch checked={includeInactive} onChange={handleIncludeInactiveChange} color="primary" />}
          label="Mostrar productos inactivos"
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Peso Unidad</TableCell>
                <TableCell>Precio Unitario</TableCell>
                <TableCell>Unidad de Medida</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.length > 0 ? (
                productos.map((producto) => {
                  const isActive = producto.idEstadoProducto === 1 // Asumiendo que 1 es el ID del estado "Activo"
                  return (
                    <TableRow
                      key={producto.idProducto}
                      sx={{
                        opacity: isActive ? 1 : 0.7,
                        backgroundColor: isActive ? "inherit" : "rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <TableCell>{producto.idProducto}</TableCell>
                      <TableCell>{producto.nombreProducto}</TableCell>
                      <TableCell>{producto.descripcion}</TableCell>
                      <TableCell>
                        {producto.tipoProducto?.nombreTipoProducto || producto.tipoProducto?.descTipoProducto || "N/A"}
                      </TableCell>
                      <TableCell>
                        {typeof producto.pesoUnidad === "number"
                          ? producto.pesoUnidad.toLocaleString("es-ES", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })
                          : producto.pesoUnidad}
                      </TableCell>
                      <TableCell>
                        {typeof producto.precioUnitario === "number"
                          ? producto.precioUnitario.toLocaleString("es-ES", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })
                          : producto.precioUnitario}
                      </TableCell>
                      <TableCell>
                        {producto.unidadMedida
                          ? `${producto.unidadMedida.descUnidadMedida} (${producto.unidadMedida.abreviatura})`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={producto.estadoProducto?.descEstadoProducto || "N/A"}
                          color={isActive ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton color="primary" onClick={() => handleEdit(producto)} size="small" title="Editar">
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleOpenDelete(producto)}
                          disabled={!isActive}
                          size="small"
                          title="Eliminar"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay productos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar el producto "{selectedProducto?.nombreProducto}"? Esta acción no se puede
            deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
