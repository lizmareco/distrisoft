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
import CommentIcon from "@mui/icons-material/Comment"
import Link from "next/link"
import { use } from "react"

export default function EditarProveedorPage({ params }) {
  const { id } = use(params)
  const router = useRouter()

  const [formData, setFormData] = useState({
    idEmpresa: "",
    comentario: "",
  })

  const [proveedor, setProveedor] = useState(null)
  const [empresas, setEmpresas] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Cargando datos para proveedor ID: ${id}...`)

        // Cargar datos relacionados - usar el endpoint que funciona
        const [proveedorRes, empresasRes] = await Promise.all([
          fetch(`/api/proveedores/${id}`),
          fetch("/api/proveedores/all"), // ✅ Usar endpoint de proveedores que sabemos que funciona
        ])

        if (!proveedorRes.ok) {
          throw new Error("No se pudo cargar el proveedor")
        }

        if (!empresasRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [proveedorData, proveedoresData] = await Promise.all([proveedorRes.json(), empresasRes.json()])

        console.log("Datos del proveedor:", proveedorData)
        console.log("Datos de proveedores:", proveedoresData)

        // Extraer las empresas de los proveedores existentes
        const empresasDisponibles = proveedoresData.map((p) => p.empresa).filter(Boolean)

        // Agregar la empresa actual del proveedor si no está en la lista
        if (
          proveedorData.empresa &&
          !empresasDisponibles.find((e) => e.idEmpresa === proveedorData.empresa.idEmpresa)
        ) {
          empresasDisponibles.push(proveedorData.empresa)
        }

        setProveedor(proveedorData)
        setEmpresas(empresasDisponibles)

        // Configurar el formulario con los datos del proveedor
        setFormData({
          idEmpresa: proveedorData.idEmpresa.toString(),
          comentario: proveedorData.comentario || "",
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

    if (!formData.idEmpresa) {
      setError("Debe seleccionar una empresa para el proveedor")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      console.log("Enviando datos:", formData)
      const response = await fetch(`/api/proveedores/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Error al actualizar el proveedor")
      }

      console.log("Proveedor actualizado con éxito:", responseData)
      router.push("/proveedores")
    } catch (error) {
      console.error("Error al actualizar proveedor:", error)
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

  // Asegurar que empresas sea un array antes de usar find
  const empresaSeleccionada = Array.isArray(empresas)
    ? empresas.find((e) => e.idEmpresa.toString() === formData.idEmpresa)
    : null

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button component={Link} href="/proveedores" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Editar Proveedor
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
                <BusinessIcon sx={{ mr: 1 }} /> Información de la Empresa
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Empresa</InputLabel>
                <Select name="idEmpresa" value={formData.idEmpresa} onChange={handleChange} label="Empresa">
                  {Array.isArray(empresas) &&
                    empresas.map((empresa) => (
                      <MenuItem key={empresa.idEmpresa} value={empresa.idEmpresa.toString()}>
                        {`${empresa.razonSocial} - ${empresa.ruc}`}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {empresaSeleccionada && (
              <Grid item xs={12} container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="RUC" value={empresaSeleccionada.ruc} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={empresaSeleccionada.direccionEmpresa}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Correo"
                    value={empresaSeleccionada.correoEmpresa}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, display: "flex", alignItems: "center" }}>
                <CommentIcon sx={{ mr: 1 }} /> Información del Proveedor
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Comentarios"
                name="comentario"
                value={formData.comentario}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Agregar comentarios como condición comercial, datos bancarios, etc."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CommentIcon />
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
                  {submitting ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1, color: "white" }} />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
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
