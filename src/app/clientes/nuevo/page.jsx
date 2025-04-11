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
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import PersonIcon from "@mui/icons-material/Person"
import BusinessIcon from "@mui/icons-material/Business"
import Link from "next/link"

export default function NuevoClientePage() {
  const router = useRouter()

  // Estado para controlar el tipo de cliente (persona o empresa)
  const [tipoCliente, setTipoCliente] = useState("persona")

  const [formData, setFormData] = useState({
    idPersona: "",
    idEmpresa: "",
    idSectorCliente: "",
    idCondicionPago: "",
  })

  const [personas, setPersonas] = useState([])
  const [empresas, setEmpresas] = useState([])
  const [sectoresCliente, setSectoresCliente] = useState([])
  const [condicionesPago, setCondicionesPago] = useState([])

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
        const [personasRes, empresasRes, sectoresRes, condicionesRes] = await Promise.all([
          fetch("/api/personas/disponibles"),
          fetch("/api/empresas/disponibles"),
          fetch("/api/sectores-cliente"),
          fetch("/api/condiciones-pago"),
        ])

        if (!personasRes.ok || !empresasRes.ok || !sectoresRes.ok || !condicionesRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [personasData, empresasData, sectoresData, condicionesData] = await Promise.all([
          personasRes.json(),
          empresasRes.json(),
          sectoresRes.json(),
          condicionesRes.json(),
        ])

        console.log("Personas disponibles cargadas:", personasData.length)
        console.log("Empresas disponibles cargadas:", empresasData.length)
        console.log("Sectores cargados:", sectoresData.length)
        console.log("Condiciones cargadas:", condicionesData.length)

        setPersonas(personasData)
        setEmpresas(empresasData)
        setSectoresCliente(sectoresData)
        setCondicionesPago(condicionesData)
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

  const handleEmpresaChange = (event, newValue) => {
    setSelectedEmpresa(newValue)
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        idEmpresa: newValue.idEmpresa.toString(),
        // Si seleccionamos una empresa, también establecemos la persona de contacto como idPersona
        idPersona: newValue.personaContacto ? newValue.personaContacto.toString() : "",
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        idEmpresa: "",
        idPersona: "",
      }))
    }
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

    if (!formData.idCondicionPago) {
      setError("Debe seleccionar una condición de pago para el cliente")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Preparar datos para enviar
      const clienteData = {
        idPersona: formData.idPersona,
        idSectorCliente: formData.idSectorCliente,
        idCondicionPago: formData.idCondicionPago,
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

        <form onSubmit={handleSubmit}>
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
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props
                      return (
                        <li key={option.idPersona} {...otherProps}>
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography variant="body1">{`${option.nombre} ${option.apellido}`}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {`${option.tipoDocumento?.descTipoDocumento || "Doc"}: ${option.nroDocumento} | ${option.correoPersona}`}
                            </Typography>
                          </Box>
                        </li>
                      )
                    }}
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
              </>
            )}

            {tipoCliente === "empresa" && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                    <BusinessIcon sx={{ mr: 1 }} /> Información Empresarial
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>

                <Grid item xs={12}>
                  <Autocomplete
                    id="empresa-select"
                    options={empresas}
                    getOptionLabel={(option) => `${option.razonSocial} - ${option.ruc}`}
                    value={selectedEmpresa}
                    onChange={handleEmpresaChange}
                    isOptionEqualToValue={(option, value) => option.idEmpresa === value.idEmpresa}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Seleccionar Empresa"
                        required
                        error={!formData.idEmpresa && submitting}
                        helperText={!formData.idEmpresa && submitting ? "Debe seleccionar una empresa" : ""}
                      />
                    )}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props
                      return (
                        <li key={option.idEmpresa} {...otherProps}>
                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography variant="body1">{option.razonSocial}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {`RUC: ${option.ruc} | ${option.correoEmpresa}`}
                            </Typography>
                          </Box>
                        </li>
                      )
                    }}
                  />
                </Grid>

                {selectedEmpresa && (
                  <Grid item xs={12} container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="RUC" value={selectedEmpresa.ruc} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Teléfono"
                        value={selectedEmpresa.telefono}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Correo"
                        value={selectedEmpresa.correoEmpresa}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Persona de Contacto"
                        value={
                          selectedEmpresa.persona
                            ? `${selectedEmpresa.persona.nombre} ${selectedEmpresa.persona.apellido}`
                            : "No especificado"
                        }
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                  </Grid>
                )}
              </>
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
