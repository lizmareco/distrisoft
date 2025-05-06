"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
  Pagination,
  Stack,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import SearchIcon from "@mui/icons-material/Search"
import ListIcon from "@mui/icons-material/List"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/src/components/ConfirmDialog"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function PersonasPage() {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [loadingTipos, setLoadingTipos] = useState(true)
  const router = useRouter()

  // Estado para el formulario de búsqueda
  const [busqueda, setBusqueda] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
  })

  // Estado para controlar si ya se realizó una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Estado para la paginación
  const [paginacion, setPaginacion] = useState({
    page: 1,
    pageSize: 100,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    personaId: null,
    personaNombre: "",
  })

  // Cargar tipos de documento al iniciar
  useEffect(() => {
    const fetchTiposDocumento = async () => {
      try {
        setLoadingTipos(true)
        setError(null) // Limpiar errores previos

        const response = await fetch("/api/tipos-documento")

        if (!response.ok) {
          throw new Error(`Error al cargar tipos de documento: ${response.status}`)
        }

        const data = await response.json()

        if (!Array.isArray(data)) {
          console.error("Respuesta inesperada:", data)
          throw new Error("Formato de respuesta inválido para tipos de documento")
        }

        setTiposDocumento(data)
      } catch (error) {
        console.error("Error al cargar tipos de documento:", error)
        setError("Error al cargar tipos de documento: " + error.message)
      } finally {
        setLoadingTipos(false)
      }
    }

    fetchTiposDocumento()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBusqueda({
      ...busqueda,
      [name]: value,
    })
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    // Validar que se hayan ingresado ambos campos
    if (!busqueda.tipoDocumento || !busqueda.numeroDocumento) {
      setError("Debe seleccionar un tipo de documento e ingresar un número de documento")
      return
    }

    setSearching(true)
    setError(null)
    setBusquedaRealizada(true)

    try {
      const response = await fetch(
        `/api/personas?tipoDocumento=${busqueda.tipoDocumento}&numeroDocumento=${busqueda.numeroDocumento}`,
      )

      if (!response.ok) {
        throw new Error("Error al buscar personas")
      }

      const data = await response.json()

      // En búsqueda por documento, no usamos paginación
      setPersonas(data)

      // Resetear la paginación
      setPaginacion({
        page: 1,
        pageSize: 100,
        totalItems: data.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      })
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setSearching(false)
    }
  }

  // Función para listar todas las personas activas con paginación
  const handleListAll = async (page = 1) => {
    setSearching(true)
    setError(null)
    setBusquedaRealizada(true)

    // Limpiar los campos de búsqueda
    setBusqueda({
      tipoDocumento: "",
      numeroDocumento: "",
    })

    try {
      const response = await fetch(`/api/personas/all?page=${page}&pageSize=100`)

      if (!response.ok) {
        throw new Error("Error al obtener personas")
      }

      const data = await response.json()
      console.log("Datos recibidos:", data) // Para depuración

      // Verificar que la estructura de datos sea la esperada
      if (data && Array.isArray(data)) {
        // Si la respuesta es un array (formato antiguo)
        setPersonas(data)
        setPaginacion({
          page: 1,
          pageSize: data.length,
          totalItems: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else if (data && data.personas && Array.isArray(data.personas)) {
        // Si la respuesta tiene el formato nuevo con paginación
        setPersonas(data.personas)
        setPaginacion(
          data.pagination || {
            page: 1,
            pageSize: data.personas.length,
            totalItems: data.personas.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        )
      } else {
        // Si la estructura no es la esperada
        setPersonas([])
        setPaginacion({
          page: 1,
          pageSize: 0,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        })
        throw new Error("Formato de respuesta inesperado")
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      setPersonas([])
    } finally {
      setSearching(false)
    }
  }

  // Manejar cambio de página
  const handlePageChange = (event, newPage) => {
    handleListAll(newPage)
  }

  const handleDeleteClick = (id, nombre, apellido) => {
    setConfirmDialog({
      open: true,
      personaId: id,
      personaNombre: `${nombre} ${apellido}`,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/personas/${confirmDialog.personaId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar persona")
      }

      // Actualizar la lista de personas
      setPersonas(personas.filter((persona) => persona.idPersona !== confirmDialog.personaId))

      // Cerrar el diálogo
      setConfirmDialog({ ...confirmDialog, open: false })
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      // Cerrar el diálogo incluso si hay error
      setConfirmDialog({ ...confirmDialog, open: false })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ ...confirmDialog, open: false })
  }

  const handleEdit = (id) => {
    console.log(`Navegando a /personas/${id}`)
    router.push(`/personas/${id}`)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver a Gestión
          </Button>
          <Typography variant="h5" component="h1">
            Gestión de Personas
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} component={Link} href="/personas/nueva">
          Nueva Persona
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Formulario de búsqueda */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Buscar Persona
        </Typography>
        <form onSubmit={handleSearch}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={loadingTipos || searching}>
                <InputLabel id="tipo-documento-label">Tipo de Documento</InputLabel>
                <Select
                  labelId="tipo-documento-label"
                  id="tipoDocumento"
                  name="tipoDocumento"
                  value={busqueda.tipoDocumento}
                  onChange={handleInputChange}
                  label="Tipo de Documento"
                  required
                >
                  {tiposDocumento.map((tipo) => (
                    <MenuItem key={tipo.idTipoDocumento} value={tipo.idTipoDocumento}>
                      {tipo.descTipoDocumento}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Número de Documento"
                id="numeroDocumento"
                name="numeroDocumento"
                value={busqueda.numeroDocumento}
                onChange={handleInputChange}
                required
                disabled={searching}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={searching || loadingTipos}
                sx={{ height: "56px" }}
              >
                {searching ? <CircularProgress size={24} /> : "Buscar"}
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                startIcon={<ListIcon />}
                onClick={() => handleListAll(1)}
                disabled={searching}
                sx={{ height: "56px" }}
              >
                Listar Todos
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Tabla de resultados */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || searching ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {searching ? "Buscando personas..." : "Cargando..."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : personas.length > 0 ? (
                personas.map((persona) => (
                  <TableRow key={persona.idPersona}>
                    <TableCell>{persona.idPersona}</TableCell>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell>{persona.apellido}</TableCell>
                    <TableCell>{`${persona.tipoDocumento?.descTipoDocumento || "N/A"}: ${persona.nroDocumento}`}</TableCell>
                    <TableCell>{persona.nroTelefono || "N/A"}</TableCell>
                    <TableCell>{persona.correoPersona || "N/A"}</TableCell>
                    <TableCell>{persona.ciudad?.descCiudad || "N/A"}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(persona.idPersona)}
                        aria-label="Editar persona"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(persona.idPersona, persona.nombre, persona.apellido)}
                        aria-label="Eliminar persona"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : busquedaRealizada && !searching ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron personas con los criterios de búsqueda
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Utilice el buscador para encontrar personas o haga clic en "Listar Todos"
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Controles de paginación */}
        {busquedaRealizada && paginacion && paginacion.totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <Stack spacing={2}>
              <Pagination
                count={paginacion.totalPages || 1}
                page={paginacion.page || 1}
                onChange={handlePageChange}
                color="primary"
                disabled={searching}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                Mostrando {personas ? personas.length : 0} de {paginacion.totalItems || 0} personas (Página{" "}
                {paginacion.page || 1} de {paginacion.totalPages || 1})
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Eliminar Persona"
        message={`¿Está seguro que desea eliminar a ${confirmDialog.personaNombre}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}
