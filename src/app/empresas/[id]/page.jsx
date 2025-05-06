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

export default function EditarEmpresaPage({ params }) {
  // Usar React.use para acceder a los parámetros de ruta
  const { id } = use(params)
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
    contacto: "", // Nuevo campo contacto como texto
  })

  const [tiposDocumento, setTiposDocumento] = useState([])
  const [categoriasEmpresa, setCategoriasEmpresa] = useState([])
  const [ciudades, setCiudades] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // Cargar datos relacionados y la empresa a editar
        const [tiposDocRes, categoriasRes, ciudadesRes, empresaRes] = await Promise.all([
          fetch("/api/tipos-documento"),
          fetch("/api/categorias-empresa"),
          fetch("/api/ciudades"),
          fetch(`/api/empresas/${id}`),
        ])

        if (!tiposDocRes.ok || !categoriasRes.ok || !ciudadesRes.ok || !empresaRes.ok) {
          throw new Error("Error al cargar datos")
        }

        const [tiposDocData, categoriasData, ciudadesData, empresaData] = await Promise.all([
          tiposDocRes.json(),
          categoriasRes.json(),
          ciudadesRes.json(),
          empresaRes.json(),
        ])

        setTiposDocumento(tiposDocData)
        setCategoriasEmpresa(categoriasData)
        setCiudades(ciudadesData)

        // Configurar el formulario con los datos de la empresa
        setFormData({
          razonSocial: empresaData.razonSocial || "",
          idCategoriaEmpresa: empresaData.idCategoriaEmpresa?.toString() || "",
          idTipoDocumento: empresaData.idTipoDocumento?.toString() || "",
          ruc: empresaData.ruc || "",
          direccionEmpresa: empresaData.direccionEmpresa || "",
          idCiudad: empresaData.idCiudad?.toString() || "",
          correoEmpresa: empresaData.correoEmpresa || "",
          telefono: empresaData.telefono || "",
          contacto: empresaData.contacto || "", // Usar el nuevo campo contacto
        })
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar campos requeridos
    if (!formData.razonSocial || !formData.idCategoriaEmpresa || !formData.idTipoDocumento || !formData.ruc) {
      setError("Por favor complete todos los campos requeridos")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/empresas/${id}`, {
        method: "PUT",
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
          setError(responseData.error || "Error al actualizar la empresa")
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
            Editar Empresa
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
                  {submitting ? <CircularProgress size={24} /> : "Guardar Cambios"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}
