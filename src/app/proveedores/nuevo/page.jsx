"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  InputAdornment,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import BusinessIcon from "@mui/icons-material/Business"
import SearchIcon from "@mui/icons-material/Search"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CommentIcon from "@mui/icons-material/Comment"
import Link from "next/link"

export default function NuevoProveedorPage() {
  const router = useRouter()

  // Estado para el formulario
  const [formData, setFormData] = useState({
    idEmpresa: "",
    comentario: "", // Nuevo campo para comentarios
  })

  // Estado para los datos de búsqueda
  const [busquedaEmpresa, setBusquedaEmpresa] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
  })

  // Estado para los resultados de búsqueda
  const [empresasEncontradas, setEmpresasEncontradas] = useState([])

  // Estado para indicar si se está buscando
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false)

  // Estado para indicar si ya se realizó una búsqueda
  const [busquedaEmpresaRealizada, setBusquedaEmpresaRealizada] = useState(false)

  const [tiposDocumento, setTiposDocumento] = useState([])
  const [selectedEmpresa, setSelectedEmpresa] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Cargando datos para nuevo proveedor...")
        // Cargar tipos de documento
        const tiposDocRes = await fetch("/api/tipos-documento")

        if (!tiposDocRes.ok) {
          throw new Error("Error al cargar tipos de documento")
        }

        const tiposDocData = await tiposDocRes.json()
        console.log("Tipos de documento cargados:", tiposDocData.length)
        setTiposDocumento(tiposDocData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBusquedaEmpresaChange = (e) => {
    const { name, value } = e.target
    setBusquedaEmpresa((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBuscarEmpresa = async (e) => {
    e.preventDefault()

    // Validar que se hayan ingresado ambos campos
    if (!busquedaEmpresa.tipoDocumento || !busquedaEmpresa.numeroDocumento) {
      setError("Debe seleccionar un tipo de documento e ingresar un número de documento")
      return
    }

    setBuscandoEmpresa(true)
    setError(null)
    setBusquedaEmpresaRealizada(true)
    setSelectedEmpresa(null)
    setFormData((prev) => ({ ...prev, idEmpresa: "" }))

    try {
      const response = await fetch(
        `/api/empresas/disponibles?tipoDocumento=${busquedaEmpresa.tipoDocumento}&numeroDocumento=${busquedaEmpresa.numeroDocumento}`,
      )

      if (!response.ok) {
        throw new Error("Error al buscar empresas")
      }

      const data = await response.json()
      setEmpresasEncontradas(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setBuscandoEmpresa(false)
    }
  }

  const handleSelectEmpresa = (empresa) => {
    setSelectedEmpresa(empresa)
    setFormData((prev) => ({
      ...prev,
      idEmpresa: empresa.idEmpresa.toString(),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar que se haya seleccionado una empresa
    if (!formData.idEmpresa) {
      setError("Debe seleccionar una empresa para el proveedor")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      console.log("Enviando datos:", formData)
      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Error al guardar el proveedor")
      }

      console.log("Proveedor registrado con éxito:", responseData)
      router.push("/proveedores")
    } catch (error) {
      console.error("Error al registrar proveedor:", error)
      setError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Renderizar un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button component={Link} href="/proveedores" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Registrar Nuevo Proveedor
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="div">
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <BusinessIcon sx={{ mr: 1 }} /> Buscar Empresa
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <form onSubmit={handleBuscarEmpresa}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth disabled={loading}>
                        <InputLabel id="tipo-documento-empresa-label">Tipo de Documento</InputLabel>
                        <Select
                          labelId="tipo-documento-empresa-label"
                          id="tipoDocumento"
                          name="tipoDocumento"
                          value={busquedaEmpresa.tipoDocumento}
                          onChange={handleBusquedaEmpresaChange}
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
                    <Grid item xs={12} md={5}>
                      <TextField
                        fullWidth
                        label="Número de Documento"
                        id="numeroDocumento"
                        name="numeroDocumento"
                        value={busquedaEmpresa.numeroDocumento}
                        onChange={handleBusquedaEmpresaChange}
                        required
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
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={buscandoEmpresa}
                        sx={{ height: "56px" }}
                      >
                        {buscandoEmpresa ? <CircularProgress size={24} /> : "Buscar Empresa"}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Paper>

              {/* Resultados de búsqueda de empresas */}
              {busquedaEmpresaRealizada && !buscandoEmpresa && (
                <Box sx={{ mt: 2 }}>
                  {empresasEncontradas.length > 0 ? (
                    <Grid container spacing={2}>
                      {empresasEncontradas.map((empresa) => (
                        <Grid item xs={12} key={empresa.idEmpresa}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: "pointer",
                              border:
                                selectedEmpresa?.idEmpresa === empresa.idEmpresa
                                  ? "2px solid #1976d2"
                                  : "1px solid rgba(0, 0, 0, 0.12)",
                              position: "relative",
                            }}
                            onClick={() => handleSelectEmpresa(empresa)}
                          >
                            {selectedEmpresa?.idEmpresa === empresa.idEmpresa && (
                              <CheckCircleIcon
                                color="primary"
                                sx={{
                                  position: "absolute",
                                  top: 10,
                                  right: 10,
                                  backgroundColor: "white",
                                  borderRadius: "50%",
                                }}
                              />
                            )}
                            <CardContent>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {empresa.razonSocial}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {`${empresa.tipoDocumento?.descTipoDocumento || "Doc"}: ${empresa.ruc}`}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2">
                                    <strong>Teléfono:</strong> {empresa.telefono || "No especificado"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Correo:</strong> {empresa.correoEmpresa || "No especificado"}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                  <Typography variant="body2">
                                    <strong>Ciudad:</strong> {empresa.ciudad?.descCiudad || "No especificada"}
                                  </Typography>
                                  <Typography variant="body2">
                                    <strong>Categoría:</strong>{" "}
                                    {empresa.categoriaEmpresa?.descCategoriaEmpresa || "No especificada"}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="info">No se encontraron empresas disponibles con los criterios de búsqueda</Alert>
                  )}
                </Box>
              )}
              {buscandoEmpresa && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 3 }}>
                  <CircularProgress />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <CommentIcon sx={{ mr: 1 }} /> Información del Proveedor
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <form onSubmit={handleSubmit}>
                {selectedEmpresa && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Empresa seleccionada:
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body1" fontWeight="medium">
                            {selectedEmpresa.razonSocial}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {`${selectedEmpresa.tipoDocumento?.descTipoDocumento}: ${selectedEmpresa.ruc}`}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2">
                            <strong>Dirección:</strong> {selectedEmpresa.direccionEmpresa}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2">
                            <strong>Contacto:</strong>{" "}
                            {selectedEmpresa.persona
                              ? `${selectedEmpresa.persona.nombre} ${selectedEmpresa.persona.apellido}`
                              : "No especificado"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Box>
                )}

                {/* Campo de comentarios */}
                <TextField
                  fullWidth
                  label="Comentarios"
                  name="comentario"
                  value={formData.comentario}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  placeholder="Agregar comentarios como condición comercial, datos bancarios, etc."
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CommentIcon />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={submitting || !selectedEmpresa}
                  >
                    {submitting ? (
                      <>
                        <CircularProgress size={24} sx={{ mr: 1, color: "white" }} />
                        Guardando...
                      </>
                    ) : (
                      "Registrar Proveedor"
                    )}
                  </Button>
                </Box>
              </form>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  )
}
