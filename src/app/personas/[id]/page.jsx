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
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import Link from "next/link"

export default function PersonaFormPage({ params }) {
  // Usar React.use para acceder a los parámetros
  const unwrappedParams = use(params)
  const { id } = unwrappedParams
  const isEditing = id !== "nueva"
  const router = useRouter()

  const [formData, setFormData] = useState({
    nroDocumento: "",
    nombre: "",
    apellido: "",
    fechaNacimiento: "",
    direccion: "",
    nroTelefono: "",
    correoPersona: "",
    idCiudad: "",
    idTipoDocumento: "",
  })

  const [errors, setErrors] = useState({
    correoPersona: "",
  })

  const [ciudades, setCiudades] = useState([])
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar datos relacionados
        const [ciudadesRes, tiposDocumentoRes] = await Promise.all([
          fetch("/api/ciudades"),
          fetch("/api/tipos-documento"),
        ])

        const [ciudadesData, tiposDocumentoData] = await Promise.all([ciudadesRes.json(), tiposDocumentoRes.json()])

        setCiudades(ciudadesData)
        setTiposDocumento(tiposDocumentoData)

        // Si estamos editando, cargar datos de la persona
        if (isEditing && id !== "nueva") {
          const personaRes = await fetch(`/api/personas/${id}`)
          if (!personaRes.ok) {
            throw new Error("No se pudo cargar la persona")
          }
          const personaData = await personaRes.json()

          setFormData({
            nroDocumento: personaData.nroDocumento,
            nombre: personaData.nombre,
            apellido: personaData.apellido,
            fechaNacimiento: personaData.fechaNacimiento
              ? new Date(personaData.fechaNacimiento).toISOString().substring(0, 10)
              : "",
            direccion: personaData.direccion,
            nroTelefono: personaData.nroTelefono,
            correoPersona: personaData.correoPersona,
            idCiudad: personaData.idCiudad.toString(),
            idTipoDocumento: personaData.idTipoDocumento.toString(),
          })

          // Validar el correo electrónico cargado
          setErrors((prev) => ({
            ...prev,
            correoPersona: validateEmail(personaData.correoPersona),
          }))
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, isEditing])

  const validateEmail = (email) => {
    if (!email) return "El correo electrónico es requerido"
    if (!email.includes("@")) return "El correo electrónico debe contener @"
    return ""
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Validar correo electrónico
    if (name === "correoPersona") {
      setErrors((prev) => ({
        ...prev,
        correoPersona: validateEmail(value),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar correo electrónico antes de enviar
    const emailError = validateEmail(formData.correoPersona)
    if (emailError) {
      setErrors((prev) => ({
        ...prev,
        correoPersona: emailError,
      }))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const url = isEditing ? `/api/personas/${id}` : "/api/personas"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Verificar si es un error de documento duplicado
        if (response.status === 409) {
          const tipoDoc =
            tiposDocumento.find((t) => t.idTipoDocumento.toString() === formData.idTipoDocumento)?.descTipoDocumento ||
            "Documento"

          setError(`Ya existe otra persona registrada con el ${tipoDoc} ${formData.nroDocumento}. 
                   Persona: ${responseData.personaExistente?.nombre || "No disponible"}`)

          // Desplazar la página hacia arriba para que el usuario vea el mensaje de error
          window.scrollTo({ top: 0, behavior: "smooth" })
          return
        }

        setError(responseData.error || `Error al ${isEditing ? "actualizar" : "crear"} la persona`)
        // Desplazar la página hacia arriba para que el usuario vea el mensaje de error
        window.scrollTo({ top: 0, behavior: "smooth" })
        return
      }

      router.push("/personas")
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      // Desplazar la página hacia arriba para que el usuario vea el mensaje de error
      window.scrollTo({ top: 0, behavior: "smooth" })
    } finally {
      setSubmitting(false)
    }
  }

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
          <Button component={Link} href="/personas" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            {isEditing ? "Editar Persona" : "Nueva Persona"}
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              fontWeight: "medium",
              "& .MuiAlert-message": {
                fontWeight: 500,
              },
              border: "1px solid",
              borderColor: "error.main",
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  name="idTipoDocumento"
                  value={formData.idTipoDocumento}
                  onChange={handleChange}
                  label="Tipo de Documento"
                >
                  {tiposDocumento.map((tipo) => (
                    <MenuItem key={tipo.idTipoDocumento} value={tipo.idTipoDocumento.toString()}>
                      {tipo.descTipoDocumento}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="nroDocumento"
                value={formData.nroDocumento}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Nacimiento"
                name="fechaNacimiento"
                type="date"
                value={
                  formData.fechaNacimiento
                    ? typeof formData.fechaNacimiento === "string"
                      ? formData.fechaNacimiento.substring(0, 10)
                      : new Date(formData.fechaNacimiento).toISOString().substring(0, 10)
                    : ""
                }
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    fechaNacimiento: e.target.value,
                  }))
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Ciudad</InputLabel>
                <Select name="idCiudad" value={formData.idCiudad} onChange={handleChange} label="Ciudad">
                  {ciudades.map((ciudad) => (
                    <MenuItem key={ciudad.idCiudad} value={ciudad.idCiudad.toString()}>
                      {ciudad.descCiudad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="nroTelefono"
                value={formData.nroTelefono}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="correoPersona"
                type="email"
                value={formData.correoPersona}
                onChange={handleChange}
                required
                error={!!errors.correoPersona}
                helperText={errors.correoPersona}
                onBlur={() => {
                  setErrors((prev) => ({
                    ...prev,
                    correoPersona: validateEmail(formData.correoPersona),
                  }))
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={submitting || !!errors.correoPersona}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1, color: "white" }} />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}
