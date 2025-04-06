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
import PersonIcon from "@mui/icons-material/Person" // Import PersonIcon
import Link from "next/link"
import { useRouter } from "next/navigation"
import ConfirmDialog from "@/src/components/ConfirmDialog"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export default function ClientesPage() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  // Estado para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    clienteId: null,
    clienteNombre: "",
  })

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        console.log("Cargando clientes...")
        const response = await fetch("/api/clientes")
        if (!response.ok) {
          throw new Error("Error al cargar clientes")
        }
        const data = await response.json()
        console.log(`Se cargaron ${data.length} clientes`)
        setClientes(data)
      } catch (error) {
        console.error("Error:", error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [])

  const handleDeleteClick = (id, nombre, apellido) => {
    setConfirmDialog({
      open: true,
      clienteId: id,
      clienteNombre: `${nombre} ${apellido}`,
    })
  }

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`/api/clientes/${confirmDialog.clienteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Error al eliminar cliente")
      }

      // Actualizar la lista de clientes
      setClientes(clientes.filter((cliente) => cliente.idCliente !== confirmDialog.clienteId))

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
    console.log(`Navegando a /clientes/${id}`)
    router.push(`/clientes/${id}`)
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
            Gestión de Clientes
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} component={Link} href="/clientes/nuevo">
          Registrar Nuevo Cliente
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
                <TableCell>Cliente</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Sector</TableCell>
                <TableCell>Condición de Pago</TableCell>
                <TableCell>Empresa Asociada</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <TableRow key={cliente.idCliente}>
                    <TableCell>{cliente.idCliente}</TableCell>
                    <TableCell>{`${cliente.persona.nombre} ${cliente.persona.apellido}`}</TableCell>
                    <TableCell>
                      <Chip
                        icon={cliente.idEmpresa ? <BusinessIcon /> : <PersonIcon />}
                        label={cliente.idEmpresa ? "Corporativo" : "Individual"}
                        color={cliente.idEmpresa ? "primary" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{cliente.sectorCliente.descSectorCliente}</TableCell>
                    <TableCell>{cliente.condicionPago.descCondicionPago}</TableCell>
                    <TableCell>{cliente.empresa ? cliente.empresa.razonSocial : "No asociado"}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(cliente.idCliente)}
                        aria-label="Editar cliente"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() =>
                          handleDeleteClick(cliente.idCliente, cliente.persona.nombre, cliente.persona.apellido)
                        }
                        aria-label="Eliminar cliente"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay clientes registrados
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
        title="Eliminar Cliente"
        message={`¿Está seguro que desea eliminar al cliente ${confirmDialog.clienteNombre}? Esta acción no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        type="delete"
      />
    </Container>
  )
}

