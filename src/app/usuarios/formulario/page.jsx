"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  AlertTitle,
  Container,
  InputAdornment,
  IconButton,
} from "@mui/material"
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material"
import Link from "next/link"
import { validatePasswordComplexity } from "@/src/utils/passwordUtils"
import bcrypt from "bcryptjs" // Importar bcryptjs

export default function FormularioUsuarioPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const esEdicion = !!id

  const [formData, setFormData] = useState({
    nombreUsuario: "",
    contrasena: "",
    idRol: "",
    estado: "ACTIVO",
    idPersona: "",
  })

  const [personas, setPersonas] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loadingData, setLoadingData] = useState(true)
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null)
  const [buscandoPersonas, setBuscandoPersonas] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    validations: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
    errors: [],
  })
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false)
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: "",
    severity: "error",
  })
  const [formulario, setFormulario] = useState({
    nombreUsuario: "",
    contrasena: "",
    idRol: "",
    estado: "ACTIVO",
    idPersona: "",
  })
  const [snackbar, setSnackbar] = useState({
    abierto: false,
    mensaje: "",
    tipo: "success",
  })
  const [cargando, setCargando] = useState(false)
  const [cargandoRoles, setCargandoRoles] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true)

        // Cargar roles
        const rolesResponse = await fetch("/api/rol")
        if (!rolesResponse.ok) {
          showAlert("Error al cargar roles", "error")
          setLoadingData(false)
          return
        }
        const rolesData = await rolesResponse.json()
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData.roles || [])

        // Cargar personas
        const personasResponse = await fetch("/api/personas")
        if (!personasResponse.ok) {
          showAlert("Error al cargar personas", "error")
          setLoadingData(false)
          return
        }
        const personasData = await personasResponse.json()
        const listaPersonas = personasData.map((persona) => ({
          id: persona.idPersona,
          label: `${persona.nombre} ${persona.apellido} (${persona.nroDocumento})`,
        }))
        setPersonas(listaPersonas)

        // Si hay un ID, cargar los datos del usuario
        if (id) {
          const usuarioResponse = await fetch(`/api/usuarios/${id}`)
          if (!usuarioResponse.ok) {
            showAlert("Error al cargar usuario", "error")
            setLoadingData(false)
            return
          }
          const { usuario } = await usuarioResponse.json()

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
    setFormulario((prev) => ({
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

    // Validar complejidad de contraseña
    if (name === "contrasena") {
      const validation = validatePasswordComplexity(value)
      setPasswordValidation(validation)

      // Mostrar requisitos de contraseña cuando el usuario comienza a escribir
      if (value && !showPasswordRequirements) {
        setShowPasswordRequirements(true)
      } else if (!value) {
        setShowPasswordRequirements(false)
      }
    }
  }

  // Función para validar la complejidad de la contraseña
  const validatePasswordComplexity = (password) => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const isValid = Object.values(validations).every(Boolean)
    const errors = []

    if (!validations.length) errors.push("La contraseña debe tener al menos 8 caracteres")
    if (!validations.uppercase) errors.push("La contraseña debe contener al menos una letra mayúscula")
    if (!validations.lowercase) errors.push("La contraseña debe contener al menos una letra minúscula")
    if (!validations.number) errors.push("La contraseña debe contener al menos un número")
    if (!validations.special) errors.push("La contraseña debe contener al menos un carácter especial (!@#$%^&*)")
    return { isValid, validations, errors }
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
    if (fieldErrors.idPersona) {
      setFieldErrors({
        ...fieldErrors,
        idPersona: null,
      })
    }
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

  const validateForm = () => {
    const errors = {}
    let isValid = true

    // Validar campos requeridos
    if (!formulario.nombreUsuario.trim()) {
      errors.nombreUsuario = "El nombre de usuario es obligatorio"
      isValid = false
    }

    // Solo validar contraseña en modo creación o si se ha ingresado una nueva contraseña
    if (!esEdicion && !formulario.contrasena) {
      errors.contrasena = "La contraseña es obligatoria"
      isValid = false
    } else if (formulario.contrasena && !passwordValidation.isValid) {
      errors.contrasena = "La contraseña no cumple con los requisitos de seguridad"
      isValid = false
    }

    if (!formulario.idPersona) {
      errors.idPersona = "Debe seleccionar una persona"
      isValid = false
    }

    if (!formulario.idRol) {
      errors.idRol = "Debe seleccionar un rol"
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  const validarFormulario = () => {
    const errores = {}
    let formValido = true

    if (!formulario.nombreUsuario) {
      errores.nombreUsuario = "El nombre de usuario es obligatorio."
      formValido = false
    }

    if (!formulario.idRol) {
      errores.idRol = "Debe seleccionar un rol."
      formValido = false
    }

    if (!formulario.idPersona) {
      errores.idPersona = "Debe seleccionar una persona."
      formValido = false
    }

    setErrores(errores)
    return formValido
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validarFormulario()) {
      // Mostrar alerta si hay errores de validación
      setSnackbar({
        abierto: true,
        mensaje: "Por favor, corrija los errores en el formulario",
        tipo: "error",
      })
      return
    }

    setLoading(true)

    try {
      const url = id ? `/api/usuarios/${id}` : "/api/usuarios"
      const method = id ? "PUT" : "POST"

      // Preparar datos para enviar
      const datosAEnviar = {
        nombreUsuario: formulario.nombreUsuario,
        idRol: Number.parseInt(formulario.idRol),
        idPersona: Number.parseInt(formulario.idPersona),
        estado: formulario.estado,
      }

      // Encriptar la contraseña si se proporciona
      if (formulario.contrasena) {
        const hashedPassword = await bcrypt.hash(formulario.contrasena, 10) // 10 es el número de salt rounds
        datosAEnviar.contrasena = hashedPassword
      }

      // Si estamos en modo edición y no se ha ingresado una nueva contraseña, eliminarla
      if (esEdicion && !formulario.contrasena) {
        delete datosAEnviar.contrasena
      }

      console.log("Enviando datos:", datosAEnviar)

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosAEnviar),
      })

      const data = await response.json()

      if (!response.ok) {
        // Si el error es por nombre duplicado, marcar el campo específico
        if (data.error && data.error.includes("Ya existe")) {
          setFieldErrors((prev) => ({
            ...prev,
            nombreUsuario: data.error,
          }))
          showAlert(data.error, "error")
          setLoading(false)
          return // Importante: detener la ejecución aquí
        } else {
          showAlert(data.error || "Error al guardar el usuario", "error")
          setLoading(false)
          return // Importante: detener la ejecución aquí
        }
      }

      // Mostrar mensaje de éxito
      showAlert(id ? "Usuario actualizado correctamente" : "Usuario creado correctamente", "success")

      // Redirigir después de un breve retraso para que el usuario vea el mensaje
      setTimeout(() => {
        router.push("/usuarios")
      }, 1500)
    } catch (error) {
      // No lanzar el error, solo mostrarlo en la UI
      console.error("Error de red:", error)
      showAlert("Error de conexión. Por favor, inténtelo de nuevo.", "error")
      setLoading(false)
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
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      {/* Botón de Volver */}
      <Box display="flex" alignItems="center" mb={3} mt={2}>
        <Button component={Link} href="/usuarios" startIcon={<ArrowBack />} variant="outlined">
          Volver a Usuarios
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
          {id ? "Editar Usuario" : "Nuevo Usuario"}
        </Typography>

        <form onSubmit={handleSubmit}>
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
                    // Aquí podrías implementar la búsqueda de personas por término
                    setBuscandoPersonas(true)
                    // Simular búsqueda
                    setTimeout(() => {
                      setBuscandoPersonas(false)
                    }, 500)
                  }
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Persona"
                    margin="normal"
                    error={!!fieldErrors.idPersona}
                    helperText={fieldErrors.idPersona}
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
                Nota: Una persona no puede tener más de 1 usuario activo
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="nombreUsuario"
                label="Nombre de Usuario"
                value={formulario.nombreUsuario}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                error={!!fieldErrors.nombreUsuario}
                helperText={fieldErrors.nombreUsuario || "El nombre debe ser único"}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="contrasena"
                label={esEdicion ? "Nueva Contraseña (dejar en blanco para mantener la actual)" : "Contraseña"}
                type={showPassword ? "text" : "password"}
                value={formulario.contrasena}
                onChange={handleChange}
                fullWidth
                margin="normal"
                error={!!fieldErrors.contrasena}
                helperText={fieldErrors.contrasena}
                required={!esEdicion}
                onFocus={() => setShowPasswordRequirements(true)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Requisitos de contraseña */}
            <Grid item xs={12}>
              <Collapse in={showPasswordRequirements}>
                <Box sx={{ mt: 1, mb: 2, bgcolor: "background.paper", p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="medium">
                    La contraseña debe cumplir con los siguientes requisitos:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        {passwordValidation.validations.length ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos 8 caracteres" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordValidation.validations.uppercase ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos una letra mayúscula" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordValidation.validations.lowercase ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos una letra minúscula" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordValidation.validations.number ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos un número" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {passwordValidation.validations.special ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText primary="Al menos un carácter especial (!@#$%^&*)" />
                    </ListItem>
                  </List>
                </Box>
              </Collapse>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" error={!!errores.idRol} required>
                <InputLabel id="rol-label">Rol</InputLabel>
                <Select
                  labelId="rol-label"
                  name="idRol"
                  value={formulario.idRol}
                  onChange={handleChange}
                  label="Rol"
                  disabled={cargandoRoles}
                >
                  {cargandoRoles ? (
                    <MenuItem disabled>Cargando roles...</MenuItem>
                  ) : (
                    roles.map((rol) => (
                      <MenuItem key={rol.idRol} value={rol.idRol}>
                        {rol.nombreRol}
                      </MenuItem>
                    ))
                  )}
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
                  <MenuItem value="INACTIVO">Inactivo</MenuItem>
                  <MenuItem value="BLOQUEADO">Bloqueado</MenuItem>
                  <MenuItem value="VENCIDO">Vencido</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button variant="outlined" onClick={handleCancelar} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={guardando || (formulario.contrasena && !passwordValidation.isValid && !esEdicion)}
            >
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
        </form>
      </Paper>

      {/* Snackbar para mensajes */}
      <Snackbar open={snackbar.abierto} autoHideDuration={6000} onClose={cerrarSnackbar}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.tipo} sx={{ width: "100%" }}>
          <AlertTitle>{snackbar.tipo === "error" ? "Error" : "Éxito"}</AlertTitle>
          {snackbar.mensaje}
        </Alert>
      </Snackbar>
    </Container>
  )
}

