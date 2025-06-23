"use client"

import React from "react"
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
} from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import Link from "next/link"
import FacturasOrdenCompra from "@/src/components/facturas/FacturasOrdenCompra"

export default function FacturasOrdenCompraPage({ params }) {
  const resolvedParams = React.use(params)
  const { id } = resolvedParams

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Button 
        component={Link} 
        href="/ordenes-compra" 
        startIcon={<ArrowBack />} 
        variant="outlined" 
        sx={{ mb: 3 }}
      >
        Volver a Órdenes de Compra
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Facturas de la Orden de Compra #{id}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aquí puedes ver todas las facturas de proveedor asociadas a esta orden de compra, 
          incluyendo detalles, pagos realizados y estado de cuentas.
        </Typography>
      </Paper>

      <FacturasOrdenCompra idOrdenCompra={Number(id)} />
    </Container>
  )
} 