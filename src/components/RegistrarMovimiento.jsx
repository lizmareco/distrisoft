"use client"

import { useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material"
import { Add as AddIcon, Close as CloseIcon } from "@mui/icons-material"
import { format } from "date-fns"

const RegistrarMovimiento = ({
  tipo = "materiaPrima",
  onMovimientoRegistrado,
  buttonLabel = "Registrar Movimiento",
}) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    id: "",
    cantidad: "",
    tipoMovimiento: "ENTRADA",
    fechaMovimiento: new Date(),
    motivo: "",
    observacion: "",
    unidadMedida: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [responseMessage, setResponseMessage] = useState(null)

  const handleOpen = () => {
    setOpen(true)
    setResponseMessage(null)
    setErrors({})
  }

  const handleClose = () => {
    setOpen(false)
    setFormData({
      id: "",
      cantidad: "",
      tipoMovimiento: "ENTRADA",
      fechaMovimiento: new Date(),
      motivo: "",
      observacion: "",
      unidadMedida: "",
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.id) {
      newErrors.id = `ID de ${tipo === "materiaPrima" ? "materia prima" : "producto"} es requerido`
    }

    if (!formData.cantidad || Number(formData.cantidad) <= 0) {
      newErrors.cantidad = "Cantidad debe ser mayor a 0"
    }

    if (!formData.tipoMovimiento) {
      newErrors.tipoMovimiento = "Tipo de movimiento es requerido"
    }

    if (!formData.motivo) {
      newErrors.motivo = "Motivo es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Limpiar error del campo cuando se modifica
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleDateChange = (newDate) => {
    setFormData((prev) => ({ ...prev, fechaMovimiento: new Date(newDate) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setResponseMessage(null)

    try {
      const endpoint = tipo === "materiaPrima" ? "/api/inventario" : "/api/inventario-producto"

      const requestData = {
        [tipo === "materiaPrima" ? "idMateriaPrima" : "idProducto"]: Number(formData.id),
        cantidad: Number(formData.cantidad),
        tipoMovimiento: formData.tipoMovimiento,
        fechaMovimiento: formData.fechaMovimiento.toISOString(),
        motivo: formData.motivo,
        observacion: formData.observacion || null,
        unidadMedida: formData.unidadMedida || null,
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || "Error al registrar movimiento")
      }

      setResponseMessage({
        type: "success",
        message: data.mensaje || "Movimiento registrado correctamente",
      })

      // Notificar al componente padre
      if (onMovimientoRegistrado) {
        onMovimientoRegistrado(data)
      }

      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        if (data.cambioRealizado) {
          handleClose()
        }
      }, 2000)
    } catch (error) {
      console.error("Error al registrar movimiento:", error)
      setResponseMessage({
        type: "error",
        message: error.message || "Error al registrar movimiento",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen} size="small">
        {buttonLabel}
      </Button>

      <Dialog open={open} onClose={loading ? undefined : handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Registrar Movimiento de {tipo === "materiaPrima" ? "Materia Prima" : "Producto"}
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
            disabled={loading}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {responseMessage && (
            <Alert severity={responseMessage.type} sx={{ mb: 2, mt: 1 }} onClose={() => setResponseMessage(null)}>
              {responseMessage.message}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="id"
                label={`ID ${tipo === "materiaPrima" ? "Materia Prima" : "Producto"}`}
                fullWidth
                value={formData.id}
                onChange={handleChange}
                error={!!errors.id}
                helperText={errors.id}
                disabled={loading}
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.tipoMovimiento}>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  name="tipoMovimiento"
                  value={formData.tipoMovimiento}
                  onChange={handleChange}
                  label="Tipo de Movimiento"
                  disabled={loading}
                >
                  <MenuItem value="ENTRADA">Entrada</MenuItem>
                  <MenuItem value="SALIDA">Salida</MenuItem>
                </Select>
                {errors.tipoMovimiento && <FormHelperText>{errors.tipoMovimiento}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="cantidad"
                label="Cantidad"
                fullWidth
                value={formData.cantidad}
                onChange={handleChange}
                error={!!errors.cantidad}
                helperText={errors.cantidad}
                disabled={loading}
                type="number"
                inputProps={{ step: "0.01", min: "0.01" }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                name="unidadMedida"
                label="Unidad de Medida"
                fullWidth
                value={formData.unidadMedida}
                onChange={handleChange}
                disabled={loading}
                placeholder="Opcional"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Fecha y Hora"
                type="datetime-local"
                fullWidth
                value={format(formData.fechaMovimiento, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) => handleDateChange(e.target.value ? e.target.value : new Date())}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="motivo"
                label="Motivo"
                fullWidth
                value={formData.motivo}
                onChange={handleChange}
                error={!!errors.motivo}
                helperText={errors.motivo}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="observacion"
                label="Observación"
                fullWidth
                value={formData.observacion}
                onChange={handleChange}
                disabled={loading}
                multiline
                rows={2}
                placeholder="Opcional"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Registrando..." : "Registrar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default RegistrarMovimiento
