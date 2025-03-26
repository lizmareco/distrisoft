"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/src/components/ConfirmDialog"

export default function PersonasPage() {
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    personaId: null,
    personaNombre: "",
  })

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        console.log("Cargando personas...")
        const response = await fetch("/api/personas")
        if (!response.ok) {
          throw new Error("Error al cargar personas")
        }
        const data = await response.json()
        console.log(`Se cargaron ${data.length} personas`)
        setPersonas(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonas()
  }, [])

  const handleDeleteClick = (id, nombre, apellido) => {
    setConfirmDialog({
      open: true,
      personaId: id,
      personaNombre: `${nombre} ${apellido}`,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/personas/${confirmDialog.personaId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar persona")
      }

      // Actualizar la lista de personas
      setPersonas(personas.filter((persona) => persona.idPersona !== confirmDialog.personaId))

      // Cerrar el diálogo
      setConfirmDialog({ ...confirmDialog, open: false })
    } catch (error) {
      console.error("Error:", error)
      setError(error.message)
      // Cerrar el diálogo incluso si hay error
      setConfirmDialog({ ...confirmDialog, open: false })
    }
  }

  const handleCancelDelete = () => {
    setConfirmDialog({ ...confirmDialog, open: false })
  }

  const handleEdit = (id) => {
    console.log(`Navegando a /personas/${id}`)
    router.push(`/personas/${id}`)
  }

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" component="h1">
          Listado de Personas
        </Typography>
        <Link href="/personas/nueva" passHref>
          <Button variant="contained" color="primary" startIcon={<AddIcon />}>
            Nueva Persona
          </Button>
        </Link>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Documento</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Correo</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {personas.length > 0 ? (
                personas.map((persona) => (
                  <TableRow key={persona.idPersona}>
                    <TableCell>{persona.idPersona}</TableCell>
                    <TableCell>{persona.nombre}</TableCell>
                    <TableCell>{persona.apellido}</TableCell>
                    <TableCell>{`${persona.tipoDocumento?.descTipoDocumento || "N/A"}: ${persona.nroDocumento}`}</TableCell>
                    <TableCell>{persona.nroTelefono}</TableCell>
                    <TableCell>{persona.correoPersona}</TableCell>
                    <TableCell>{persona.ciudad?.descCiudad || "N/A"}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(persona.idPersona)}
                        aria-label="Editar persona"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(persona.idPersona, persona.nombre, persona.apellido)}
                        aria-label="Eliminar persona"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay personas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Eliminar Persona"
        message={`¿Está seguro que desea eliminar a ${confirmDialog.personaNombre}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}

