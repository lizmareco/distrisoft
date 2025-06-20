'use client'

import React from 'react'
import {
    Container, Typography, Grid, Card, CardContent, Button, Box
} from '@mui/material'
import Link from 'next/link'
import { ArrowBack } from '@mui/icons-material'
import AddIcon from '@mui/icons-material/Add'
import SearchIcon from '@mui/icons-material/Search'
import ReceiptIcon from '@mui/icons-material/Receipt'

export default function NotasDebitoPage() {
    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Button component={Link} href="/finanzas" startIcon={<ArrowBack />} variant="outlined" sx={{ mb: 3 }}>
                Volver a Finanzas
            </Button>
            
            <Typography variant="h4" gutterBottom>
                Gestión de Notas de Débito
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                <AddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Crear Nueva Nota de Débito
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Genera una nueva nota de débito para una factura específica
                                </Typography>
                                <Button
                                    component={Link}
                                    href="/finanzas/notas-debito/nueva"
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    Crear Nota de Débito
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                <SearchIcon sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Buscar Notas de Débito
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Consulta y gestiona las notas de débito existentes
                                </Typography>
                                <Button
                                    component={Link}
                                    href="/finanzas/notas-debito/buscar"
                                    variant="contained"
                                    color="secondary"
                                    startIcon={<SearchIcon />}
                                    fullWidth
                                >
                                    Buscar Notas
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                                <ReceiptIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Ver Facturas
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Regresa a la gestión de facturas para crear notas desde ahí
                                </Typography>
                                <Button
                                    component={Link}
                                    href="/finanzas"
                                    variant="contained"
                                    color="success"
                                    startIcon={<ReceiptIcon />}
                                    fullWidth
                                >
                                    Ir a Facturas
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    )
} 