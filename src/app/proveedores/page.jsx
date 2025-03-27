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
  Chip,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import DeleteIcon from "@mui/icons-material/Delete"
import BusinessIcon from "@mui/icons-material/Business"
import PaymentIcon from "@mui/icons-material/Payment"
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/src/components/ConfirmDialog"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    proveedorId: null,
    proveedorNombre: "",
  })

  useEffect(() => {
    const fetchProveedores = async () => {
      try {
        console.log("Cargando proveedores...")
        const response = await fetch("/api/proveedores")
        if (!response.ok) {
          throw new Error("Error al cargar proveedores")
        }
        const data = await response.json()
        console.log(`Se cargaron ${data.length} proveedores`)
        setProveedores(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProveedores()
  }, [])

  const handleDeleteClick = (id, nombre) => {
    setConfirmDialog({
      open: true,
      proveedorId: id,
      proveedorNombre: nombre,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/proveedores/${confirmDialog.proveedorId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar proveedor")
      }

      // Actualizar la lista de proveedores
      setProveedores(proveedores.filter((proveedor) => proveedor.idProveedor !== confirmDialog.proveedorId))

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
    console.log(`Navegando a /proveedores/${id}`)
    router.push(`/proveedores/${id}`)
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
          <Button component={Link} href="/gestion" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
            Volver a Gestión
          </Button>
          <Typography variant="h5" component="h1">
            Gestión de Proveedores
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} component={Link} href="/proveedores/nuevo">
          Registrar Nuevo Proveedor
        </Button>
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
                <TableCell>Empresa</TableCell>
                <TableCell>RUC</TableCell>
                <TableCell>Contacto</TableCell>
                <TableCell>Condición de Pago</TableCell>
                <TableCell>Fecha Registro</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <TableRow key={proveedor.idProveedor}>
                    <TableCell>{proveedor.idProveedor}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <BusinessIcon sx={{ mr: 1, color: "primary.main" }} />
                        {proveedor.empresa.razonSocial}
                      </Box>
                    </TableCell>
                    <TableCell>{proveedor.empresa.ruc}</TableCell>
                    <TableCell>
                      {proveedor.empresa.persona
                        ? `${proveedor.empresa.persona.nombre} ${proveedor.empresa.persona.apellido}`
                        : "No especificado"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<PaymentIcon />}
                        label={proveedor.condicionPago.descCondicionPago}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(proveedor.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(proveedor.idProveedor)}
                        aria-label="Editar proveedor"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(proveedor.idProveedor, proveedor.empresa.razonSocial)}
                        aria-label="Eliminar proveedor"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay proveedores registrados
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
        title="Eliminar Proveedor"
        message={`¿Está seguro que desea eliminar al proveedor ${confirmDialog.proveedorNombre}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}

