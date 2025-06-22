'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Snackbar, Stack, Alert
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function NotasCreditoPage() {
    const searchParams = useSearchParams()
    const [notas, setNotas] = useState([])
    const [loading, setLoading] = useState(false)
    const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' })
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [busquedaRealizada, setBusquedaRealizada] = useState(false)
    const pageSize = 10
    
    // Filtros
    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        cliente: '',
        facturaOrigen: ''
    })

    const formatNroFactura = nro => nro ? `001-001-${String(nro).padStart(7, "0")}` : "-"
    
    function formatFecha(fechaStr) {
        if (!fechaStr) return ""
        // Si viene con hora, corta solo la parte de la fecha
        const soloFecha = fechaStr.split("T")[0]
        const [y, m, d] = soloFecha.split("-")
        if (y && m && d) return `${d}/${m}/${y}`
        return fechaStr
    }

    const fetchNotas = async (params = {}) => {
        setLoading(true)
        const query = new URLSearchParams({
            ...(params.fechaDesde ? { fechaDesde: params.fechaDesde } : {}),
            ...(params.fechaHasta ? { fechaHasta: params.fechaHasta } : {}),
            ...(params.cliente ? { cliente: params.cliente } : {}),
            ...(params.facturaOrigen ? { facturaOrigen: params.facturaOrigen } : {}),
            page: params.page || 1,
            limit: pageSize
        }).toString()
        
        try {
            const res = await fetch(`/api/finanzas/notas-credito?${query}`)
            const data = await res.json()
            
            if (data.success) {
                setNotas(data.data || [])
                setTotal(data.meta?.total || 0)
                setPage(data.meta?.page || 1)
            } else {
                setSnackbar({ abierto: true, mensaje: 'Error al cargar las notas', tipo: 'error' })
            }
        } catch (error) {
            console.error('Error:', error)
            setSnackbar({ abierto: true, mensaje: 'Error al cargar las notas', tipo: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = e => {
        e.preventDefault()
        setBusquedaRealizada(true)
        fetchNotas({ 
            ...filtros, 
            page: 1 
        })
    }

    const handleMostrarTodo = () => {
        setBusquedaRealizada(true)
        setFiltros({
            fechaDesde: '',
            fechaHasta: '',
            cliente: '',
            facturaOrigen: ''
        })
        fetchNotas({ page: 1 })
    }

    const handleLimpiarFiltros = () => {
        setFiltros({
            fechaDesde: '',
            fechaHasta: '',
            cliente: '',
            facturaOrigen: ''
        })
        setBusquedaRealizada(false)
        setNotas([])
        setTotal(0)
        setPage(1)
    }

    const handlePageChange = newPage => {
        if (busquedaRealizada) {
            fetchNotas({ 
                ...filtros, 
                page: newPage 
            })
        }
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Button component={Link} href="/finanzas" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 3 }}>
                Volver a Finanzas
            </Button>
            <Typography variant="h4" gutterBottom>Notas de Crédito</Typography>
            
            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Filtros de Búsqueda</Typography>
                <form onSubmit={handleSearch}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <TextField
                            label="Fecha Desde"
                            type="date"
                            size="small"
                            value={filtros.fechaDesde}
                            onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Fecha Hasta"
                            type="date"
                            size="small"
                            value={filtros.fechaHasta}
                            onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Cliente"
                            size="small"
                            value={filtros.cliente}
                            onChange={(e) => setFiltros({ ...filtros, cliente: e.target.value })}
                            placeholder="Nombre del cliente"
                        />
                        <TextField
                            label="Factura Origen"
                            size="small"
                            value={filtros.facturaOrigen}
                            onChange={(e) => {
                                const valor = e.target.value;
                                // Extraer solo los números del final del formato 001-001-0000016
                                const match = valor.match(/(\d+)$/);
                                const numeroExtraido = match ? match[1] : '';
                                setFiltros({ ...filtros, facturaOrigen: numeroExtraido });
                            }}
                            placeholder="0000001"
                            helperText="Ingrese el número de factura(últimos 7 dígitos)"
                        />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <Button 
                            type="submit" 
                            variant="contained" 
                            startIcon={<SearchIcon />}
                            disabled={loading}
                        >
                            Buscar
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleMostrarTodo}
                            disabled={loading}
                        >
                            Mostrar Todo
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={handleLimpiarFiltros}
                            disabled={loading}
                        >
                            Limpiar Filtros
                        </Button>
                    </Stack>
                </form>
            </Paper>

            {/* Mensaje inicial */}
            {!busquedaRealizada && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Utilice los filtros de búsqueda para encontrar las notas de crédito que desea consultar.
                </Alert>
            )}

            {/* Tabla */}
            {busquedaRealizada && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Número</TableCell>
                                <TableCell>Fecha Emisión</TableCell>
                                <TableCell>Factura Origen</TableCell>
                                <TableCell>Cliente</TableCell>
                                <TableCell>Motivo</TableCell>
                                <TableCell>Monto Total</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Cargando...</TableCell>
                                </TableRow>
                            ) : notas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">No hay notas encontradas con los criterios seleccionados</TableCell>
                                </TableRow>
                            ) : (
                                notas.map(nota => (
                                    <TableRow key={nota.idNota}>
                                        <TableCell>{nota.idNota}</TableCell>
                                        <TableCell>{nota.nroNota}</TableCell>
                                        <TableCell>{formatFecha(nota.fechaEmision)}</TableCell>
                                        <TableCell>{formatNroFactura(nota.idFacturaOrigen)}</TableCell>
                                        <TableCell>{nota.cliente?.nombre || 'N/A'}</TableCell>
                                        <TableCell>{nota.motivo}</TableCell>
                                        <TableCell>
                                            {'₲ ' + nota.montoTotal.toLocaleString('es-PY')}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Paginación */}
            {busquedaRealizada && total > pageSize && (
                <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
                    <IconButton
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                    >
                        <ArrowBackIosIcon />
                    </IconButton>
                    <Typography>Página {page} de {Math.ceil(total / pageSize)}</Typography>
                    <IconButton
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= Math.ceil(total / pageSize)}
                    >
                        <ArrowForwardIosIcon />
                    </IconButton>
                </Stack>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.abierto}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, abierto: false })}
                message={snackbar.mensaje}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Container>
    )
} 