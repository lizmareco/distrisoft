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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import Link from "next/link"

export default function EmpresaFormPage({ params }) {
  // Usar React.use para acceder a los parámetros
  const unwrappedParams = use(params)
  const { id } = unwrappedParams
  const isEditing = id !== "nueva"
  const router = useRouter()

  const [formData, setFormData] = useState({
    razonSocial: "",
    idCategoriaEmpresa: "",
    idTipoDocumento: "",
    ruc: "",
    direccionEmpresa: "",
    idCiudad: "",
    correoEmpresa: "",
    telefono: "",
    personaContacto: "",
  })

  const [errors, setErrors] = useState({
    correoEmpresa: "",
  })

  const [categorias, setCategorias] = useState([])
  const [ciudades, setCiudades] = useState([])
  const [tiposDocumento, setTiposDocumento] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar datos relacionados
        const [categoriasRes, ciudadesRes, tiposDocumentoRes, personasRes] = await Promise.all([
          fetch("/api/categorias-empresa"),
          fetch("/api/ciudades"),
          fetch("/api/tipos-documento"),
          fetch("/api/personas"),
        ])

        const [categoriasData, ciudadesData, tiposDocumentoData, personasData] = await Promise.all([
          categoriasRes.json(),
          ciudadesRes.json(),
          tiposDocumentoRes.json(),
          personasRes.json(),
        ])

        setCategorias(categoriasData)
        setCiudades(ciudadesData)
        setTiposDocumento(tiposDocumentoData)
        setPersonas(personasData)

        // Si estamos editando, cargar datos de la empresa
        if (isEditing && id !== "nueva") {
          const empresaRes = await fetch(`/api/empresas/${id}`)
          if (!empresaRes.ok) {
            throw new Error("No se pudo cargar la empresa")
          }
          const empresaData = await empresaRes.json()

          setFormData({
            razonSocial: empresaData.razonSocial,
            idCategoriaEmpresa: empresaData.idCategoriaEmpresa.toString(),
            idTipoDocumento: empresaData.idTipoDocumento.toString(),
            ruc: empresaData.ruc,
            direccionEmpresa: empresaData.direccionEmpresa,
            idCiudad: empresaData.idCiudad.toString(),
            correoEmpresa: empresaData.correoEmpresa,
            telefono: empresaData.telefono,
            personaContacto: empresaData.personaContacto.toString(),
          })

          // Validar el correo electrónico cargado
          setErrors((prev) => ({
            ...prev,
            correoEmpresa: validateEmail(empresaData.correoEmpresa),
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
    if (name === "correoEmpresa") {
      setErrors((prev) => ({
        ...prev,
        correoEmpresa: validateEmail(value),
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar correo electrónico antes de enviar
    const emailError = validateEmail(formData.correoEmpresa)
    if (emailError) {
      setErrors((prev) => ({
        ...prev,
        correoEmpresa: emailError,
      }))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const url = isEditing ? `/api/empresas/${id}` : "/api/empresas"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar la empresa")
      }

      router.push("/empresas")
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
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
          <Button component={Link} href="/empresas" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            {isEditing ? "Editar Empresa" : "Nueva Empresa"}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Razón Social"
                name="razonSocial"
                value={formData.razonSocial}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría de Empresa</InputLabel>
                <Select
                  name="idCategoriaEmpresa"
                  value={formData.idCategoriaEmpresa}
                  onChange={handleChange}
                  label="Categoría de Empresa"
                >
                  {categorias.map((categoria) => (
                    <MenuItem key={categoria.idCategoriaEmpresa} value={categoria.idCategoriaEmpresa.toString()}>
                      {categoria.descCategoriaEmpresa}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              <TextField fullWidth label="RUC" name="ruc" value={formData.ruc} onChange={handleChange} required />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccionEmpresa"
                value={formData.direccionEmpresa}
                onChange={handleChange}
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

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="correoEmpresa"
                type="email"
                value={formData.correoEmpresa}
                onChange={handleChange}
                required
                error={!!errors.correoEmpresa}
                helperText={errors.correoEmpresa}
                onBlur={() => {
                  setErrors((prev) => ({
                    ...prev,
                    correoEmpresa: validateEmail(formData.correoEmpresa),
                  }))
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Persona de Contacto</InputLabel>
                <Select
                  name="personaContacto"
                  value={formData.personaContacto}
                  onChange={handleChange}
                  label="Persona de Contacto"
                >
                  {personas.map((persona) => (
                    <MenuItem key={persona.idPersona} value={persona.idPersona.toString()}>
                      {`${persona.nombre} ${persona.apellido}`}
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
                  disabled={submitting || !!errors.correoEmpresa}
                >
                  {submitting ? "Guardando..." : "Guardar"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

