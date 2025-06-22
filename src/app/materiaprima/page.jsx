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
  Alert,
  TablePagination
} from "@mui/material"
import { Add, Edit, Delete, ArrowBack } from "@mui/icons-material"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useRootContext } from "@/src/app/context/root"

export default function ListaMateriaPrima() {
  // Hooks de estado y efectos incondicionales
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
  
  // Paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)

  // Obtener contexto y permisos
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_MATERIAPRIMA") || context.session?.isAdmin

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
        // No hacer nada en caso de error
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
      searchParams.append("page", (page + 1).toString())
      searchParams.append("limit", rowsPerPage.toString())
      url += searchParams.toString()
      const response = await fetch(url, {
        credentials: "include",
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      })
      if (!response.ok) throw new Error("Error al cargar materias primas")
      const data = await response.json()
      setMateriasPrimas(data.materiasPrimas || data || [])
      setTotalRegistros(data.meta?.total || data.length || 0)
    } catch (error) {
      console.error("Error:", error)
      alert("Error al cargar las materias primas")
    } finally {
      setLoading(false)
    }
  }

  // Cargar datos cuando cambia la paginación, pero solo si ya se realizó una búsqueda
  useEffect(() => {
    if (hasSearched) {
      fetchMateriasPrimas({
        id: filtroId,
        descripcion: filtroDescripcion,
        estado: filtroEstado,
      })
    }
  }, [page, rowsPerPage])

  const handleBuscar = (e) => {
    e.preventDefault()
    setPage(0) // Resetear a la primera página
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
    setPage(0)
    fetchMateriasPrimas({})
  }

  const handleLimpiarFiltros = () => {
    setFiltroId("")
    setFiltroDescripcion("")
    setFiltroEstado("")
    setPage(0)
    setMateriasPrimas([])
    setTotalRegistros(0)
    setHasSearched(false)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
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

      // Recargar los datos solo si ya se realizó una búsqueda
      if (hasSearched) {
        fetchMateriasPrimas({
          id: filtroId,
          descripcion: filtroDescripcion,
          estado: filtroEstado,
        })
      }
      handleCloseDelete()
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar la materia prima")
    }
  }

  // Definir el contenido a renderizar según el permiso
  const content = !hasPermission ? (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Alert severity="error">No tiene permisos para ver esta página</Alert>
    </Container>
  ) : (
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
      ) : !hasSearched ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Utilice los filtros para buscar materias primas
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Seleccione los criterios de búsqueda y haga clic en "Buscar"
          </Typography>
        </Paper>
      ) : (
        <>
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
                    <TableCell colSpan={5} align="center">
                      No se encontraron materias primas con los criterios seleccionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {hasSearched && totalRegistros > 0 && (
            <TablePagination
              component="div"
              count={totalRegistros}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          )}
        </>
      )}

      {/* Confirmación de Eliminación */}
      <Dialog open={openDelete} onClose={handleCloseDelete}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea eliminar la materia prima "{selectedMateriaPrima?.nombreMateriaPrima}"? Esta acción no se puede deshacer.
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

  return content
}

