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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import PersonIcon from "@mui/icons-material/Person"
import BusinessIcon from "@mui/icons-material/Business"
import SearchIcon from "@mui/icons-material/Search"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import Link from "next/link"

export default function NuevoClientePage() {
  const router = useRouter()

  // Estado para controlar el tipo de cliente (persona o empresa)
  const [tipoCliente, setTipoCliente] = useState("persona")

  const [formData, setFormData] = useState({
    idPersona: "",
    idEmpresa: "",
    idSectorCliente: "",
  })

  // Estado para los datos de búsqueda
  const [busquedaPersona, setBusquedaPersona] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
  })

  const [busquedaEmpresa, setBusquedaEmpresa] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
  })

  // Estado para los resultados de búsqueda
  const [personasEncontradas, setPersonasEncontradas] = useState([])
  const [empresasEncontradas, setEmpresasEncontradas] = useState([])

  // Estado para indicar si se está buscando
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false)

  // Estado para indicar si ya se realizó una búsqueda
  const [busquedaPersonaRealizada, setBusquedaPersonaRealizada] = useState(false)
  const [busquedaEmpresaRealizada, setBusquedaEmpresaRealizada] = useState(false)

  const [tiposDocumento, setTiposDocumento] = useState([])
  const [sectoresCliente, setSectoresCliente] = useState([])

  const [selectedPersona, setSelectedPersona] = useState(null)
  const [selectedEmpresa, setSelectedEmpresa] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Cargando datos para nuevo cliente...")
        // Cargar datos relacionados
        const [tiposDocRes, sectoresRes] = await Promise.all([
          fetch("/api/tipos-documento"),
          fetch("/api/sectores-cliente"),
        ])

        if (!tiposDocRes.ok || !sectoresRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [tiposDocData, sectoresData] = await Promise.all([tiposDocRes.json(), sectoresRes.json()])

        console.log("Tipos de documento cargados:", tiposDocData.length)
        console.log("Sectores cargados:", sectoresData.length)

        setTiposDocumento(tiposDocData)
        setSectoresCliente(sectoresData)
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

  const handleTipoClienteChange = (event) => {
    const newTipoCliente = event.target.value
    setTipoCliente(newTipoCliente)

    // Resetear los valores relacionados con el tipo de cliente anterior
    setFormData((prev) => ({
      ...prev,
      idPersona: "",
      idEmpresa: "",
    }))

    setSelectedPersona(null)
    setSelectedEmpresa(null)
    setPersonasEncontradas([])
    setEmpresasEncontradas([])
    setBusquedaPersonaRealizada(false)
    setBusquedaEmpresaRealizada(false)
  }

  const handleBusquedaPersonaChange = (e) => {
    const { name, value } = e.target
    setBusquedaPersona((prev) => ({
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

  const handleBuscarPersona = async (e) => {
    e.preventDefault()

    // Validar que se hayan ingresado ambos campos
    if (!busquedaPersona.tipoDocumento || !busquedaPersona.numeroDocumento) {
      setError("Debe seleccionar un tipo de documento e ingresar un número de documento")
      return
    }

    setBuscandoPersona(true)
    setError(null)
    setBusquedaPersonaRealizada(true)
    setSelectedPersona(null)
    setFormData((prev) => ({ ...prev, idPersona: "" }))

    try {
      const response = await fetch(
        `/api/personas/disponibles?tipoDocumento=${busquedaPersona.tipoDocumento}&numeroDocumento=${busquedaPersona.numeroDocumento}`,
      )

      if (!response.ok) {
        throw new Error("Error al buscar personas")
      }

      const data = await response.json()
      setPersonasEncontradas(data)
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
    } finally {
      setBuscandoPersona(false)
    }
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

  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona)
    setFormData((prev) => ({
      ...prev,
      idPersona: persona.idPersona.toString(),
    }))
  }

  const handleSelectEmpresa = (empresa) => {
    setSelectedEmpresa(empresa)
    setFormData((prev) => ({
      ...prev,
      idEmpresa: empresa.idEmpresa.toString(),
      // Si seleccionamos una empresa, también establecemos la persona de contacto como idPersona
      idPersona: empresa.personaContacto ? empresa.personaContacto.toString() : "",
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar según el tipo de cliente
    if (tipoCliente === "persona" && !formData.idPersona) {
      setError("Debe seleccionar una persona para el cliente")
      return
    }

    if (tipoCliente === "empresa" && !formData.idEmpresa) {
      setError("Debe seleccionar una empresa para el cliente")
      return
    }

    if (!formData.idSectorCliente) {
      setError("Debe seleccionar un sector para el cliente")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Preparar datos para enviar
      const clienteData = {
        idPersona: formData.idPersona,
        idSectorCliente: formData.idSectorCliente,
      }

      // Si es una empresa, añadir el idEmpresa
      if (tipoCliente === "empresa" && formData.idEmpresa) {
        clienteData.idEmpresa = formData.idEmpresa
      }

      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar el cliente")
      }

      router.push("/clientes")
    } catch (error) {
      console.error("Error:", error)
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

  // Renderizar un mensaje de error si hay un problema
  if (error && !submitting) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Error al cargar la página: {error}
        </Alert>
        <Button component={Link} href="/clientes" startIcon={<ArrowBackIcon />}>
          Volver al listado
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button component={Link} href="/clientes" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Registrar Nuevo Cliente
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
              <FormControl component="fieldset">
                <FormLabel component="legend">Tipo de Cliente</FormLabel>
                <RadioGroup row name="tipoCliente" value={tipoCliente} onChange={handleTipoClienteChange}>
                  <FormControlLabel value="persona" control={<Radio />} label="Persona" />
                  <FormControlLabel value="empresa" control={<Radio />} label="Empresa" />
                </RadioGroup>
              </FormControl>
            </Grid>

            {tipoCliente === "persona" && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                    <PersonIcon sx={{ mr: 1 }} /> Buscar Persona
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                    <form onSubmit={handleBuscarPersona}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <FormControl fullWidth disabled={loading}>
                            <InputLabel id="tipo-documento-persona-label">Tipo de Documento</InputLabel>
                            <Select
                              labelId="tipo-documento-persona-label"
                              id="tipoDocumento"
                              name="tipoDocumento"
                              value={busquedaPersona.tipoDocumento}
                              onChange={handleBusquedaPersonaChange}
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
                            value={busquedaPersona.numeroDocumento}
                            onChange={handleBusquedaPersonaChange}
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
                            disabled={buscandoPersona}
                            sx={{ height: "56px" }}
                          >
                            {buscandoPersona ? <CircularProgress size={24} /> : "Buscar Persona"}
                          </Button>
                        </Grid>
                      </Grid>
                    </form>
                  </Paper>

                  {/* Resultados de búsqueda de personas */}
                  {busquedaPersonaRealizada && !buscandoPersona && (
                    <Box sx={{ mt: 2 }}>
                      {personasEncontradas.length > 0 ? (
                        <Grid container spacing={2}>
                          {personasEncontradas.map((persona) => (
                            <Grid item xs={12} key={persona.idPersona}>
                              <Card
                                variant="outlined"
                                sx={{
                                  cursor: "pointer",
                                  border:
                                    selectedPersona?.idPersona === persona.idPersona
                                      ? "2px solid #1976d2"
                                      : "1px solid rgba(0, 0, 0, 0.12)",
                                  position: "relative",
                                }}
                                onClick={() => handleSelectPersona(persona)}
                              >
                                {selectedPersona?.idPersona === persona.idPersona && (
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
                                        {`${persona.nombre} ${persona.apellido}`}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {`${persona.tipoDocumento?.descTipoDocumento || "Doc"}: ${persona.nroDocumento}`}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="body2">
                                        <strong>Teléfono:</strong> {persona.nroTelefono || "No especificado"}
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Correo:</strong> {persona.correoPersona || "No especificado"}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                      <Typography variant="body2">
                                        <strong>Ciudad:</strong> {persona.ciudad?.descCiudad || "No especificada"}
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Dirección:</strong> {persona.direccionPersona || "No especificada"}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Alert severity="info">
                          No se encontraron personas disponibles con los criterios de búsqueda
                        </Alert>
                      )}
                    </Box>
                  )}
                  {buscandoPersona && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 3 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Grid>
              </>
            )}

            {tipoCliente === "empresa" && (
              <>
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
                                    {empresa.persona && (
                                      <Grid item xs={12}>
                                        <Typography variant="body2">
                                          <strong>Persona de Contacto:</strong>{" "}
                                          {`${empresa.persona.nombre} ${empresa.persona.apellido}`}
                                        </Typography>
                                      </Grid>
                                    )}
                                  </Grid>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Alert severity="info">
                          No se encontraron empresas disponibles con los criterios de búsqueda
                        </Alert>
                      )}
                    </Box>
                  )}
                  {buscandoEmpresa && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 3 }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                Información del Cliente
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <form onSubmit={handleSubmit}>
                <FormControl fullWidth required>
                  <InputLabel>Sector del Cliente</InputLabel>
                  <Select
                    name="idSectorCliente"
                    value={formData.idSectorCliente}
                    onChange={handleChange}
                    label="Sector del Cliente"
                  >
                    {sectoresCliente.map((sector) => (
                      <MenuItem key={sector.idSectorCliente} value={sector.idSectorCliente.toString()}>
                        {sector.descSectorCliente}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    disabled={submitting}
                  >
                    {submitting ? "Guardando..." : "Registrar Cliente"}
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
