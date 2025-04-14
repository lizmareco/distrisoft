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
  Chip,
} from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowBack, CheckCircle, Cancel } from "@mui/icons-material"
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
    idUnidadMedida: "",
    idEstadoProducto: "1", // Por defecto, estado activo (1)
  })

  const [unidadesMedida, setUnidadesMedida] = useState([])
  const [tiposProducto, setTiposProducto] = useState([])
  const [estadosProducto, setEstadosProducto] = useState([])
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loadingData, setLoadingData] = useState(true)
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "error",
  })

  // Asegurarnos de que el formulario muestre correctamente los tipos de producto
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

        // Cargar tipos de producto
        const tiposResponse = await fetch("/api/tipoproducto")
        if (!tiposResponse.ok) {
          showAlert("Error al cargar tipos de producto", "error")
          setLoadingData(false)
          return
        }
        const tiposData = await tiposResponse.json()
        console.log("Tipos de producto cargados:", tiposData) // Depuración
        setTiposProducto(tiposData)

        // Cargar estados de producto
        const estadosResponse = await fetch("/api/estadoproducto")
        if (!estadosResponse.ok) {
          showAlert("Error al cargar estados de producto", "error")
          setLoadingData(false)
          return
        }
        const estadosData = await estadosResponse.json()
        setEstadosProducto(estadosData)

        // Si hay un ID, cargar los datos del producto
        if (id) {
          const productoResponse = await fetch(`/api/productos/${id}`)
          if (!productoResponse.ok) {
            showAlert("Error al cargar producto", "error")
            setLoadingData(false)
            return
          }
          const producto = await productoResponse.json()
          console.log("Producto cargado:", producto) // Depuración

          setFormData({
            nombreProducto: producto.nombreProducto || "",
            descripcion: producto.descripcion || "",
            idTipoProducto: producto.idTipoProducto?.toString() || "",
            pesoUnidad: producto.pesoUnidad?.toString() || "",
            precioUnitario: producto.precioUnitario?.toString() || "",
            idUnidadMedida: producto.idUnidadMedida?.toString() || "",
            idEstadoProducto: producto.idEstadoProducto?.toString() || "1",
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
    } else {
      // Limpiar el valor para validación
      const pesoLimpio = formData.pesoUnidad.toString().replace(/\./g, "").replace(",", ".")
      if (isNaN(pesoLimpio) || Number.parseFloat(pesoLimpio) <= 0) {
        errors.pesoUnidad = "El peso debe ser un número positivo"
        isValid = false
      }
    }

    if (!formData.precioUnitario) {
      errors.precioUnitario = "El precio unitario es requerido"
      isValid = false
    } else {
      // Limpiar el valor para validación
      const precioLimpio = formData.precioUnitario.toString().replace(/\./g, "").replace(",", ".")
      if (isNaN(precioLimpio) || Number.parseFloat(precioLimpio) <= 0) {
        errors.precioUnitario = "El precio debe ser un número positivo"
        isValid = false
      }
    }

    if (!formData.idUnidadMedida) {
      errors.idUnidadMedida = "La unidad de medida es requerida"
      isValid = false
    }

    if (!formData.idEstadoProducto) {
      errors.idEstadoProducto = "El estado del producto es requerido"
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
      // Eliminar posibles puntos de miles antes de convertir a número
      const pesoUnidadLimpio = formData.pesoUnidad.toString().replace(/\./g, "").replace(",", ".")
      const precioUnitarioLimpio = formData.precioUnitario.toString().replace(/\./g, "").replace(",", ".")

      const dataToSend = {
        ...formData,
        pesoUnidad: Number.parseFloat(pesoUnidadLimpio),
        precioUnitario: Number.parseFloat(precioUnitarioLimpio),
        idTipoProducto: Number.parseInt(formData.idTipoProducto),
        idUnidadMedida: Number.parseInt(formData.idUnidadMedida),
        idEstadoProducto: Number.parseInt(formData.idEstadoProducto),
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

  // Encontrar el estado actual del producto para mostrar el chip
  const estadoActual = estadosProducto.find(
    (estado) => estado.idEstadoProducto.toString() === formData.idEstadoProducto,
  )

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {id ? "Editar Producto" : "Nuevo Producto"}
          </Typography>

          {id && estadoActual && (
            <Chip
              icon={estadoActual.descEstadoProducto === "Activo" ? <CheckCircle /> : <Cancel />}
              label={estadoActual.descEstadoProducto}
              color={estadoActual.descEstadoProducto === "Activo" ? "success" : "default"}
              variant="outlined"
            />
          )}
        </Box>

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
                  <MenuItem key={tipo.idTipoProducto} value={tipo.idTipoProducto.toString()}>
                    {tipo.nombreTipoProducto}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="pesoUnidad"
                label="Peso por Unidad"
                type="text"
                value={formData.pesoUnidad}
                onChange={(e) => {
                  // Permitir solo números, comas y puntos
                  const value = e.target.value.replace(/[^\d.,]/g, "")
                  setFormData((prev) => ({
                    ...prev,
                    pesoUnidad: value,
                  }))
                }}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.pesoUnidad}
                helperText={
                  fieldErrors.pesoUnidad || "Ingrese el peso con punto como separador de miles (ej: 1.000,50)"
                }
                InputProps={{
                  inputProps: {
                    inputMode: "decimal",
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="precioUnitario"
                label="Precio Unitario"
                type="text"
                value={formData.precioUnitario}
                onChange={(e) => {
                  // Permitir solo números, comas y puntos
                  const value = e.target.value.replace(/[^\d.,]/g, "")
                  setFormData((prev) => ({
                    ...prev,
                    precioUnitario: value,
                  }))
                }}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.precioUnitario}
                helperText={
                  fieldErrors.precioUnitario || "Ingrese el precio con punto como separador de miles (ej: 1.000,50)"
                }
                InputProps={{
                  inputProps: {
                    inputMode: "decimal",
                  },
                }}
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
                  <MenuItem key={unidad.idUnidadMedida} value={unidad.idUnidadMedida.toString()}>
                    {unidad.descUnidadMedida} ({unidad.abreviatura})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="idEstadoProducto"
                label="Estado del Producto"
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
                  <MenuItem key={estado.idEstadoProducto} value={estado.idEstadoProducto.toString()}>
                    {estado.descEstadoProducto}
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
