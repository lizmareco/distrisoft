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
  Pagination,
  Stack,
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
import { useRootContext } from "@/src/app/context/root"

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()
  const context = useRootContext()
  const permisos = context.session?.permisos || []
  const hasPermission =
    permisos.find(permiso => permiso === "VIEW_PROVEEDOR") || context.session?.isAdmin

  // Estado para el formulario de búsqueda
  const [busqueda, setBusqueda] = useState({
    ruc: "",
    razonSocial: "",
  })

  // Estado para controlar si ya se realizó una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Estado para la paginación
  const [paginacion, setPaginacion] = useState({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    proveedorId: null,
    proveedorNombre: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setBusqueda({
      ...busqueda,
      [name]: value,
    })
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    // Validar que se haya ingresado al menos un campo
    if (!busqueda.ruc && !busqueda.razonSocial) {
      setError("Debe ingresar un RUC o razón social")
      return
    }

    setSearching(true)
    setError(null)
    setBusquedaRealizada(true)

    try {
      // Construir la URL con los parámetros proporcionados
      const params = new URLSearchParams()
      if (busqueda.ruc) params.append("ruc", busqueda.ruc)
      if (busqueda.razonSocial) params.append("razonSocial", busqueda.razonSocial)

      const response = await fetch(`/api/proveedores?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`Error al buscar proveedores: ${response.status}`)
      }

      const data = await response.json()
      
      // La API ahora devuelve el formato correcto con paginación
      if (data && data.proveedores && Array.isArray(data.proveedores)) {
        setProveedores(data.proveedores)
        setPaginacion(data.pagination || {
          page: 1,
          pageSize: 10,
          totalItems: data.proveedores.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else if (Array.isArray(data)) {
        // Fallback para formato antiguo (no debería ocurrir)
        setProveedores(data)
        setPaginacion({
          page: 1,
          pageSize: data.length,
          totalItems: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else {
        setProveedores([])
        setPaginacion({
          page: 1,
          pageSize: 0,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setSearching(false)
    }
  }

  // Función para listar todos los proveedores con paginación
  const handleListAll = async (page = 1) => {
    setSearching(true)
    setError(null)
    setBusquedaRealizada(true)

    // Limpiar los campos de búsqueda
    setBusqueda({
      ruc: "",
      razonSocial: "",
    })

    try {
      const response = await fetch(`/api/proveedores/all?page=${page}&pageSize=${paginacion.pageSize}`)

      if (!response.ok) {
        throw new Error(`Error al obtener todos los proveedores: ${response.status}`)
      }

      const data = await response.json()
      
      // Verificar si la respuesta tiene formato de paginación
      if (data && data.proveedores && Array.isArray(data.proveedores)) {
        setProveedores(data.proveedores)
        setPaginacion(data.pagination || {
          page: 1,
          pageSize: data.proveedores.length,
          totalItems: data.proveedores.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else if (Array.isArray(data)) {
        // Formato antiguo sin paginación
        setProveedores(data)
        setPaginacion({
          page: 1,
          pageSize: data.length,
          totalItems: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      } else {
        setProveedores([])
        setPaginacion({
          page: 1,
          pageSize: 0,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setSearching(false)
    }
  }

  // Manejar cambio de página
  const handlePageChange = (event, newPage) => {
    handleListAll(newPage)
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

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">No tiene permisos para ver esta página</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
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
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="RUC"
                id="ruc"
                name="ruc"
                value={busqueda.ruc}
                onChange={handleInputChange}
                disabled={searching}
                placeholder="Ingrese el RUC del proveedor"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Razón Social"
                id="razonSocial"
                name="razonSocial"
                value={busqueda.razonSocial}
                onChange={handleInputChange}
                disabled={searching}
                placeholder="Ingrese la razón social"
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
                disabled={searching}
                sx={{ height: "56px" }}
              >
                {searching ? <CircularProgress size={24} /> : "Buscar"}
              </Button>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                startIcon={<ListIcon />}
                onClick={() => handleListAll()}
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
                Mostrando {proveedores ? proveedores.length : 0} de {paginacion.totalItems || 0} proveedores (Página{" "}
                {paginacion.page || 1} de {paginacion.totalPages || 1})
              </Typography>
            </Stack>
          </Box>
        )}
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
