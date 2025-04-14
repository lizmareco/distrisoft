"use client"

import { useState, useEffect, use } from "react"
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
  Switch,
  FormControlLabel,
  FormHelperText,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import PersonIcon from "@mui/icons-material/Person"
import BusinessIcon from "@mui/icons-material/Business"
import InfoIcon from "@mui/icons-material/Info"
import Link from "next/link"

export default function ClienteFormPage({ params }) {
  // Usar React.use para acceder a los parámetros
  const unwrappedParams = use(params)
  const { id } = unwrappedParams
  const router = useRouter()

  const [formData, setFormData] = useState({
    idPersona: "",
    idSectorCliente: "",
    idEmpresa: null,
  })

  const [cliente, setCliente] = useState(null)
  const [personas, setPersonas] = useState([])
  const [sectoresCliente, setSectoresCliente] = useState([])
  const [empresas, setEmpresas] = useState([])

  const [asociarEmpresa, setAsociarEmpresa] = useState(false)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Cargando datos para cliente ID: ${id}...`)
        // Cargar datos relacionados
        const [clienteRes, personasRes, sectoresRes, empresasRes] = await Promise.all([
          fetch(`/api/clientes/${id}`),
          fetch("/api/personas"),
          fetch("/api/sectores-cliente"),
          fetch("/api/empresas"),
        ])

        if (!clienteRes.ok) {
          throw new Error("No se pudo cargar el cliente")
        }

        if (!personasRes.ok || !sectoresRes.ok || !empresasRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [clienteData, personasData, sectoresData, empresasData] = await Promise.all([
          clienteRes.json(),
          personasRes.json(),
          sectoresRes.json(),
          empresasRes.json(),
        ])

        setCliente(clienteData)
        setPersonas(personasData)
        setSectoresCliente(sectoresData)
        setEmpresas(empresasData)

        // Configurar el formulario con los datos del cliente
        setFormData({
          idPersona: clienteData.idPersona.toString(),
          idSectorCliente: clienteData.idSectorCliente.toString(),
          idEmpresa: clienteData.idEmpresa ? clienteData.idEmpresa.toString() : null,
        })

        // Configurar el estado de asociación de empresa
        setAsociarEmpresa(!!clienteData.idEmpresa)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al actualizar el cliente")
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

  // Buscar la persona seleccionada
  const personaSeleccionada = personas.find((p) => p.idPersona.toString() === formData.idPersona)

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button component={Link} href="/clientes" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Editar Cliente
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
              <FormControl fullWidth required>
                <InputLabel>Persona</InputLabel>
                <Select name="idPersona" value={formData.idPersona} onChange={handleChange} label="Persona">
                  {personas.map((persona) => (
                    <MenuItem key={persona.idPersona} value={persona.idPersona.toString()}>
                      {`${persona.nombre} ${persona.apellido} - ${persona.nroDocumento}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {personaSeleccionada && (
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Documento"
                    value={`${personaSeleccionada.tipoDocumento?.descTipoDocumento || "Doc"}: ${personaSeleccionada.nroDocumento}`}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={personaSeleccionada.nroTelefono}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Correo"
                    value={personaSeleccionada.correoPersona}
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
                  {sectoresCliente.length > 0 ? (
                    sectoresCliente.map((sector) => (
                      <MenuItem key={sector.idSectorCliente} value={sector.idSectorCliente.toString()}>
                        {sector.descSectorCliente}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      <em>Cargando sectores...</em>
                    </MenuItem>
                  )}
                </Select>
                <FormHelperText>Seleccione de la lista de sectores disponibles</FormHelperText>
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
                  {submitting ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

