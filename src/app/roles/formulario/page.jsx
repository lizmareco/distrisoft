"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import {
  Container,
  Typography,
  TextField,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material"

const RolFormulario = () => {
  const [formulario, setFormulario] = useState({
    nombreRol: "",
    permisos: [],
  })
  const [permisosDisponibles, setPermisosDisponibles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar permisos
        console.log("Cargando permisos...")
        const permisosResponse = await fetch("/api/permisos", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        })

        if (!permisosResponse.ok) {
          throw new Error("Error al cargar permisos")
        }

        const permisosData = await permisosResponse.json()
        console.log("Permisos cargados:", permisosData)

        if (permisosData && permisosData.permisos) {
          setPermisosDisponibles(permisosData.permisos)
        } else {
          console.warn("No se encontraron permisos disponibles")
          setPermisosDisponibles([])
        }

        // Si hay un ID, cargar los datos del rol
        if (id) {
          console.log(`Cargando rol con ID: ${id}`)
          const rolResponse = await fetch(`/api/roles/${id}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          })

          if (!rolResponse.ok) {
            throw new Error(`Error al cargar rol: ${rolResponse.status}`)
          }

          const rolData = await rolResponse.json()
          console.log("Datos del rol recibidos:", rolData)

          if (rolData && rolData.rol) {
            // Extraer los IDs de permisos del rol
            const permisosIds =
              rolData.rol.permisos && Array.isArray(rolData.rol.permisos)
                ? rolData.rol.permisos.map((p) => p.idPermiso)
                : []

            console.log("IDs de permisos extraídos:", permisosIds)

            setFormulario({
              nombreRol: rolData.rol.nombreRol || "",
              permisos: permisosIds,
            })
          } else {
            console.error("Estructura de datos del rol inesperada:", rolData)
            setError("Error al cargar los datos del rol. Estructura inesperada.")
          }
        }
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError(error.message || "Error al cargar datos necesarios para el formulario")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    if (type === "checkbox") {
      const permisoId = Number.parseInt(value)

      if (checked) {
        // Agregar permiso
        setFormulario((prev) => ({
          ...prev,
          permisos: [...prev.permisos, permisoId],
        }))
      } else {
        // Quitar permiso
        setFormulario((prev) => ({
          ...prev,
          permisos: prev.permisos.filter((id) => id !== permisoId),
        }))
      }
    } else {
      // Campos de texto
      setFormulario((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)

      console.log("Enviando datos:", formulario)
      console.log("Permisos a enviar:", formulario.permisos)

      const url = id ? `/api/roles/${id}` : "/api/roles"
      const method = id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nombreRol: formulario.nombreRol,
          permisos: formulario.permisos,
        }),
      })

      const responseData = await response.json()
      console.log("Respuesta recibida:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || `Error al ${id ? "actualizar" : "crear"} el rol`)
      }

      setSuccess(true)

      // Redirigir después de un breve retraso
      setTimeout(() => {
        router.push("/roles")
      }, 1500)
    } catch (error) {
      console.error("Error en submit:", error)
      setError(error.message || `Error al ${id ? "actualizar" : "crear"} el rol`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/roles")
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {id ? "Editar Rol" : "Nuevo Rol"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {id ? "Rol actualizado correctamente" : "Rol creado correctamente"}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Nombre del Rol"
              name="nombreRol"
              value={formulario.nombreRol}
              onChange={handleChange}
              margin="normal"
              required
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Permisos
            </Typography>

            {permisosDisponibles.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No hay permisos disponibles
              </Alert>
            ) : (
              <FormGroup sx={{ mb: 3 }}>
                {permisosDisponibles.map((permiso) => (
                  <FormControlLabel
                    key={permiso.idPermiso}
                    control={
                      <Checkbox
                        checked={formulario.permisos.includes(permiso.idPermiso)}
                        onChange={handleChange}
                        value={permiso.idPermiso}
                        name="permisos"
                      />
                    }
                    label={permiso.nombrePermiso}
                  />
                ))}
              </FormGroup>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 3 }}>
              <Button variant="outlined" onClick={handleCancel} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : id ? "Actualizar" : "Guardar"}
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  )
}

export default RolFormulario

