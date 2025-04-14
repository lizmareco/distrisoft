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

export default function ListaMateriaPrima() {
  const router = useRouter()
  const [materiasPrimas, setMateriasPrimas] = useState([])
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedMateriaPrima, setSelectedMateriaPrima] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMateriasPrimas = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/materiaprima")
      if (!response.ok) throw new Error("Error al cargar materias primas")
      const data = await response.json()
      setMateriasPrimas(data)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar las materias primas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMateriasPrimas()
  }, [])

  const handleEdit = (materiaPrima) => {
    router.push(`/materiaprima/formulario?id=${materiaPrima.idMateriaPrima}`)
  }

  const handleNew = () => {
    router.push("/materiaprima/formulario")
  }

  const handleOpenDelete = (materiaPrima) => {
    setSelectedMateriaPrima(materiaPrima)
    setOpenDelete(true)
  }

  const handleCloseDelete = () => {
    setOpenDelete(false)
    setSelectedMateriaPrima(null)
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/materiaprima/${selectedMateriaPrima.idMateriaPrima}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar materia prima")

      await fetchMateriasPrimas()
      handleCloseDelete()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar la materia prima")
    }
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
          Materias Primas
        </Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleNew}>
          Nueva Materia Prima
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
                <TableCell>Estado</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {materiasPrimas.length > 0 ? (
                materiasPrimas.map((materiaPrima) => (
                  <TableRow key={materiaPrima.idMateriaPrima}>
                    <TableCell>{materiaPrima.idMateriaPrima}</TableCell>
                    <TableCell>{materiaPrima.nombreMateriaPrima}</TableCell>
                    <TableCell>{materiaPrima.descMateriaPrima}</TableCell>
                    <TableCell>
                      {materiaPrima.estadoMateriaPrima ? materiaPrima.estadoMateriaPrima.descEstadoMateriaPrima : "N/A"}
                    </TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleEdit(materiaPrima)} size="small">
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDelete(materiaPrima)} size="small">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay materias primas registradas
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
            ¿Está seguro de que desea eliminar la materia prima "{selectedMateriaPrima?.nombreMateriaPrima}"? Esta
            acción no se puede deshacer.
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

