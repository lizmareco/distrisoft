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
  Tooltip,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import BusinessIcon from "@mui/icons-material/Business"
import SearchIcon from "@mui/icons-material/Search"
import ListIcon from "@mui/icons-material/List"
import CommentIcon from "@mui/icons-material/Comment"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/src/components/ConfirmDialog"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([])
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

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    proveedorId: null,
    proveedorNombre: "",
  })

  // Cargar tipos de documento al iniciar
  useEffect(() => {
    const fetchTiposDocumento = async () => {
      try {
        setLoadingTipos(true)
        setError(null)
        console.log("Cargando tipos de documento...")

        const response = await fetch("/api/tipos-documento")

        if (!response.ok) {
          throw new Error(`Error al cargar tipos de documento: ${response.status}`)
        }

        const data = await response.json()

        // Verificar que los datos sean un array
        if (!Array.isArray(data)) {
          console.error("Respuesta inesperada para tipos de documento:", data)
          throw new Error("Formato de respuesta inválido para tipos de documento")
        }

        console.log(`Se cargaron ${data.length} tipos de documento`)
        setTiposDocumento(data)
      } catch (error) {
        console.error("Error:", error)
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
        `/api/proveedores?tipoDocumento=${busqueda.tipoDocumento}&numeroDocumento=${busqueda.numeroDocumento}`,
      )

      if (!response.ok) {
        throw new Error(`Error al buscar proveedores: ${response.status}`)
      }

      const data = await response.json()
      setProveedores(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setSearching(false)
    }
  }

  // Función para listar todos los proveedores
  const handleListAll = async () => {
    setSearching(true)
    setError(null)
    setBusquedaRealizada(true)

    // Limpiar los campos de búsqueda
    setBusqueda({
      tipoDocumento: "",
      numeroDocumento: "",
    })

    try {
      const response = await fetch("/api/proveedores/all")

      if (!response.ok) {
        throw new Error(`Error al obtener todos los proveedores: ${response.status}`)
      }

      const data = await response.json()
      setProveedores(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setSearching(false)
    }
  }

  const handleDeleteClick = (id, nombre) => {
    setConfirmDialog({
      open: true,
      proveedorId: id,
      proveedorNombre: nombre,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/proveedores/${confirmDialog.proveedorId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar proveedor")
      }

      // Actualizar la lista de proveedores
      setProveedores(proveedores.filter((proveedor) => proveedor.idProveedor !== confirmDialog.proveedorId))

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
    console.log(`Navegando a /proveedores/${id}`)
    router.push(`/proveedores/${id}`)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver a Gestión
          </Button>
          <Typography variant="h5" component="h1">
            Gestión de Proveedores
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} component={Link} href="/proveedores/nuevo">
          Registrar Nuevo Proveedor
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
          Buscar Proveedor
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
                onClick={handleListAll}
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
                <TableCell>Empresa</TableCell>
                <TableCell>RUC</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Comentarios</TableCell>
                <TableCell>Fecha Registro</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading || searching ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3 }}>
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        {searching ? "Buscando proveedores..." : "Cargando..."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <TableRow key={proveedor.idProveedor}>
                    <TableCell>{proveedor.idProveedor}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <BusinessIcon sx={{ mr: 1, color: "primary.main" }} />
                        {proveedor.empresa.razonSocial}
                      </Box>
                    </TableCell>
                    <TableCell>{proveedor.empresa.ruc}</TableCell>
                    <TableCell>
                      {proveedor.empresa.persona
                        ? `${proveedor.empresa.persona.nombre} ${proveedor.empresa.persona.apellido}`
                        : "No especificado"}
                    </TableCell>
                    <TableCell>
                      {proveedor.comentario ? (
                        <Tooltip title={proveedor.comentario}>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CommentIcon sx={{ mr: 1, color: "text.secondary" }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {proveedor.comentario}
                            </Typography>
                          </Box>
                        </Tooltip>
                      ) : (
                        "Sin comentarios"
                      )}
                    </TableCell>
                    <TableCell>{new Date(proveedor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(proveedor.idProveedor)}
                        aria-label="Editar proveedor"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(proveedor.idProveedor, proveedor.empresa.razonSocial)}
                        aria-label="Eliminar proveedor"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : busquedaRealizada && !searching ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        No se encontraron proveedores con los criterios de búsqueda
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Utilice el buscador para encontrar proveedores o haga clic en "Listar Todos"
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Eliminar Proveedor"
        message={`¿Está seguro que desea eliminar al proveedor ${confirmDialog.proveedorNombre}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}
