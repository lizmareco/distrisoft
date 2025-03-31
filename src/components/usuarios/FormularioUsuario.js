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
  Snackbar,
  Alert,
  CircularProgress,
  Autocomplete,
} from "@mui/material"

export default function FormularioUsuario({ id }) {
  const router = useRouter()
  const esEdicion = !!id

  const [formulario, setFormulario] = useState({
    nombreUsuario: "",
    contrasena: "",
    idRol: "",
    estado: "ACTIVO",
    idPersona: "",
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
            nombreUsuario: usuario.nombreUsuario || "",
            contrasena: "", // No mostrar la contraseña actual
            idRol: usuario.idRol || "",
            estado: usuario.estado || "ACTIVO",
            idPersona: usuario.idPersona || "",
          })

          if (usuario.persona) {
            setPersonaSeleccionada({
              id: usuario.persona.idPersona,
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
      setCargando(false)
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
      console.log("Personas recibidas:", datos)

      const listaPersonas = datos.personas.map((persona) => ({
        id: persona.idPersona,
        label: `${persona.nombre} ${persona.apellido} (${persona.nroDocumento})`,
      }))

      setPersonas(listaPersonas)
    } catch (error) {
      console.error("Error al cargar personas:", error)
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
    console.log("Persona seleccionada:", newValue)
    setPersonaSeleccionada(newValue)
    setFormulario({
      ...formulario,
      idPersona: newValue ? newValue.id : "",
    })

    // Limpiar error del campo
    if (errores.idPersona) {
      setErrores({
        ...errores,
        idPersona: null,
      })
    }
  }

  // Validar formulario
  const validarFormulario = () => {
    const nuevosErrores = {}

    if (!formulario.nombreUsuario.trim()) {
      nuevosErrores.nombreUsuario = "El nombre de usuario es obligatorio"
    }

    // Solo validar contraseña en modo creación o si se ha ingresado una nueva contraseña
    if (!esEdicion && !formulario.contrasena) {
      nuevosErrores.contrasena = "La contraseña es obligatoria"
    } else if (formulario.contrasena && formulario.contrasena.length < 6) {
      nuevosErrores.contrasena = "La contraseña debe tener al menos 6 caracteres"
    }

    if (!formulario.idPersona) {
      nuevosErrores.idPersona = "Debe seleccionar una persona"
    }

    if (!formulario.idRol) {
      nuevosErrores.idRol = "Debe seleccionar un rol"
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
      // Preparar datos para enviar según el modelo Usuario
      const datosAEnviar = {
        nombreUsuario: formulario.nombreUsuario,
        contrasena: formulario.contrasena,
        idRol: Number.parseInt(formulario.idRol),
        idPersona: Number.parseInt(formulario.idPersona),
        estado: formulario.estado,
      }

      // Si estamos en modo edición y no se ha ingresado una nueva contraseña, eliminarla
      if (esEdicion && !datosAEnviar.contrasena) {
        delete datosAEnviar.contrasena
      }

      console.log("Enviando datos:", datosAEnviar)

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
                  error={!!errores.idPersona}
                  helperText={errores.idPersona}
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
              name="nombreUsuario"
              label="Nombre de Usuario"
              value={formulario.nombreUsuario}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errores.nombreUsuario}
              helperText={errores.nombreUsuario}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="contrasena"
              label={esEdicion ? "Nueva Contraseña (dejar en blanco para mantener la actual)" : "Contraseña"}
              type="password"
              value={formulario.contrasena}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errores.contrasena}
              helperText={errores.contrasena}
              required={!esEdicion}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal" error={!!errores.idRol} required>
              <InputLabel id="rol-label">Rol</InputLabel>
              <Select labelId="rol-label" name="idRol" value={formulario.idRol} onChange={handleChange} label="Rol">
                <MenuItem value={1}>Administrador</MenuItem>
                <MenuItem value={2}>Vendedor</MenuItem>
                <MenuItem value={3}>Operador</MenuItem>
                {/* Agregar más roles según sea necesario */}
              </Select>
              {errores.idRol && (
                <Typography color="error" variant="caption">
                  {errores.idRol}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="estado-label">Estado</InputLabel>
              <Select
                labelId="estado-label"
                name="estado"
                value={formulario.estado}
                onChange={handleChange}
                label="Estado"
              >
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="PENDIENTE">Pendiente</MenuItem>
                <MenuItem value="SUSPENDIDO">Suspendido</MenuItem>
                <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
              </Select>
            </FormControl>
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

