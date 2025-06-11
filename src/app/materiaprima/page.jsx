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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material"
import { Add, Edit, Delete, ArrowBack } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ListaMateriaPrima() {
  const router = useRouter()
  const [materiasPrimas, setMateriasPrimas] = useState([])
  const [openDelete, setOpenDelete] = useState(false)
  const [selectedMateriaPrima, setSelectedMateriaPrima] = useState(null)
  const [loading, setLoading] = useState(false)
  // Filtros
  const [filtroId, setFiltroId] = useState("")
  const [filtroDescripcion, setFiltroDescripcion] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("")
  const [estados, setEstados] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  // Cargar estados para el filtro
  useEffect(() => {
    const fetchEstados = async () => {
      try {
        const res = await fetch("/api/estadomateriaprima")
        if (res.ok) {
          const data = await res.json()
          setEstados(data)
        }
      } catch (e) {
        // No hacer nada
      }
    }
    fetchEstados()
  }, [])

  const fetchMateriasPrimas = async (params = {}) => {
    try {
      setLoading(true)
      setHasSearched(true)
      const token = localStorage.getItem("accessToken")
      let url = "/api/materiaprima/buscar?"
      const searchParams = new URLSearchParams()
      if (params.id) searchParams.append("id", params.id)
      if (params.descripcion) searchParams.append("query", params.descripcion)
      if (params.estado) searchParams.append("estado", params.estado)
      url += searchParams.toString()
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
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

  const handleBuscar = (e) => {
    e.preventDefault()
    fetchMateriasPrimas({
      id: filtroId,
      descripcion: filtroDescripcion,
      estado: filtroEstado,
    })
  }

  const handleMostrarTodos = () => {
    setFiltroId("")
    setFiltroDescripcion("")
    setFiltroEstado("")
    fetchMateriasPrimas({})
  }

  const handleLimpiarFiltros = () => {
    setFiltroId("")
    setFiltroNombre("")
    setFiltroDescripcion("")
    setFiltroTipo("")
    setFiltroEstado("")
    setProductos([])
    setHasSearched(false)
  }

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
        <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
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

      <Paper sx={{ mb: 3, p: 2 }}>
        <form onSubmit={handleBuscar}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3} md={2}>
              <TextField
                label="ID"
                value={filtroId}
                onChange={e => setFiltroId(e.target.value)}
                fullWidth
                size="small"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={5} md={4}>
              <TextField
                label="Descripción o Nombre"
                value={filtroDescripcion}
                onChange={e => setFiltroDescripcion(e.target.value)}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filtroEstado}
                  label="Estado"
                  onChange={e => setFiltroEstado(e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {estados.map((estado) => (
                    <MenuItem key={estado.idEstadoMateriaPrima} value={estado.idEstadoMateriaPrima}>
                      {estado.descEstadoMateriaPrima}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Buscar
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button variant="text" onClick={handleMostrarTodos} fullWidth>Mostrar todos</Button>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button variant="text" onClick={handleLimpiarFiltros} fullWidth>Limpiar filtros</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        hasSearched ? (
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
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography variant="body1" color="text.secondary">
              Favor utilizar los filtros de búsqueda para visualizar las materias primas.
            </Typography>
          </Box>
        )
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

