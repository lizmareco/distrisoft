'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Snackbar, Stack
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

export default function NotasDebitoPage() {
    const searchParams = useSearchParams()
    const [notas, setNotas] = useState([])
    const [idFactura, setIdFactura] = useState('')
    const [loading, setLoading] = useState(false)
    const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' })
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const pageSize = 10
    const formatNroFactura = nro => nro ? `001-001-${String(nro).padStart(7, "0")}` : "-"
    function formatFecha(fechaStr) {
        if (!fechaStr) return ""
        // Si viene con hora, corta solo la parte de la fecha
        const soloFecha = fechaStr.split("T")[0]
        const [y, m, d] = soloFecha.split("-")
        if (y && m && d) return `${d}/${m}/${y}`
        return fechaStr
    }
    const [mostrarAnuladas, setMostrarAnuladas] = useState(false)

    const fetchNotas = async (params = {}) => {
        setLoading(true)
        const query = new URLSearchParams({
            ...(params.id_factura_origen ? { id_factura_origen: params.id_factura_origen } : {}),
            page: params.page || 1,
            ...(params.anuladas ? { anuladas: '1' } : {})
        }).toString()
        const res = await fetch(`/api/finanzas/notas-debito?${query}`)
        const data = await res.json()
        setNotas(data.notas || [])
        setTotal(data.total || 0)
        setPage(data.page || 1)
        setLoading(false)
    }

    const handleListAnuladas = () => {
        setMostrarAnuladas(true)
        fetchNotas({ page: 1, anuladas: true })
    }

    const handleListNoAnuladas = () => {
        setMostrarAnuladas(false)
        fetchNotas({ page: 1 })
    }
    const handleAnular = async (nota) => {
        console.log('Objeto nota recibido:', nota)
        if (!nota.id_notadb) {
            alert('ID de nota no válido')
            return
        }
        
        if (!confirm('¿Está seguro de que desea anular esta nota de débito?')) {
            return
        }
        
        const res = await fetch(`/api/finanzas/notas-debito/${nota.id_notadb}`, {
            method: 'PATCH'
        });
        if (res.ok) {
            setSnackbar({ abierto: true, mensaje: 'Nota anulada correctamente', tipo: 'success' })
            // Recargar la lista actual
            fetchNotas({ 
                id_factura_origen: idFactura, 
                page: page,
                anuladas: mostrarAnuladas ? '1' : undefined
            })
        } else {
            setSnackbar({ abierto: true, mensaje: 'Error al anular la nota', tipo: 'error' })
        }
    }

    useEffect(() => { 
        // Verificar si hay parámetros en la URL
        const idFacturaFromURL = searchParams.get('id_factura_origen')
        if (idFacturaFromURL) {
            setIdFactura(idFacturaFromURL)
            fetchNotas({ id_factura_origen: idFacturaFromURL, page: 1 })
        } else {
            fetchNotas({ page: 1 })
        }
    }, [searchParams])

    const handleSearch = e => {
        e.preventDefault()
        fetchNotas({ id_factura_origen: idFactura, page: 1 })
    }

    const handleListAll = () => {
        setIdFactura('')
        fetchNotas({ page: 1 })
    }

    const handlePageChange = newPage => {
        fetchNotas({ id_factura_origen: idFactura, page: newPage })
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Button component={Link} href="/finanzas" startIcon={<ArrowBackIcon />} variant="outlined" sx={{ mb: 3 }}>
                Volver a Finanzas
            </Button>
            <Typography variant="h4" gutterBottom>Notas de Débito</Typography>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <TextField
                    label="Buscar por ID Factura"
                    value={idFactura}
                    onChange={e => setIdFactura(e.target.value.replace(/\D/g, ''))}
                    size="small"
                />
                <Button type="submit" variant="contained" startIcon={<SearchIcon />}>Buscar</Button>
                <Button variant="outlined" onClick={handleListNoAnuladas}>Listar Vigentes</Button>
                <Button variant="contained" color="error" onClick={handleListAnuladas}>Listar Anuladas</Button>
            </form>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Factura</TableCell>
                            <TableCell>Motivo</TableCell>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Monto Total</TableCell>
                            <TableCell>Estado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {notas.map(nota => (
                            <TableRow key={nota.id_notadb}>
                                <TableCell>{nota.id_notadb}</TableCell>
                                <TableCell>{formatFecha(nota.fecha_emision)}</TableCell>
                                <TableCell>{formatNroFactura(nota.id_factura_origen)}</TableCell>
                                <TableCell>{nota.motivo}</TableCell>
                                <TableCell>{nota.usuario_emisor}</TableCell>
                                <TableCell>
                                    {'₲ ' + nota.monto_total.toLocaleString('es-PY')}
                                </TableCell>
                                <TableCell>
                                    {nota.deleted_at ? 'Anulada' : 'Vigente'}
                                </TableCell>
                                <TableCell>
                                    {!nota.deleted_at && (
                                        <IconButton color="error" onClick={() => handleAnular(nota)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {notas.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No hay notas encontradas</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
                <IconButton
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ArrowBackIosIcon />
                </IconButton>
                <Typography>Página {page} de {Math.ceil(total / pageSize) || 1}</Typography>
                <IconButton
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                >
                    <ArrowForwardIosIcon />
                </IconButton>
            </Stack>
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