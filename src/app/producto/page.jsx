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

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/productos")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error de API:", errorData)
        alert(`Error al cargar los productos: ${errorData.error || response.statusText}`)
        return
      }

      const data = await response.json()
      setProductos(data)
    } catch (error) {
      console.error("Error de red:", error)
      alert(`Error al cargar los productos: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

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
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar el producto")
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button component={Link} href="/gestion-productos" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
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
                productos.map((producto) => (
                  <TableRow key={producto.idProducto}>
                    <TableCell>{producto.idProducto}</TableCell>
                    <TableCell>{producto.nombreProducto}</TableCell>
                    <TableCell>{producto.descripcion}</TableCell>
                    <TableCell>{producto.tipoProducto?.nombreTipoProducto || "N/A"}</TableCell>
                    <TableCell>{producto.pesoUnidad}</TableCell>
                    <TableCell>{producto.precioUnitario}</TableCell>
                    <TableCell>
                      {producto.unidadMedida
                        ? `${producto.unidadMedida.descUnidadMedida} (${producto.unidadMedida.abreviatura})`
                        : "N/A"}
                    </TableCell>
                    <TableCell>{producto.estadoProducto?.nombreEstadoProducto || "N/A"}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleEdit(producto)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDelete(producto)} size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
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
    </Container>
  )
}

