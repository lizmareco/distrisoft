"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
} from "@mui/material"
import { Person, Email, Phone, LocationOn, Badge, CalendarToday, Security } from "@mui/icons-material"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        console.log("Profile: Intentando cargar perfil de usuario")

        // Intentar obtener el token del localStorage
        const accessToken = localStorage.getItem("accessToken")
        console.log("Profile: Token en localStorage:", accessToken ? "Presente" : "No encontrado")

        const response = await fetch("/api/usuarios/profile", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        })

        if (!response.ok) {
          console.log("Profile: Error en respuesta:", response.status)
          throw new Error(`Error al obtener perfil: ${response.status}`)
        }

        const data = await response.json()
        console.log("Profile: Datos de perfil recibidos:", data)
        setProfile(data)
        setError(null)
      } catch (err) {
        console.error("Error al cargar perfil:", err)

        // Intentar cargar datos básicos del localStorage como respaldo
        try {
          const storedUser = localStorage.getItem("user")
          if (storedUser) {
            const userData = JSON.parse(storedUser)
            console.log("Profile: Usando datos básicos del localStorage como respaldo")
            setProfile({
              nombreUsuario: userData.nombre,
              persona: {
                nombre: userData.nombre,
                apellido: userData.apellido,
              },
              rol: userData.rol,
              seguridad: {
                diasRestantesContrasena: "N/A",
                contrasenaVencida: false,
              },
            })
            setError("No se pudieron cargar todos los datos del perfil. Se muestran datos básicos.")
          } else {
            // SOLUCIÓN ALTERNATIVA: Intentar cargar perfil directamente sin token
            console.log("Profile: Intentando cargar perfil sin token como último recurso")
            try {
              const fallbackResponse = await fetch("/api/usuarios/profile", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              })

              if (fallbackResponse.ok) {
                const fallbackData = await fallbackResponse.json()
                console.log("Profile: Datos de perfil recibidos sin token:", fallbackData)
                setProfile(fallbackData)
                setError("Datos cargados en modo alternativo. Algunas funciones pueden estar limitadas.")
              } else {
                setError(err.message || "Error al cargar los datos del perfil")
              }
            } catch (fallbackError) {
              console.error("Error al cargar perfil sin token:", fallbackError)
              setError(err.message || "Error al cargar los datos del perfil")
            }
          }
        } catch (backupError) {
          console.error("Error al cargar datos de respaldo:", backupError)
          setError(err.message || "Error al cargar los datos del perfil")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getStatusColor = (estado) => {
    switch (estado) {
      case "ACTIVO":
        return "success"
      case "BLOQUEADO":
        return "error"
      case "VENCIDO":
        return "warning"
      default:
        return "default"
    }
  }

  const getPasswordStatusColor = (diasRestantes) => {
    if (diasRestantes <= 0) return "error"
    if (diasRestantes <= 10) return "warning"
    return "success"
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => router.push("/")}>
          Volver al inicio
        </Button>
      </Container>
    )
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">No se encontraron datos del perfil.</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: "primary.main",
              fontSize: "2rem",
              mr: 2,
            }}
          >
            {profile.persona.nombre.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h4" gutterBottom>
              {profile.persona.nombre} {profile.persona.apellido}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip label={profile.rol} color="primary" size="small" />
              <Chip label={profile.estado} color={getStatusColor(profile.estado)} size="small" />
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <Person sx={{ mr: 1 }} /> Información Personal
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Badge sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        Documento:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {profile.persona.tipoDocumento} {profile.persona.nroDocumento}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Email sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        Correo:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {profile.persona.correoPersona || "No disponible"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Phone sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        Teléfono:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {profile.persona.nroTelefono || "No disponible"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        Dirección:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {profile.persona.direccion || "No disponible"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <LocationOn sx={{ mr: 1, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        Ciudad:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {profile.persona.ciudad || "No disponible"}
                      </Typography>
                    </Box>
                  </Grid>

                  {profile.persona.fechaNacimiento && (
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CalendarToday sx={{ mr: 1, color: "text.secondary" }} />
                        <Typography variant="body2" color="text.secondary">
                          Fecha de Nacimiento:
                        </Typography>
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          {formatDate(profile.persona.fechaNacimiento)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
                  <Security sx={{ mr: 1 }} /> Seguridad de la Cuenta
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Nombre de Usuario:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {profile.nombreUsuario}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Último Cambio de Contraseña:
                      </Typography>
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        {formatDate(profile.seguridad.ultimoCambioContrasena)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Estado de Contraseña:
                      </Typography>
                      <Chip
                        label={
                          profile.seguridad.diasRestantesContrasena <= 0
                            ? "Vencida"
                            : `Vence en ${profile.seguridad.diasRestantesContrasena} días`
                        }
                        color={getPasswordStatusColor(profile.seguridad.diasRestantesContrasena)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </Grid>

                  {profile.seguridad.ultimoInicioSesion && (
                    <Grid item xs={12}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Typography variant="body2" color="text.secondary">
                          Último Inicio de Sesión:
                        </Typography>
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          {formatDate(profile.seguridad.ultimoInicioSesion)}
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>

              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Paper>
    </Container>
  )
}

