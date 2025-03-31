"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Button,
  TextField,
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material"

export default function FormularioUsuario({ id }) {
  const router = useRouter()
  const esEdicion = !!id

  const [formulario, setFormulario] = useState({
    email: "",
    password: "",
    rol: "usuario",
    activo: true,
    personaId: "",
  })

  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [personas, setPersonas] = useState([])
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null)
  const [buscandoPersonas, setBuscandoPersonas] = useState(false)
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })

  // Cargar datos del usuario si estamos en modo edición
  useEffect(() => {
    if (esEdicion) {
      const cargarUsuario = async () => {
        try {
          const respuesta = await fetch(`/api/usuarios/${id}`)
          if (!respuesta.ok) {
            throw new Error("Error al cargar usuario")
          }
          const datos = await respuesta.json()

          // No incluir la contraseña en el formulario de edición
          const { usuario } = datos
          setFormulario({
            email: usuario.email || "",
            password: "", // No mostrar la contraseña actual
            rol: usuario.rol || "usuario",
            activo: usuario.activo,
            personaId: usuario.personaId || "",
          })

          if (usuario.persona) {
            setPersonaSeleccionada({
              id: usuario.persona.id,
              label: `${usuario.persona.nombre} ${usuario.persona.apellido} (${usuario.persona.nroDocumento})`,
            })
          }
        } catch (error) {
          console.error("Error:", error)
          setSnackbar({
            abierto: true,
            mensaje: "Error al cargar los datos del usuario",
            tipo: "error",
          })
        } finally {
          setCargando(false)
        }
      }

      cargarUsuario()
    } else {
      // Cargar lista inicial de personas
      cargarPersonas()
    }
  }, [id, esEdicion])

  // Cargar personas
  const cargarPersonas = async (termino = "") => {
    setBuscandoPersonas(true)
    try {
      const url = termino ? `/api/personas/buscar?termino=${encodeURIComponent(termino)}` : "/api/personas"

      const respuesta = await fetch(url)
      if (!respuesta.ok) {
        throw new Error("Error al cargar personas")
      }

      const datos = await respuesta.json()
      const listaPersonas = datos.personas.map((persona) => ({
        id: persona.id,
        label: `${persona.nombre} ${persona.apellido} (${persona.nroDocumento})`,
      }))

      setPersonas(listaPersonas)
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: "Error al cargar la lista de personas",
        tipo: "error",
      })
    } finally {
      setBuscandoPersonas(false)
    }
  }

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target
    setFormulario({
      ...formulario,
      [name]: type === "checkbox" ? checked : value,
    })

    // Limpiar error del campo
    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: null,
      })
    }
  }

  // Manejar selección de persona
  const handlePersonaChange = (event, newValue) => {
    setPersonaSeleccionada(newValue)
    setFormulario({
      ...formulario,
      personaId: newValue ? newValue.id : "",
    })

    // Limpiar error del campo
    if (errores.personaId) {
      setErrores({
        ...errores,
        personaId: null,
      })
    }
  }

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formulario.email.trim()) {
      nuevosErrores.email = "El email es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(formulario.email)) {
      nuevosErrores.email = "El email no es válido"
    }

    // Solo validar contraseña en modo creación o si se ha ingresado una nueva contraseña
    if (!esEdicion && !formulario.password) {
      nuevosErrores.password = "La contraseña es obligatoria"
    } else if (formulario.password && formulario.password.length < 6) {
      nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (!formulario.personaId) {
      nuevosErrores.personaId = "Debe seleccionar una persona"
    }

    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      return
    }

    setGuardando(true)

    try {
      // Preparar datos para enviar
      const datosAEnviar = { ...formulario }

      // Si estamos en modo edición y no se ha ingresado una nueva contraseña, eliminarla
      if (esEdicion && !datosAEnviar.password) {
        delete datosAEnviar.password
      }

      const url = esEdicion ? `/api/usuarios/${id}` : "/api/usuarios"
      const metodo = esEdicion ? "PUT" : "POST"

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosAEnviar),
      })

      if (!respuesta.ok) {
        const error = await respuesta.json()
        throw new Error(error.error || "Error al guardar usuario")
      }

      // Mostrar mensaje de éxito
      setSnackbar({
        abierto: true,
        mensaje: esEdicion ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente",
        tipo: "success",
      })

      // Redirigir a la lista después de un breve retraso
      setTimeout(() => {
        router.push("/usuarios")
      }, 2000)
    } catch (error) {
      console.error("Error:", error)
      setSnackbar({
        abierto: true,
        mensaje: error.message || "Error al guardar usuario",
        tipo: "error",
      })
    } finally {
      setGuardando(false)
    }
  }

  // Cancelar y volver a la lista
  const handleCancelar = () => {
    router.push("/usuarios")
  }

  // Cerrar snackbar
  const cerrarSnackbar = () => {
    setSnackbar({ ...snackbar, abierto: false })
  }

  if (cargando) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h6" gutterBottom>
        {esEdicion ? "Editar Usuario" : "Crear Nuevo Usuario"}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Autocomplete
              id="persona-select"
              options={personas}
              loading={buscandoPersonas}
              value={personaSeleccionada}
              onChange={handlePersonaChange}
              onInputChange={(event, newInputValue) => {
                if (newInputValue.length > 2) {
                  cargarPersonas(newInputValue)
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Persona"
                  margin="normal"
                  error={!!errores.personaId}
                  helperText={errores.personaId}
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {buscandoPersonas ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Typography variant="caption" color="textSecondary">
              Nota: Una persona no puede tener más de 2 usuarios activos
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formulario.email}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errores.email}
              helperText={errores.email}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="password"
              label={esEdicion ? "Nueva Contraseña (dejar en blanco para mantener la actual)" : "Contraseña"}
              type="password"
              value={formulario.password}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errores.password}
              helperText={errores.password}
              required={!esEdicion}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="rol-label">Rol</InputLabel>
              <Select labelId="rol-label" name="rol" value={formulario.rol} onChange={handleChange} label="Rol">
                <MenuItem value="usuario">Usuario</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
                <MenuItem value="editor">Editor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={<Switch name="activo" checked={formulario.activo} onChange={handleChange} color="primary" />}
              label="Usuario Activo"
              sx={{ mt: 2 }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button variant="outlined" onClick={handleCancelar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={guardando}>
            {guardando ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Guardando...
              </>
            ) : esEdicion ? (
              "Actualizar"
            ) : (
              "Crear"
            )}
          </Button>
        </Box>
      </Box>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Paper>
  )
}

