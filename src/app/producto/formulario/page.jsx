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

// Añadir estas importaciones al inicio del archivo
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"

export default function FormularioProductoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [formData, setFormData] = useState({
    nombreProducto: "",
    descripcion: "",
    idTipoProducto: "",
    pesoUnidad: "",
    precioUnitario: "",
    idEstadoProducto: "",
    idUnidadMedida: "",
  })

  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [estadosProducto, setEstadosProducto] = useState([])
  const [tiposProducto, setTiposProducto] = useState([])
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
          setLoadingData(false)
          return
        }
        const unidadesData = await unidadesResponse.json()
        setUnidadesMedida(unidadesData)

        // Cargar estados de producto
        const estadosResponse = await fetch("/api/estadoproducto")
        if (!estadosResponse.ok) {
          showAlert("Error al cargar estados de producto", "error")
          setLoadingData(false)
          return
        }
        const estadosData = await estadosResponse.json()
        setEstadosProducto(estadosData)

        // Cargar tipos de producto
        const tiposResponse = await fetch("/api/tipoproducto")
        if (!tiposResponse.ok) {
          showAlert("Error al cargar tipos de producto", "error")
          setLoadingData(false)
          return
        }
        const tiposData = await tiposResponse.json()
        setTiposProducto(tiposData)

        // Si hay un ID, cargar los datos del producto
        if (id) {
          const productoResponse = await fetch(`/api/productos/${id}`)
          if (!productoResponse.ok) {
            showAlert("Error al cargar producto", "error")
            setLoadingData(false)
            return
          }
          const producto = await productoResponse.json()

          setFormData({
            nombreProducto: producto.nombreProducto || "",
            descripcion: producto.descripcion || "",
            idTipoProducto: producto.idTipoProducto || "",
            pesoUnidad: producto.pesoUnidad || "",
            precioUnitario: producto.precioUnitario || "",
            idEstadoProducto: producto.idEstadoProducto || "",
            idUnidadMedida: producto.idUnidadMedida || "",
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
    if (!formData.nombreProducto.trim()) {
      errors.nombreProducto = "El nombre es requerido"
      isValid = false
    }

    if (!formData.descripcion.trim()) {
      errors.descripcion = "La descripción es requerida"
      isValid = false
    }

    if (!formData.idTipoProducto) {
      errors.idTipoProducto = "El tipo de producto es requerido"
      isValid = false
    }

    if (!formData.pesoUnidad) {
      errors.pesoUnidad = "El peso por unidad es requerido"
      isValid = false
    } else if (isNaN(formData.pesoUnidad) || Number.parseFloat(formData.pesoUnidad) <= 0) {
      errors.pesoUnidad = "El peso debe ser un número positivo"
      isValid = false
    }

    if (!formData.precioUnitario) {
      errors.precioUnitario = "El precio unitario es requerido"
      isValid = false
    } else if (isNaN(formData.precioUnitario) || Number.parseFloat(formData.precioUnitario) <= 0) {
      errors.precioUnitario = "El precio debe ser un número positivo"
      isValid = false
    }

    if (!formData.idUnidadMedida) {
      errors.idUnidadMedida = "La unidad de medida es requerida"
      isValid = false
    }

    if (!formData.idEstadoProducto) {
      errors.idEstadoProducto = "El estado es requerido"
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
      const url = id ? `/api/productos/${id}` : "/api/productos"
      const method = id ? "PUT" : "POST"

      // Asegurarse de que los valores numéricos sean números
      const dataToSend = {
        ...formData,
        pesoUnidad: Number.parseFloat(formData.pesoUnidad),
        precioUnitario: Number.parseFloat(formData.precioUnitario),
        idTipoProducto: Number.parseInt(formData.idTipoProducto),
        idEstadoProducto: Number.parseInt(formData.idEstadoProducto),
        idUnidadMedida: Number.parseInt(formData.idUnidadMedida),
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si el error es por nombre duplicado, marcar el campo específico
        if (data.error && data.error.includes("Ya existe")) {
          setFieldErrors((prev) => ({
            ...prev,
            nombreProducto: data.error,
          }))
          showAlert(data.error, "error")
          setLoading(false)
          return // Importante: detener la ejecución aquí
        } else {
          showAlert(data.error || "Error al guardar el producto", "error")
          setLoading(false)
          return // Importante: detener la ejecución aquí
        }
      }

      // Mostrar mensaje de éxito
      showAlert(id ? "Producto actualizado correctamente" : "Producto creado correctamente", "success")

      // Redirigir después de un breve retraso para que el usuario vea el mensaje
      setTimeout(() => {
        router.push("/producto")
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
        <Button component={Link} href="/producto" startIcon={<ArrowBack />} variant="outlined">
          Volver a Productos
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
          {id ? "Editar Producto" : "Nuevo Producto"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="nombreProducto"
                label="Nombre"
                value={formData.nombreProducto}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.nombreProducto}
                helperText={fieldErrors.nombreProducto || "El nombre debe ser único"}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="descripcion"
                label="Descripción"
                value={formData.descripcion}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.descripcion}
                helperText={fieldErrors.descripcion}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="idTipoProducto"
                label="Tipo de Producto"
                select
                value={formData.idTipoProducto}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.idTipoProducto}
                helperText={fieldErrors.idTipoProducto}
              >
                {tiposProducto.map((tipo) => (
                  <MenuItem key={tipo.idTipoProducto} value={tipo.idTipoProducto}>
                    {tipo.nombreTipoProducto}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="pesoUnidad"
                label="Peso por Unidad"
                type="number"
                value={formData.pesoUnidad}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ step: "0.01", min: "0" }}
                error={!!fieldErrors.pesoUnidad}
                helperText={fieldErrors.pesoUnidad}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="precioUnitario"
                label="Precio Unitario"
                type="number"
                value={formData.precioUnitario}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ step: "0.01", min: "0" }}
                error={!!fieldErrors.precioUnitario}
                helperText={fieldErrors.precioUnitario}
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
                name="idEstadoProducto"
                label="Estado"
                select
                value={formData.idEstadoProducto}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.idEstadoProducto}
                helperText={fieldErrors.idEstadoProducto}
              >
                {estadosProducto.map((estado) => (
                  <MenuItem key={estado.idEstadoProducto} value={estado.idEstadoProducto}>
                    {estado.nombreEstadoProducto}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Button variant="outlined" onClick={() => router.push("/producto")}>
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

