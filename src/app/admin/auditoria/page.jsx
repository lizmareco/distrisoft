"use client"

import React from "react"

import { useState, useEffect } from "react"
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from "@mui/material"
import { ExpandMore, Search, Refresh, VisibilityOutlined, FilterAlt, ClearAll, TableChart } from "@mui/icons-material"

import { exportToExcel } from "@/src/utils/export-utils"

export default function AuditoriaPage() {
  // Estados para filtros
  const [entidad, setEntidad] = useState("")
  const [accion, setAccion] = useState("")
  const [idUsuario, setIdUsuario] = useState("")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  // Estados para paginación
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Estados para datos y carga
  const [registros, setRegistros] = useState([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)

  // Estado para la lista de usuarios
  const [usuarios, setUsuarios] = useState([])
  const [loadingUsuarios, setLoadingUsuarios] = useState(false)

  // Estado para exportación
  const [exportLoading, setExportLoading] = useState(false)

  // Lista de acciones para el filtro
  const acciones = [
    { value: "CREAR", label: "Crear" },
    { value: "ACTUALIZAR", label: "Actualizar" },
    { value: "ELIMINAR", label: "Eliminar" },
    { value: "LOGIN_EXITOSO", label: "Inicio de sesión exitoso" },
    { value: "LOGIN_FALLIDO", label: "Inicio de sesión fallido" },
    { value: "LOGOUT", label: "Cierre de sesión" },
    { value: "CAMBIO_CONTRASEÑA_EXITOSO", label: "Cambio de contraseña" },
  ]

  // Lista de entidades para el filtro
  const entidades = [
    { value: "Usuario", label: "Usuario" },
    { value: "Producto", label: "Producto" },
    { value: "Cliente", label: "Cliente" },
    { value: "Proveedor", label: "Proveedor" },
    { value: "Venta", label: "Venta" },
    { value: "Compra", label: "Compra" },
  ]

  // Cargar datos al montar el componente y cuando cambien los filtros o paginación
  useEffect(() => {
    cargarDatos()
    cargarUsuarios()
  }, [page, rowsPerPage])

  // Función para cargar la lista de usuarios
  const cargarUsuarios = async () => {
    setLoadingUsuarios(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener usuarios: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setUsuarios(data.usuarios || [])
    } catch (err) {
      console.error("Error al cargar usuarios:", err)
      // No mostramos este error al usuario para no sobrecargar la interfaz
    } finally {
      setLoadingUsuarios(false)
    }
  }

  // Función para cargar datos
  const cargarDatos = async () => {
    setLoading(true)
    setError(null)

    try {
      // Construir URL con parámetros de consulta
      let url = `/api/admin/auditoria?page=${page + 1}&limit=${rowsPerPage}`

      if (entidad) url += `&entidad=${encodeURIComponent(entidad)}`
      if (accion) url += `&accion=${encodeURIComponent(accion)}`
      if (idUsuario) url += `&idUsuario=${encodeURIComponent(idUsuario)}`
      if (fechaInicio) url += `&fechaInicio=${encodeURIComponent(fechaInicio)}`
      if (fechaFin) url += `&fechaFin=${encodeURIComponent(fechaFin)}`

      console.log("Cargando datos de auditoría desde:", url)

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        let errorMessage = `Error al obtener datos: ${response.status} ${response.statusText}`

        try {
          const errorData = await response.json()
          if (errorData && errorData.message) {
            errorMessage += ` - ${errorData.message}`
          }
        } catch (e) {
          console.error("No se pudo parsear la respuesta de error:", e)
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("Datos recibidos:", data)

      // Si no hay registros, establecer un array vacío
      if (!data || !data.registros) {
        console.warn("La respuesta no contiene registros:", data)
        setRegistros([])
        setTotalRegistros(0)
      } else {
        setRegistros(data.registros)
        setTotalRegistros(data.meta?.total || 0)
      }
    } catch (err) {
      console.error("Error al cargar datos de auditoría:", err)
      setError(err.message || "Error al cargar los datos de auditoría")
      setRegistros([])
      setTotalRegistros(0)
    } finally {
      setLoading(false)
    }
  }

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    setPage(0) // Resetear a la primera página
    cargarDatos()
  }

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setEntidad("")
    setAccion("")
    setIdUsuario("")
    setFechaInicio("")
    setFechaFin("")
    setPage(0)
    cargarDatos()
  }

  // Manejadores para paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A"
    return new Date(fecha).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Función para obtener color de chip según acción
  const getChipColor = (accion) => {
    switch (accion) {
      case "CREAR":
        return "success"
      case "ACTUALIZAR":
        return "info"
      case "ELIMINAR":
        return "error"
      case "LOGIN_EXITOSO":
        return "success"
      case "LOGIN_FALLIDO":
        return "error"
      case "LOGOUT":
        return "default"
      case "CAMBIO_CONTRASEÑA_EXITOSO":
        return "warning"
      default:
        return "default"
    }
  }

  // Función para mostrar detalles de un registro
  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id)
  }

  // Función para exportar datos a Excel
  const handleExportToExcel = async () => {
    setExportLoading(true)
    try {
      // Obtener todos los datos para exportar (sin paginación)
      let url = `/api/admin/auditoria?limit=1000`

      if (entidad) url += `&entidad=${encodeURIComponent(entidad)}`
      if (accion) url += `&accion=${encodeURIComponent(accion)}`
      if (idUsuario) url += `&idUsuario=${encodeURIComponent(idUsuario)}`
      if (fechaInicio) url += `&fechaInicio=${encodeURIComponent(fechaInicio)}`
      if (fechaFin) url += `&fechaFin=${encodeURIComponent(fechaFin)}`

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener datos para exportar: ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.registros || !data.registros.length) {
        throw new Error("No hay datos para exportar")
      }

      // Preparar datos para exportación
      const datosParaExportar = data.registros.map((registro) => ({
        ID: registro.idAuditoria,
        Fecha: formatearFecha(registro.fechaCreacion),
        Entidad: registro.entidad,
        Acción: registro.accion,
        "ID Registro": registro.idRegistro,
        Usuario: registro.usuario
          ? `${registro.usuario.persona?.nombre || ""} ${registro.usuario.persona?.apellido || ""} (${registro.usuario.nombreUsuario})`
          : `ID: ${registro.idUsuario}`,
        "Dirección IP": registro.direccionIP || "N/A",
        Navegador: registro.navegador || "N/A",
      }))

      // Exportar a Excel
      exportToExcel(datosParaExportar, "auditoria_sistema")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      setError(`Error al exportar a Excel: ${error.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Auditoría del Sistema
        </Typography>

        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <FilterAlt sx={{ mr: 1 }} />
              <Typography variant="h6">Filtros</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Entidad"
                  fullWidth
                  value={entidad}
                  onChange={(e) => setEntidad(e.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {entidades.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField select label="Acción" fullWidth value={accion} onChange={(e) => setAccion(e.target.value)}>
                  <MenuItem value="">Todas</MenuItem>
                  {acciones.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  select
                  label="Usuario"
                  fullWidth
                  value={idUsuario}
                  onChange={(e) => setIdUsuario(e.target.value)}
                  disabled={loadingUsuarios}
                  helperText={loadingUsuarios ? "Cargando usuarios..." : ""}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {usuarios.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Fecha Inicio"
                  fullWidth
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Fecha Fin"
                  fullWidth
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={4}>
                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", height: "100%", alignItems: "center" }}>
                  <Button variant="outlined" startIcon={<ClearAll />} onClick={limpiarFiltros}>
                    Limpiar
                  </Button>
                  <Button variant="contained" startIcon={<Search />} onClick={aplicarFiltros}>
                    Buscar
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Tooltip title="Exportar a Excel">
            <Button
              startIcon={<TableChart />}
              onClick={handleExportToExcel}
              disabled={loading || exportLoading || registros.length === 0}
              variant="outlined"
              color="success"
            >
              Exportar a Excel
            </Button>
          </Tooltip>

          <Button startIcon={<Refresh />} onClick={cargarDatos} disabled={loading}>
            Actualizar
          </Button>
        </Box>

        {loading || exportLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Detalles</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Entidad</TableCell>
                    <TableCell>Acción</TableCell>
                    <TableCell>Usuario</TableCell>
                    <TableCell>IP</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registros.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No se encontraron registros
                      </TableCell>
                    </TableRow>
                  ) : (
                    registros.map((registro) => (
                      <React.Fragment key={registro.idAuditoria}>
                        <TableRow hover>
                          <TableCell>
                            <IconButton size="small" onClick={() => toggleExpandRow(registro.idAuditoria)}>
                              <VisibilityOutlined />
                            </IconButton>
                          </TableCell>
                          <TableCell>{formatearFecha(registro.fechaCreacion)}</TableCell>
                          <TableCell>{registro.entidad}</TableCell>
                          <TableCell>
                            <Chip label={registro.accion} color={getChipColor(registro.accion)} size="small" />
                          </TableCell>
                          <TableCell>
                            {registro.usuario
                              ? `${registro.usuario.persona?.nombre || ""} ${
                                  registro.usuario.persona?.apellido || ""
                                } (${registro.usuario.nombreUsuario})`
                              : `ID: ${registro.idUsuario}`}
                          </TableCell>
                          <TableCell>{registro.direccionIP || "N/A"}</TableCell>
                        </TableRow>
                        {expandedRow === registro.idAuditoria && (
                          <TableRow>
                            <TableCell colSpan={6} sx={{ py: 0 }}>
                              <Box sx={{ p: 2, bgcolor: "background.paper" }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Navegador:
                                    </Typography>
                                    <Typography variant="body2">{registro.navegador || "No disponible"}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      ID de Registro:
                                    </Typography>
                                    <Typography variant="body2">{registro.idRegistro || "No disponible"}</Typography>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Valor Anterior:
                                    </Typography>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1,
                                        maxHeight: "200px",
                                        overflow: "auto",
                                        bgcolor: "grey.50",
                                      }}
                                    >
                                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                        {registro.valorAnterior
                                          ? JSON.stringify(registro.valorAnterior, null, 2)
                                          : "No disponible"}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                      Valor Nuevo:
                                    </Typography>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        p: 1,
                                        maxHeight: "200px",
                                        overflow: "auto",
                                        bgcolor: "grey.50",
                                      }}
                                    >
                                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                        {registro.valorNuevo
                                          ? JSON.stringify(registro.valorNuevo, null, 2)
                                          : "No disponible"}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                </Grid>
                              </Box>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalRegistros}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
            />
          </>
        )}
      </Paper>
    </Container>
  )
}

