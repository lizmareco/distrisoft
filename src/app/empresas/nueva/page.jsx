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
  InputAdornment,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import BusinessIcon from "@mui/icons-material/Business"
import ContactsIcon from "@mui/icons-material/Contacts"
import EmailIcon from "@mui/icons-material/Email"
import PhoneIcon from "@mui/icons-material/Phone"
import LocationOnIcon from "@mui/icons-material/LocationOn"
import Link from "next/link"

export default function NuevaEmpresaPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    razonSocial: "",
    idCategoriaEmpresa: "",
    ruc: "",
    direccionEmpresa: "",
    idCiudad: "",
    correoEmpresa: "",
    telefono: "",
    contacto: "",
  })

  const [tipoDocumentoRUC, setTipoDocumentoRUC] = useState(null)
  const [categoriasEmpresa, setCategoriasEmpresa] = useState([])
  const [ciudades, setCiudades] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Cargar datos relacionados
        const [tiposDocRes, categoriasRes, ciudadesRes] = await Promise.all([
          fetch("/api/tipos-documento"),
          fetch("/api/categorias-empresa"),
          fetch("/api/ciudades"),
        ])

        if (!tiposDocRes.ok || !categoriasRes.ok || !ciudadesRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [tiposDocData, categoriasData, ciudadesData] = await Promise.all([
          tiposDocRes.json(),
          categoriasRes.json(),
          ciudadesRes.json(),
        ])

        // Buscar el tipo de documento "RUC"
        const tipoRUC = tiposDocData.find(
          (tipo) =>
            tipo.descTipoDocumento.toUpperCase() === "RUC" || tipo.descTipoDocumento.toUpperCase().includes("RUC"),
        )

        if (!tipoRUC) {
          console.warn("No se encontró el tipo de documento RUC. Se usará el primer tipo disponible.")
          setTipoDocumentoRUC(tiposDocData[0]?.idTipoDocumento)
        } else {
          setTipoDocumentoRUC(tipoRUC.idTipoDocumento)
        }

        setCategoriasEmpresa(categoriasData)
        setCiudades(ciudadesData)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar campos requeridos
    if (!formData.razonSocial || !formData.idCategoriaEmpresa || !formData.ruc) {
      setError("Por favor complete todos los campos requeridos")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/empresas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Verificar si es un error de RUC duplicado
        if (response.status === 409) {
          setError(
            `Ya existe una empresa registrada con el RUC ${formData.ruc}. La empresa "${responseData.empresaExistente?.razonSocial}" ya utiliza este RUC.`,
          )
        } else {
          setError(responseData.error || "Error al guardar la empresa")
        }

        // Desplazar la página hacia arriba para que el usuario vea el mensaje de error
        window.scrollTo({ top: 0, behavior: "smooth" })
        return // Importante: detener la ejecución aquí para evitar que se propague el error
      }

      // Redirigir a la lista de empresas
      router.push("/empresas")
    } catch (error) {
      console.error("Error:", error)
      // Mostrar el error en la interfaz de usuario
      setError("Error de conexión. Por favor, inténtelo de nuevo más tarde.")

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
          <Button component={Link} href="/empresas" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Registrar Nueva Empresa
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
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <BusinessIcon sx={{ mr: 1 }} /> Información General
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Razón Social"
                name="razonSocial"
                value={formData.razonSocial}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría</InputLabel>
                <Select
                  name="idCategoriaEmpresa"
                  value={formData.idCategoriaEmpresa}
                  onChange={handleChange}
                  label="Categoría"
                >
                  {categoriasEmpresa.map((categoria) => (
                    <MenuItem key={categoria.idCategoriaEmpresa} value={categoria.idCategoriaEmpresa.toString()}>
                      {categoria.descCategoriaEmpresa}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="RUC"
                name="ruc"
                value={formData.ruc}
                onChange={handleChange}
                required
                helperText="Número de RUC de la empresa"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, display: "flex", alignItems: "center" }}>
                <ContactsIcon sx={{ mr: 1 }} /> Contacto
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contacto"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                placeholder="Nombre y cargo de la persona de contacto"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ContactsIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Correo Electrónico"
                name="correoEmpresa"
                value={formData.correoEmpresa}
                onChange={handleChange}
                type="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon />
                    </InputAdornment>
                  ),
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, display: "flex", alignItems: "center" }}>
                <LocationOnIcon sx={{ mr: 1 }} /> Ubicación
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
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
                label="Dirección"
                name="direccionEmpresa"
                value={formData.direccionEmpresa}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon />
                    </InputAdornment>
                  ),
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
                  disabled={submitting}
                >
                  {submitting ? <CircularProgress size={24} /> : "Guardar Empresa"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}
