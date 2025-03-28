"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import {
  Container,
  Typography,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  TextField,
  FormHelperText,
  Divider,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import SaveIcon from "@mui/icons-material/Save"
import BusinessIcon from "@mui/icons-material/Business"
import PaymentIcon from "@mui/icons-material/Payment"
import InfoIcon from "@mui/icons-material/Info"
import Link from "next/link"

export default function EditarProveedorPage({ params }) {
  // Usar React.use para acceder a los parámetros
  const unwrappedParams = use(params)
  const { id } = unwrappedParams
  const router = useRouter()

  const [formData, setFormData] = useState({
    idEmpresa: "",
    idCondicionPago: "",
  })

  const [proveedor, setProveedor] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [condicionesPago, setCondicionesPago] = useState([])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(`Cargando datos para proveedor ID: ${id}...`)
        // Cargar datos relacionados
        const [proveedorRes, empresasRes, condicionesRes] = await Promise.all([
          fetch(`/api/proveedores/${id}`),
          fetch("/api/empresas"),
          fetch("/api/condiciones-pago"),
        ])

        if (!proveedorRes.ok) {
          throw new Error("No se pudo cargar el proveedor")
        }

        if (!empresasRes.ok || !condicionesRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [proveedorData, empresasData, condicionesData] = await Promise.all([
          proveedorRes.json(),
          empresasRes.json(),
          condicionesRes.json(),
        ])

        setProveedor(proveedorData)
        setEmpresas(empresasData)
        setCondicionesPago(condicionesData)

        // Configurar el formulario con los datos del proveedor
        setFormData({
          idEmpresa: proveedorData.idEmpresa.toString(),
          idCondicionPago: proveedorData.idCondicionPago.toString(),
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

    // Validar que se hayan completado todos los campos requeridos
    if (!formData.idEmpresa) {
      setError("Debe seleccionar una empresa para el proveedor")
      return
    }

    if (!formData.idCondicionPago) {
      setError("Debe seleccionar una condición de pago para el proveedor")
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

  // Renderizar un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  // Buscar la empresa seleccionada
  const empresaSeleccionada = empresas.find((e) => e.idEmpresa.toString() === formData.idEmpresa)

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
                  {empresas.map((empresa) => (
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

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                <PaymentIcon sx={{ mr: 1 }} /> Condiciones Comerciales
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }} icon={<InfoIcon />}>
                Las condiciones de pago ya están cargadas en el sistema. Seleccione la condición correspondiente de la
                lista desplegable.
              </Alert>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required error={!formData.idCondicionPago && submitting}>
                <InputLabel>Condición de Pago</InputLabel>
                <Select
                  name="idCondicionPago"
                  value={formData.idCondicionPago}
                  onChange={handleChange}
                  label="Condición de Pago"
                >
                  {condicionesPago.length > 0 ? (
                    condicionesPago.map((condicion) => (
                      <MenuItem key={condicion.idCondicionPago} value={condicion.idCondicionPago.toString()}>
                        {condicion.descCondicionPago}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      <em>Cargando condiciones de pago...</em>
                    </MenuItem>
                  )}
                </Select>
                <FormHelperText>
                  {!formData.idCondicionPago && submitting
                    ? "Debe seleccionar una condición de pago"
                    : "Seleccione la condición de pago acordada con el proveedor"}
                </FormHelperText>
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

