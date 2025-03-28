"use client"

import { useState, useEffect } from "react"
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
  Autocomplete,
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

export default function NuevoProveedorPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    idEmpresa: "",
    idCondicionPago: "",
  })

  const [empresas, setEmpresas] = useState([])
  const [condicionesPago, setCondicionesPago] = useState([])

  const [selectedEmpresa, setSelectedEmpresa] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Cargando datos para nuevo proveedor...")
        // Cargar datos relacionados
        const [empresasRes, condicionesRes] = await Promise.all([
          fetch("/api/empresas"),
          fetch("/api/condiciones-pago"),
        ])

        if (!empresasRes.ok || !condicionesRes.ok) {
          throw new Error("Error al cargar datos de referencia")
        }

        const [empresasData, condicionesData] = await Promise.all([empresasRes.json(), condicionesRes.json()])

        console.log("Empresas cargadas:", empresasData.length)
        console.log("Condiciones cargadas:", condicionesData.length)

        setEmpresas(empresasData)
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

  const handleEmpresaChange = (event, newValue) => {
    setSelectedEmpresa(newValue)
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        idEmpresa: newValue.idEmpresa.toString(),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        idEmpresa: "",
      }))
    }
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
      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Error al guardar el proveedor")
      }

      console.log("Proveedor registrado con éxito:", responseData)
      router.push("/proveedores")
    } catch (error) {
      console.error("Error al registrar proveedor:", error)
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Button component={Link} href="/proveedores" startIcon={<ArrowBackIcon />} sx={{ mr: 2 }}>
            Volver
          </Button>
          <Typography variant="h5" component="h1">
            Registrar Nuevo Proveedor
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
                  // Extraer la key del objeto props y el resto de propiedades
                  const { key, ...otherProps } = props

                  return (
                    <li key={option.idEmpresa} {...otherProps}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body1">{option.razonSocial}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {`RUC: ${option.ruc} | ${option.ciudad?.descCiudad || "Ciudad no especificada"}`}
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
                    label="Dirección"
                    value={selectedEmpresa.direccionEmpresa}
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
                    "Registrar Proveedor"
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

