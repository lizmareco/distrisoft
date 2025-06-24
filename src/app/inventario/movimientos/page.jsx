"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  CalendarMonth as CalendarIcon,
  Close as CloseIcon,
} from "@mui/icons-material"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import InventarioNav from "@/src/components/inventario-nav"
import ExportarExcel from "@/src/components/ExportarExcel"
import RegistrarMovimiento from "@/src/components/RegistrarMovimiento"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import Autocomplete from "@mui/material/Autocomplete"

export default function MovimientosPage() {
  const theme = useTheme()
  const esMobil = useMediaQuery(theme.breakpoints.down("sm"))
  const [valorTab, setValorTab] = useState("materiasprimas")
  const [movimientos, setMovimientos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarFiltros, setMostrarFiltros] = useState(!esMobil)
  const [filtroTipo, setFiltroTipo] = useState("TODOS")
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(null)
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(null)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [filtroNombre, setFiltroNombre] = useState("")
  const [opcionesNombre, setOpcionesNombre] = useState([])
  const [cargandoNombre, setCargandoNombre] = useState(false)
  const [seleccionNombre, setSeleccionNombre] = useState(null)

  useEffect(() => {
    // Establecer mostrarFiltros basado en el tamaño de pantalla
    setMostrarFiltros(!esMobil)
  }, [esMobil])

  useEffect(() => {
    setFiltroNombre("")
    setSeleccionNombre(null)
    setOpcionesNombre([])
  }, [valorTab])

  const handleTabChange = (event, nuevoValor) => {
    setValorTab(nuevoValor)
    setMovimientos([])
    setFiltroTipo("TODOS")
    setFiltroFechaDesde(null)
    setFiltroFechaHasta(null)
    setBusquedaRealizada(false)
    setPage(0)
  }

  const obtenerMovimientos = async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      const hayFiltrosEspecificos = (filtroTipo && filtroTipo !== "TODOS") || filtroFechaDesde || filtroFechaHasta || seleccionNombre
      if (!hayFiltrosEspecificos) {
        params.append("loadAll", "true")
      }
      if (filtroTipo && filtroTipo !== "TODOS") {
        params.append("tipoMovimiento", filtroTipo)
      }
      if (filtroFechaDesde) {
        const fechaDesde = new Date(filtroFechaDesde)
        const fechaDesdeUTC = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), fechaDesde.getDate(), 0, 0, 0)
        params.append("fechaDesde", fechaDesdeUTC.toISOString())
      }
      if (filtroFechaHasta) {
        const fechaHasta = new Date(filtroFechaHasta)
        const fechaHastaUTC = new Date(fechaHasta.getFullYear(), fechaHasta.getMonth(), fechaHasta.getDate(), 23, 59, 59, 999)
        params.append("fechaHasta", fechaHastaUTC.toISOString())
      }
      if (seleccionNombre) {
        if (valorTab === "materiasprimas") {
          params.append("materiaPrimaId", seleccionNombre.idMateriaPrima)
        } else {
          params.append("productoId", seleccionNombre.idProducto)
        }
      }
      params.append("page", (page + 1).toString())
      params.append("limit", rowsPerPage.toString())
      let url = valorTab === "materiasprimas" ? "/api/inventario" : "/api/inventario-producto"
      url += `?${params.toString()}`
      const respuesta = await fetch(url)
      if (!respuesta.ok) {
        throw new Error(
          `Error al cargar los movimientos de ${valorTab === "materiasprimas" ? "materias primas" : "productos"}`,
        )
      }
      const datos = await respuesta.json()
      setMovimientos(datos.movimientos || [])
      setTotalRegistros(datos.meta?.total || datos.movimientos?.length || 0)
      setError(null)
      setBusquedaRealizada(true)
    } catch (error) {
      console.error("Error al cargar movimientos:", error)
      setError(`Error al cargar los movimientos. ${error.message}`)
      setMovimientos([])
      setTotalRegistros(0)
    } finally {
      setCargando(false)
    }
  }

  // Cargar datos cuando cambia la paginación, pero solo si ya se realizó una búsqueda
  useEffect(() => {
    if (busquedaRealizada) {
      obtenerMovimientos()
    }
  }, [page, rowsPerPage])

  const formatearFecha = (fechaString) => {
    try {
      const fecha = new Date(fechaString)
      return format(fecha, "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      console.error("Error al formatear fecha:", error)
      return "Fecha inválida"
    }
  }

  const formatearNumero = (numero, decimales = 0) => {
    const valor = Number.parseFloat(numero || 0)
    return valor.toLocaleString("es-ES", {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
      useGrouping: true
    })
  }

  const formatearObservacion = (observacion) => {
    if (!observacion) return observacion
    
    // Buscar patrones de números seguidos de "kg" (con o sin espacios)
    return observacion.replace(/(\d+(?:\.\d+)?)\s*kg/gi, (match, numero) => {
      const valor = Number.parseFloat(numero)
      // Si el valor es un número entero (sin decimales), no mostrar decimales
      const esEntero = valor === Math.floor(valor)
      const numeroFormateado = esEntero 
        ? valor.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        : valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      return `${numeroFormateado} kg`
    })
  }

  const renderizarTipoMovimiento = (tipo) => {
    const esEntrada = tipo === "ENTRADA"
    return (
      <Chip
        label={esEntrada ? "Entrada" : "Salida"}
        color={esEntrada ? "success" : "error"}
        size="small"
        icon={esEntrada ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
      />
    )
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(0) // Resetear a la primera página
    obtenerMovimientos()
  }

  const limpiarFiltros = () => {
    setFiltroTipo("TODOS")
    setFiltroFechaDesde(null)
    setFiltroFechaHasta(null)
    setFiltroNombre("")
    setSeleccionNombre(null)
    setOpcionesNombre([])
    setPage(0)
    setMovimientos([])
    setBusquedaRealizada(false)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  // Preparar datos para exportar a Excel
  const datosParaExcel = movimientos.map((movimiento) => ({
    Fecha: formatearFecha(movimiento.fechaMovimiento),
    Tipo: movimiento.tipoMovimiento,
    [valorTab === "materiasprimas" ? "Materia Prima" : "Producto"]:
      valorTab === "materiasprimas"
        ? movimiento.materiaPrima?.nombreMateriaPrima || "N/A"
        : movimiento.producto?.nombreProducto || "N/A",
    Cantidad: formatearNumero(movimiento.cantidad),
    "Stock Antes": formatearNumero(movimiento.stockAntes),
    "Stock Después": formatearNumero(movimiento.stockDespues),
    "Unidad Medida": movimiento.unidadMedida || "N/A",
    Motivo: movimiento.motivo || "N/A",
    Observación: formatearObservacion(movimiento.observacion) || "N/A",
  }))

  const handleMovimientoRegistrado = () => {
    // Recargar los movimientos solo si ya se realizó una búsqueda
    if (busquedaRealizada) {
      obtenerMovimientos()
    }
  }

  const buscarOpcionesNombre = async (input) => {
    if (!input || input.length < 2) {
      setOpcionesNombre([])
      return
    }
    setCargandoNombre(true)
    try {
      let url = valorTab === "materiasprimas"
        ? `/api/materiaprima/buscar?query=${encodeURIComponent(input)}&activas=true`
        : `/api/productos/buscar?query=${encodeURIComponent(input)}`
      const resp = await fetch(url)
      if (resp.ok) {
        const data = await resp.json()
        setOpcionesNombre(data)
      } else {
        setOpcionesNombre([])
      }
    } catch (e) {
      setOpcionesNombre([])
    } finally {
      setCargandoNombre(false)
    }
  }

  return (
    <Container maxWidth="xl">
      <Button component={Link} href="/" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
      </Button>
      {/* 1. TÍTULO */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Movimientos de Inventario
          {movimientos.length > 0 && (
            console.log("Movimientos cargados:", movimientos),
            <ExportarExcel
              datos={datosParaExcel}
              nombreArchivo={`movimientos-${valorTab === "materiasprimas" ? "materiasprimas" : "productos"}`}
              nombreHoja="Movimientos"
            />
          )}
        </Typography>
        <RegistrarMovimiento
          tipo={valorTab === "materiasprimas" ? "materiaPrima" : "producto"}
          onMovimientoRegistrado={handleMovimientoRegistrado}
          buttonLabel={`Registrar ${valorTab === "materiasprimas" ? "Materia Prima" : "Producto"}`}
        />
      </Box>

      {/* 2. MENÚ DE NAVEGACIÓN PRINCIPAL */}
      <InventarioNav activeTab="movimientos" />

      {/* 3. PESTAÑAS MATERIAS PRIMAS/PRODUCTOS */}
      <Paper sx={{ width: "100%", mb: 4 }}>
        <Tabs
          value={valorTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab value="materiasprimas" label="MATERIAS PRIMAS" />
          <Tab value="productos" label="PRODUCTOS" />
        </Tabs>
      </Paper>

      {/* 4. FILTROS SIMPLIFICADOS */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">Filtros</Typography>
            {esMobil && (
              <IconButton onClick={() => setMostrarFiltros(!mostrarFiltros)}>
                {mostrarFiltros ? <CloseIcon /> : <FilterListIcon />}
              </IconButton>
            )}
          </Box>

          {mostrarFiltros && (
            <Box component="form" onSubmit={handleSearch}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel id="tipo-movimiento-label">Tipo de Movimiento</InputLabel>
                    <Select
                      labelId="tipo-movimiento-label"
                      value={filtroTipo}
                      label="Tipo de Movimiento"
                      onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                      <MenuItem value="TODOS">Todos</MenuItem>
                      <MenuItem value="ENTRADA">Entradas</MenuItem>
                      <MenuItem value="SALIDA">Salidas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Desde"
                    type="date"
                    value={filtroFechaDesde ? format(filtroFechaDesde, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Crear fecha a partir del valor seleccionado (yyyy-MM-dd)
                        const [year, month, day] = e.target.value.split("-").map(Number)
                        // Crear una nueva fecha usando el constructor con año, mes (0-indexed), día
                        const fecha = new Date(year, month - 1, day)
                        console.log("Fecha desde seleccionada:", e.target.value)
                        console.log("Fecha desde objeto:", fecha)
                        setFiltroFechaDesde(fecha)
                      } else {
                        setFiltroFechaDesde(null)
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Hasta"
                    type="date"
                    value={filtroFechaHasta ? format(filtroFechaHasta, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        // Crear fecha a partir del valor seleccionado (yyyy-MM-dd)
                        const [year, month, day] = e.target.value.split("-").map(Number)
                        // Crear una nueva fecha usando el constructor con año, mes (0-indexed), día
                        const fecha = new Date(year, month - 1, day)
                        console.log("Fecha hasta seleccionada:", e.target.value)
                        console.log("Fecha hasta objeto:", fecha)
                        setFiltroFechaHasta(fecha)
                      } else {
                        setFiltroFechaHasta(null)
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>
                      ),
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <Autocomplete
                    freeSolo
                    options={opcionesNombre}
                    getOptionLabel={(option) =>
                      valorTab === "materiasprimas"
                        ? option?.nombreMateriaPrima || ""
                        : option?.nombreProducto || ""
                    }
                    loading={cargandoNombre}
                    value={seleccionNombre === undefined ? null : seleccionNombre}
                    inputValue={typeof filtroNombre === "string" ? filtroNombre : ""}
                    onChange={(event, newValue) => {
                      setSeleccionNombre(newValue)
                      if (newValue) {
                        setFiltroNombre(valorTab === "materiasprimas"
                          ? newValue.nombreMateriaPrima || ""
                          : newValue.nombreProducto || "")
                      } else {
                        setFiltroNombre("")
                      }
                    }}
                    onInputChange={(event, newInputValue, reason) => {
                      if (reason === "input") {
                        setFiltroNombre(newInputValue || "")
                        buscarOpcionesNombre(newInputValue || "")
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={valorTab === "materiasprimas" ? "Materia Prima" : "Producto"}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {cargandoNombre ? <CircularProgress color="inherit" size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                        helperText={`Escriba para buscar ${valorTab === "materiasprimas" ? "materia prima" : "producto"}`}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={6} sm={1}>
                  <Button variant="contained" color="primary" fullWidth type="submit" disabled={cargando}>
                    Buscar
                  </Button>
                </Grid>

                <Grid item xs={6} sm={1}>
                  <Button variant="outlined" fullWidth onClick={limpiarFiltros} disabled={cargando}>
                    Limpiar
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : !busquedaRealizada ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            Utilice los filtros para buscar movimientos
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Seleccione los criterios de búsqueda y haga clic en "Buscar"
          </Typography>
        </Paper>
      ) : movimientos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No se encontraron movimientos
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Intente con otros criterios de búsqueda
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Vista de Tarjetas para Móvil */}
          {esMobil && (
            <Box sx={{ mb: 4 }}>
              {movimientos.map((movimiento) => (
                <Card key={movimiento.idInventario || movimiento.idInventarioProducto} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Typography variant="h6">
                        {valorTab === "materiasprimas"
                          ? movimiento.materiaPrima?.nombreMateriaPrima
                          : movimiento.producto?.nombreProducto}
                      </Typography>
                      {renderizarTipoMovimiento(movimiento.tipoMovimiento)}
                    </Box>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Fecha:
                        </Typography>
                        <Typography variant="body2">{formatearFecha(movimiento.fechaMovimiento)}</Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Cantidad({valorTab === "materiasprimas" ? "gramos" : "unidades"}):
                        </Typography>
                        <Typography variant="body2">
                          {formatearNumero(movimiento.cantidad)} {movimiento.unidadMedida || "N/A"}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Stock Antes:
                        </Typography>
                        <Typography variant="body2">
                          {formatearNumero(movimiento.stockAntes)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">
                          Stock Después:
                        </Typography>
                        <Typography variant="body2">
                          {formatearNumero(movimiento.stockDespues)}
                        </Typography>
                      </Grid>

                      {movimiento.motivo && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Motivo:
                          </Typography>
                          <Typography variant="body2">{movimiento.motivo}</Typography>
                        </Grid>
                      )}

                      {movimiento.observacion && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Observación:
                          </Typography>
                          <Typography variant="body2">{formatearObservacion(movimiento.observacion)}</Typography>
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Vista de Tabla para Escritorio */}
          {!esMobil && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>{valorTab === "materiasprimas" ? "Materia Prima" : "Producto"}</TableCell>
                    <TableCell align="center">Tipo</TableCell>
                    <TableCell align="right">Cantidad({valorTab === "materiasprimas" ? "gramos" : "unidades"})</TableCell>
                    <TableCell align="right">Stock Antes</TableCell>
                    <TableCell align="right">Stock Después</TableCell>
                    <TableCell>Motivo</TableCell>
                    <TableCell>Observación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movimientos.map((movimiento) => (
                    <TableRow key={movimiento.idInventario || movimiento.idInventarioProducto} hover>
                      <TableCell>{formatearFecha(movimiento.fechaMovimiento)}</TableCell>
                      <TableCell>
                        {valorTab === "materiasprimas"
                          ? movimiento.materiaPrima?.nombreMateriaPrima || "N/A"
                          : movimiento.producto?.nombreProducto || "N/A"}
                      </TableCell>
                      <TableCell align="center">{renderizarTipoMovimiento(movimiento.tipoMovimiento)}</TableCell>
                      <TableCell align="right">{formatearNumero(movimiento.cantidad)}</TableCell>
                      <TableCell align="right">{formatearNumero(movimiento.stockAntes)}</TableCell>
                      <TableCell align="right">{formatearNumero(movimiento.stockDespues)}</TableCell>
                      <TableCell>{movimiento.motivo || "-"}</TableCell>
                      <TableCell>{formatearObservacion(movimiento.observacion) || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={totalRegistros}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
          />
        </>
      )}
    </Container>
  )
}