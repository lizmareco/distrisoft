'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Container, Typography, Card, CardContent, Grid,
    TextField, Button, CircularProgress, Snackbar, IconButton
} from '@mui/material'
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import Link from 'next/link'

const IMPUESTO_PORCENTAJE = 0.10
const IMPUESTO_ID = 2 // según tu modelo

export default function NuevaNotaDebito() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nroFactura = searchParams.get('nroFactura')
    const nroFacturaFormateado = nroFactura ? `001-001-${String(nroFactura).padStart(7, "0")}` : "-"

    const [motivo, setMotivo] = useState('')
    const [conceptos, setConceptos] = useState([
        { descripcion: '', cantidad: 1, precio_unitario: 0 }
    ])
    const [guardando, setGuardando] = useState(false)
    const [snackbar, setSnackbar] = useState({ abierto: false, mensaje: '', tipo: 'success' })

    // Simula usuario actual (reemplaza por tu auth real)
    const usuario_emisor = "usuario_demo"

    const handleConceptoChange = (idx, field, value) => {
        setConceptos(conceptos =>
            conceptos.map((c, i) => i === idx ? { ...c, [field]: value } : c)
        )
    }

    const handleAddConcepto = () => {
        setConceptos([...conceptos, { descripcion: '', cantidad: 1, precio_unitario: 0 }])
    }

    const handleRemoveConcepto = idx => {
        setConceptos(conceptos => conceptos.filter((_, i) => i !== idx))
    }

    // Cálculos
    const conceptosCalculados = conceptos.map(c => {
        const cantidad = Number(c.cantidad) || 0
        const precio_unitario = Number(c.precio_unitario) || 0
        const subtotal = cantidad * precio_unitario
        const monto_impuesto = subtotal * IMPUESTO_PORCENTAJE
        const total_item = subtotal + monto_impuesto
        return { ...c, cantidad, precio_unitario, subtotal, monto_impuesto, total_item }
    })
    const monto_total = conceptosCalculados.reduce((sum, c) => sum + c.total_item, 0)

    const handleSubmit = async e => {
        e.preventDefault()
        setGuardando(true)
        try {
            if (!motivo.trim() || conceptosCalculados.length === 0 || conceptosCalculados.some(c => !c.descripcion || c.cantidad <= 0 || c.precio_unitario <= 0)) {
                setSnackbar({ abierto: true, mensaje: "Completa todos los campos de los conceptos y el motivo.", tipo: "error" })
                setGuardando(false)
                return
            }
            const detalles = conceptosCalculados.map(c => ({
                concepto: c.descripcion,
                cantidad: c.cantidad,
                precio_unitario: c.precio_unitario,
                subtotal: c.subtotal,
                id_impuesto: 2, // 10%
                monto_impuesto: c.monto_impuesto,
                total_item: c.total_item
            }))

            const body = {
                id_factura_origen: Number(nroFactura),
                motivo,
                monto_total,
                usuario_emisor,
                id_estado: 1,
                detalles
            }
            const res = await fetch('/api/finanzas/notas-debito', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id_factura_origen: nroFactura,
                    motivo,
                    monto_total,
                    usuario_emisor,
                    detalles: conceptosCalculados.map(c => ({
                        concepto: c.descripcion,
                        cantidad: c.cantidad,
                        precio_unitario: c.precio_unitario,
                        subtotal: c.subtotal,
                        monto_impuesto: c.monto_impuesto,
                        total_item: c.total_item,
                        id_impuesto: IMPUESTO_ID
                    })),
                    id_estado: 1 // o el estado inicial que corresponda
                })
            })
            if (!res.ok) throw new Error("Error al guardar")
            setSnackbar({ abierto: true, mensaje: "Nota de débito guardada correctamente.", tipo: "success" })
            setTimeout(() => router.push('/finanzas/notas-debito'), 1200)
        } catch (err) {
            setSnackbar({ abierto: true, mensaje: err.message, tipo: "error" })
        }
        setGuardando(false)
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Button component={Link} href="/finanzas/notas-debito" startIcon={<ArrowBackIcon />}>
                Volver
            </Button>
            <Typography variant="h4" gutterBottom>Nueva Nota de Débito</Typography>
            <Card>
                <CardContent>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1">Factura Origen: <b>{nroFacturaFormateado}</b></Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Motivo"
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                    fullWidth
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Conceptos:</Typography>
                                {conceptosCalculados.map((c, idx) => (
                                    <Grid container spacing={1} alignItems="center" key={idx} sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                                        <Grid item xs={4}>
                                            <TextField
                                                label="Descripción"
                                                value={c.descripcion}
                                                onChange={e => handleConceptoChange(idx, "descripcion", e.target.value)}
                                                required
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField
                                                label="Cantidad"
                                                type="number"
                                                value={c.cantidad}
                                                onChange={e => handleConceptoChange(idx, "cantidad", e.target.value)}
                                                inputProps={{ min: 1 }}
                                                required
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={2}>
                                            <TextField
                                                label="Precio Unitario"
                                                type="number"
                                                value={c.precio_unitario}
                                                onChange={e => handleConceptoChange(idx, "precio_unitario", e.target.value)}
                                                inputProps={{ min: 0 }}
                                                required
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                {c.subtotal.toLocaleString()}<br /><small>Subtotal</small>
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                {c.monto_impuesto.toLocaleString()}<br /><small>IVA</small>
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <Typography variant="body2" color="text.secondary" align="center">
                                                {c.total_item.toLocaleString()}<br /><small>Total</small>
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={1}>
                                            <IconButton color="error" onClick={() => handleRemoveConcepto(idx)} disabled={conceptos.length === 1}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}
                                <Button startIcon={<AddIcon />} onClick={handleAddConcepto} sx={{ mt: 1 }}>
                                    Agregar Concepto
                                </Button>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="h6" align="right">
                                    Monto Total: <b>{monto_total.toLocaleString()}</b>
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" disabled={guardando}>
                                    {guardando ? <CircularProgress size={24} /> : "Guardar Nota de Débito"}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
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