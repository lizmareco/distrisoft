"use client"

import { useState, useEffect } from "react"
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  CircularProgress,
  Alert,
  Container,
  Typography,
  Paper,
  Snackbar,
  AlertTitle,
} from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"

export default function FormularioMateriaPrimaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState({
    nombreMateriaPrima: "",
    descMateriaPrima: "",
    stockActual: "",
    stockMinimo: "",
    idUnidadMedida: "",
    idEstadoMateriaPrima: "",
  })

  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [estadosMateriaPrima, setEstadosMateriaPrima] = useState([])
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loadingData, setLoadingData] = useState(true)
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "error",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true)

        // Cargar unidades de medida
        const unidadesResponse = await fetch("/api/unidadmedida")
        if (!unidadesResponse.ok) {
          showAlert("Error al cargar unidades de medida", "error")
          return
        }
        const unidadesData = await unidadesResponse.json()
        setUnidadesMedida(unidadesData)

        // Cargar estados de materia prima
        const estadosResponse = await fetch("/api/estadomateriaprima")
        if (!estadosResponse.ok) {
          showAlert("Error al cargar estados de materia prima", "error")
          return
        }
        const estadosData = await estadosResponse.json()
        setEstadosMateriaPrima(estadosData)

        // Si hay un ID, cargar los datos de la materia prima
        if (id) {
          const materiaPrimaResponse = await fetch(`/api/materiaprima/${id}`)
          if (!materiaPrimaResponse.ok) {
            showAlert("Error al cargar materia prima", "error")
            return
          }
          const materiaPrima = await materiaPrimaResponse.json()

          setFormData({
            nombreMateriaPrima: materiaPrima.nombreMateriaPrima || "",
            descMateriaPrima: materiaPrima.descMateriaPrima || "",
            stockActual: materiaPrima.stockActual || "",
            stockMinimo: materiaPrima.stockMinimo || "",
            idUnidadMedida: materiaPrima.idUnidadMedida || "",
            idEstadoMateriaPrima: materiaPrima.idEstadoMateriaPrima || "",
          })
        }
      } catch (error) {
        console.error("Error:", error)
        showAlert("Error al cargar datos necesarios para el formulario", "error")
      } finally {
        setLoadingData(false)
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

    // Limpiar error del campo cuando el usuario lo modifica
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    let isValid = true

    // Validar campos requeridos
    if (!formData.nombreMateriaPrima.trim()) {
      errors.nombreMateriaPrima = "El nombre es requerido"
      isValid = false
    }

    if (!formData.descMateriaPrima.trim()) {
      errors.descMateriaPrima = "La descripción es requerida"
      isValid = false
    }

    if (!formData.stockActual) {
      errors.stockActual = "El stock actual es requerido"
      isValid = false
    } else if (isNaN(formData.stockActual) || Number.parseFloat(formData.stockActual) < 0) {
      errors.stockActual = "El stock actual debe ser un número positivo"
      isValid = false
    }

    if (!formData.stockMinimo) {
      errors.stockMinimo = "El stock mínimo es requerido"
      isValid = false
    } else if (isNaN(formData.stockMinimo) || Number.parseFloat(formData.stockMinimo) < 0) {
      errors.stockMinimo = "El stock mínimo debe ser un número positivo"
      isValid = false
    }

    if (!formData.idUnidadMedida) {
      errors.idUnidadMedida = "La unidad de medida es requerida"
      isValid = false
    }

    if (!formData.idEstadoMateriaPrima) {
      errors.idEstadoMateriaPrima = "El estado es requerido"
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const showAlert = (message, severity = "error") => {
    setAlertInfo({
      open: true,
      message,
      severity,
    })
  }

  const handleCloseAlert = () => {
    setAlertInfo((prev) => ({
      ...prev,
      open: false,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validar formulario antes de enviar
    if (!validateForm()) {
      showAlert("Por favor, corrija los errores en el formulario", "error")
      return
    }

    setLoading(true)

    try {
      const url = id ? `/api/materiaprima/${id}` : "/api/materiaprima"
      const method = id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si el error es por nombre duplicado, marcar el campo específico
        if (data.error && data.error.includes("Ya existe")) {
          setFieldErrors((prev) => ({
            ...prev,
            nombreMateriaPrima: data.error,
          }))
          showAlert(data.error, "error")
          setLoading(false)
          return // Importante: detener la ejecución aquí
        } else {
          showAlert(data.error || "Error al guardar la materia prima", "error")
          setLoading(false)
          return // Importante: detener la ejecución aquí
        }
      }

      // Mostrar mensaje de éxito
      showAlert(id ? "Materia prima actualizada correctamente" : "Materia prima creada correctamente", "success")

      // Redirigir después de un breve retraso para que el usuario vea el mensaje
      setTimeout(() => {
        router.push("/materiaprima")
      }, 1500)
    } catch (error) {
      // No lanzar el error, solo mostrarlo en la UI
      console.error("Error de red:", error)
      showAlert("Error de conexión. Por favor, inténtelo de nuevo.", "error")
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3} mt={2}>
        <Button component={Link} href="/materiaprima" startIcon={<ArrowBack />} variant="outlined">
          Volver a Materias Primas
        </Button>
      </Box>

      <Snackbar
        open={alertInfo.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity} variant="filled" sx={{ width: "100%" }}>
          <AlertTitle>{alertInfo.severity === "error" ? "Error" : "Éxito"}</AlertTitle>
          {alertInfo.message}
        </Alert>
      </Snackbar>

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {id ? "Editar Materia Prima" : "Nueva Materia Prima"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nombreMateriaPrima"
                label="Nombre"
                value={formData.nombreMateriaPrima}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.nombreMateriaPrima}
                helperText={fieldErrors.nombreMateriaPrima || "El nombre debe ser único"}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="descMateriaPrima"
                label="Descripción"
                value={formData.descMateriaPrima}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.descMateriaPrima}
                helperText={fieldErrors.descMateriaPrima}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="stockActual"
                label="Stock Actual"
                type="number"
                value={formData.stockActual}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ step: "0.01", min: "0" }}
                error={!!fieldErrors.stockActual}
                helperText={fieldErrors.stockActual}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="stockMinimo"
                label="Stock Mínimo"
                type="number"
                value={formData.stockMinimo}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ step: "0.01", min: "0" }}
                error={!!fieldErrors.stockMinimo}
                helperText={fieldErrors.stockMinimo}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="idUnidadMedida"
                label="Unidad de Medida"
                select
                value={formData.idUnidadMedida}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.idUnidadMedida}
                helperText={fieldErrors.idUnidadMedida}
              >
                {unidadesMedida.map((unidad) => (
                  <MenuItem key={unidad.idUnidadMedida} value={unidad.idUnidadMedida}>
                    {unidad.descUnidadMedida} ({unidad.abreviatura})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="idEstadoMateriaPrima"
                label="Estado"
                select
                value={formData.idEstadoMateriaPrima}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.idEstadoMateriaPrima}
                helperText={fieldErrors.idEstadoMateriaPrima}
              >
                {estadosMateriaPrima.map((estado) => (
                  <MenuItem key={estado.idEstadoMateriaPrima} value={estado.idEstadoMateriaPrima}>
                    {estado.descEstadoMateriaPrima}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button variant="outlined" onClick={() => router.push("/materiaprima")}>
                  Cancelar
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : id ? "Actualizar" : "Guardar"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

