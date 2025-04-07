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
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    empresaId: null,
    empresaNombre: "",
  })

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        console.log("Cargando empresas...")
        const response = await fetch("/api/empresas")
        if (!response.ok) {
          throw new Error("Error al cargar empresas")
        }
        const data = await response.json()
        console.log(`Se cargaron ${data.length} empresas`)
        setEmpresas(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresas()
  }, [])

  const handleDeleteClick = (id, razonSocial) => {
    setConfirmDialog({
      open: true,
      empresaId: id,
      empresaNombre: razonSocial,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/empresas/${confirmDialog.empresaId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar empresa")
      }

      // Actualizar la lista de empresas
      setEmpresas(empresas.filter((empresa) => empresa.idEmpresa !== confirmDialog.empresaId))

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
    console.log(`Navegando a /empresas/${id}`)
    router.push(`/empresas/${id}`)
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Button component={Link} href="/dashboard" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver a Gestión
          </Button>
          <Typography variant="h5" component="h1">
            Listado de Empresas
          </Typography>
        </Box>
        <Link href="/empresas/nueva" passHref>
          <Button variant="contained" color="primary" startIcon={<AddIcon />}>
            Nueva Empresa
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
                <TableCell>Razón Social</TableCell>
                <TableCell>RUC</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empresas.length > 0 ? (
                empresas.map((empresa) => (
                  <TableRow key={empresa.idEmpresa}>
                    <TableCell>{empresa.idEmpresa}</TableCell>
                    <TableCell>{empresa.razonSocial}</TableCell>
                    <TableCell>{empresa.ruc}</TableCell>
                    <TableCell>{empresa.categoriaEmpresa?.descCategoriaEmpresa || "N/A"}</TableCell>
                    <TableCell>{empresa.ciudad?.descCiudad || "N/A"}</TableCell>
                    <TableCell>
                      {empresa.persona ? `${empresa.persona.nombre} ${empresa.persona.apellido}` : "N/A"}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(empresa.idEmpresa)}
                        aria-label="Editar empresa"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(empresa.idEmpresa, empresa.razonSocial)}
                        aria-label="Eliminar empresa"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay empresas registradas
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
        title="Eliminar Empresa"
        message={`¿Está seguro que desea eliminar la empresa "${confirmDialog.empresaNombre}"? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}

