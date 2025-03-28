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
  Autocomplete,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import PersonIcon from "@mui/icons-material/Person"
import BusinessIcon from "@mui/icons-material/Business"
import Link from "next/link"

export default function NuevoClientePage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    idPersona: "",
    idSectorCliente: "",
    idCondicionPago: "",
    idEmpresa: null,
  })

  const [personas, setPersonas] = useState([])
  const [sectoresCliente, setSectoresCliente] = useState([])
  const [condicionesPago, setCondicionesPago] = useState([])
  const [empresas, setEmpresas] = useState([])

  const [selectedPersona, setSelectedPersona] = useState(null)
  const [asociarEmpresa, setAsociarEmpresa] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Cargando datos para nuevo cliente...")
        // Cargar datos relacionados
        const [personasRes, sectoresRes, condicionesRes, empresasRes] = await Promise.all([
          fetch("/api/personas"),
          fetch("/api/sectores-cliente"),
          fetch("/api/condiciones-pago"),
          fetch("/api/empresas"),
        ])

        if (!personasRes.ok || !sectoresRes.ok || !condicionesRes.ok || !empresasRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [personasData, sectoresData, condicionesData, empresasData] = await Promise.all([
          personasRes.json(),
          sectoresRes.json(),
          condicionesRes.json(),
          empresasRes.json(),
        ])

        console.log("Personas cargadas:", personasData.length)
        console.log("Sectores cargados:", sectoresData.length)
        console.log("Condiciones cargadas:", condicionesData.length)
        console.log("Empresas cargadas:", empresasData.length)

        setPersonas(personasData)
        setSectoresCliente(sectoresData)
        setCondicionesPago(condicionesData)
        setEmpresas(empresasData)
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

  const handlePersonaChange = (event, newValue) => {
    setSelectedPersona(newValue)
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        idPersona: newValue.idPersona.toString(),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        idPersona: "",
      }))
    }
  }

  const handleAsociarEmpresaChange = (event) => {
    setAsociarEmpresa(event.target.checked)
    if (!event.target.checked) {
      setFormData((prev) => ({
        ...prev,
        idEmpresa: null,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar que se haya seleccionado una persona
    if (!formData.idPersona) {
      setError("Debe seleccionar una persona para el cliente")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
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

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <PersonIcon sx={{ mr: 1 }} /> Información Personal
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                id="persona-select"
                options={personas}
                getOptionLabel={(option) => `${option.nombre} ${option.apellido} - ${option.nroDocumento}`}
                value={selectedPersona}
                onChange={handlePersonaChange}
                isOptionEqualToValue={(option, value) => option.idPersona === value.idPersona}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Seleccionar Persona"
                    required
                    error={!formData.idPersona && submitting}
                    helperText={!formData.idPersona && submitting ? "Debe seleccionar una persona" : ""}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="body1">{`${option.nombre} ${option.apellido}`}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {`${option.tipoDocumento?.descTipoDocumento || "Doc"}: ${option.nroDocumento} | ${option.correoPersona}`}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            {selectedPersona && (
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Documento"
                    value={`${selectedPersona.tipoDocumento?.descTipoDocumento || "Doc"}: ${selectedPersona.nroDocumento}`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={selectedPersona.nroTelefono}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Correo"
                    value={selectedPersona.correoPersona}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            )}

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                Información del Cliente
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
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
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Condición de Pago</InputLabel>
                <Select
                  name="idCondicionPago"
                  value={formData.idCondicionPago}
                  onChange={handleChange}
                  label="Condición de Pago"
                >
                  {condicionesPago.map((condicion) => (
                    <MenuItem key={condicion.idCondicionPago} value={condicion.idCondicionPago.toString()}>
                      {condicion.descCondicionPago}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h6" sx={{ mb: 0, display: "flex", alignItems: "center", flexGrow: 1 }}>
                  <BusinessIcon sx={{ mr: 1 }} /> Información Empresarial
                </Typography>
                <FormControlLabel
                  control={<Switch checked={asociarEmpresa} onChange={handleAsociarEmpresaChange} color="primary" />}
                  label="Asociar a una empresa"
                />
              </Box>
              <Divider sx={{ mb: 2, mt: 1 }} />
            </Grid>

            {asociarEmpresa && (
              <Grid item xs={12}>
                <FormControl fullWidth required={asociarEmpresa}>
                  <InputLabel>Empresa</InputLabel>
                  <Select
                    name="idEmpresa"
                    value={formData.idEmpresa || ""}
                    onChange={handleChange}
                    label="Empresa"
                    disabled={!asociarEmpresa}
                  >
                    {empresas.map((empresa) => (
                      <MenuItem key={empresa.idEmpresa} value={empresa.idEmpresa.toString()}>
                        {empresa.razonSocial}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Seleccione la empresa a la que pertenece este cliente</FormHelperText>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
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
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

