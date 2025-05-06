"use client"

import { useState } from "react"
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
  Grid,
  InputAdornment,
  Pagination,
  Stack,
  Tabs,
  Tab,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import SearchIcon from "@mui/icons-material/Search"
import ListIcon from "@mui/icons-material/List"
import BusinessIcon from "@mui/icons-material/Business"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/src/components/ConfirmDialog"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Estado para el tipo de búsqueda (por RUC o por razón social)
  const [searchType, setSearchType] = useState(0) // 0: Por RUC, 1: Por razón social

  // Estado para el formulario de búsqueda
  const [busquedaRUC, setBusquedaRUC] = useState("")
  const [busquedaRazonSocial, setBusquedaRazonSocial] = useState("")

  // Estado para controlar si ya se realizó una búsqueda
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Estado para la paginación
  const [paginacion, setPaginacion] = useState({
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    empresaId: null,
    empresaNombre: "",
  })

  const handleSearchTypeChange = (event, newValue) => {
    setSearchType(newValue)
  }

  const handleInputChangeRUC = (e) => {
    setBusquedaRUC(e.target.value)
  }

  const handleInputChangeRazonSocial = (e) => {
    setBusquedaRazonSocial(e.target.value)
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    if (searchType === 0) {
      // Búsqueda por RUC
      // Validar que se haya ingresado el RUC
      if (!busquedaRUC.trim()) {
        setError("Debe ingresar un número de RUC para buscar")
        return
      }

      setSearching(true)
      setError(null)
      setBusquedaRealizada(true)

      try {
        const response = await fetch(`/api/empresas?numeroDocumento=${busquedaRUC}`)

        if (!response.ok) {
          throw new Error("Error al buscar empresas")
        }

        const data = await response.json()

        // En búsqueda por RUC, no usamos paginación
        setEmpresas(data)

        // Resetear la paginación
        setPaginacion({
          page: 1,
          pageSize: 50,
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
    } else {
      // Búsqueda por razón social
      // Validar que se haya ingresado la razón social
      if (!busquedaRazonSocial.trim()) {
        setError("Debe ingresar una razón social para buscar")
        return
      }

      setSearching(true)
      setError(null)
      setBusquedaRealizada(true)

      try {
        const response = await fetch(`/api/empresas?razonSocial=${encodeURIComponent(busquedaRazonSocial)}`)

        if (!response.ok) {
          throw new Error("Error al buscar empresas")
        }

        const data = await response.json()

        // En búsqueda por razón social, no usamos paginación
        setEmpresas(data)

        // Resetear la paginación
        setPaginacion({
          page: 1,
          pageSize: 50,
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
  }

  // Función para listar todas las empresas activas con paginación
  const handleListAll = async (page = 1) => {
    setSearching(true)
    setError(null)
    setBusquedaRealizada(true)

    // Limpiar los campos de búsqueda
    setBusquedaRUC("")
    setBusquedaRazonSocial("")

    try {
      const response = await fetch(`/api/empresas/all?page=${page}&pageSize=50`)

      if (!response.ok) {
        throw new Error("Error al obtener empresas")
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      // Verificar que los datos tengan la estructura esperada
      if (!data || typeof data !== "object") {
        throw new Error("Formato de respuesta inválido")
      }

      // Actualizar las empresas y la información de paginación
      setEmpresas(data.empresas || [])
      setPaginacion(
        data.pagination || {
          page: 1,
          pageSize: 50,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      )
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      // Establecer estados consistentes en caso de error
      setEmpresas([])
      setPaginacion({
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      })
    } finally {
      setSearching(false)
    }
  }

  // Manejar cambio de página
  const handlePageChange = (event, newPage) => {
    handleListAll(newPage)
  }

  const handleDeleteClick = (id, razonSocial) => {
    setConfirmDialog({
      open: true,
      empresaId: id,
      empresaNombre: razonSocial,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/empresas/${confirmDialog.empresaId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar empresa")
      }

      // Actualizar la lista de empresas
      setEmpresas(empresas.filter((empresa) => empresa.idEmpresa !== confirmDialog.empresaId))

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
    console.log(`Navegando a /empresas/${id}`)
    router.push(`/empresas/${id}`)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver a Gestión
          </Button>
          <Typography variant="h5" component="h1">
            Gestión de Empresas
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} component={Link} href="/empresas/nueva">
          Nueva Empresa
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
          Buscar Empresa
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={searchType} onChange={handleSearchTypeChange} aria-label="Tipo de búsqueda">
            <Tab label="Por RUC" />
            <Tab label="Por Razón Social" />
          </Tabs>
        </Box>

        {searchType === 0 ? (
          // Búsqueda por RUC
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  label="Número de RUC"
                  id="numeroRUC"
                  name="numeroRUC"
                  value={busquedaRUC}
                  onChange={handleInputChangeRUC}
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
                  disabled={searching}
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
        ) : (
          // Búsqueda por razón social
          <form onSubmit={handleSearch}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={7}>
                <TextField
                  fullWidth
                  label="Razón Social"
                  id="razonSocial"
                  name="razonSocial"
                  value={busquedaRazonSocial}
                  onChange={handleInputChangeRazonSocial}
                  required
                  disabled={searching}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <BusinessIcon />
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
        )}
      </Paper>

      {/* Tabla de resultados */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Razón Social</TableCell>
                <TableCell>RUC</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Contacto</TableCell>
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
                        {searching ? "Buscando empresas..." : "Cargando..."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : empresas.length > 0 ? (
                empresas.map((empresa) => (
                  <TableRow key={empresa.idEmpresa}>
                    <TableCell>{empresa.idEmpresa}</TableCell>
                    <TableCell>{empresa.razonSocial}</TableCell>
                    <TableCell>{empresa.ruc}</TableCell>
                    <TableCell>{empresa.categoriaEmpresa?.descCategoriaEmpresa || "N/A"}</TableCell>
                    <TableCell>{empresa.ciudad?.descCiudad || "N/A"}</TableCell>
                    <TableCell>{empresa.contacto || "No especificado"}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(empresa.idEmpresa)}
                        aria-label="Editar empresa"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(empresa.idEmpresa, empresa.razonSocial)}
                        aria-label="Eliminar empresa"
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
                        No se encontraron empresas con los criterios de búsqueda
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">
                        Utilice el buscador para encontrar empresas o haga clic en "Listar Todos"
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
                count={paginacion.totalPages}
                page={paginacion.page}
                onChange={handlePageChange}
                color="primary"
                disabled={searching}
              />
              <Typography variant="body2" color="text.secondary" align="center">
                Mostrando {empresas.length} de {paginacion.totalItems} empresas (Página {paginacion.page} de{" "}
                {paginacion.totalPages})
              </Typography>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Eliminar Empresa"
        message={`¿Está seguro que desea eliminar la empresa "${confirmDialog.empresaNombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}
