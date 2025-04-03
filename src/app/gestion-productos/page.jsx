"use client"

import { Container, Typography, Grid, Paper, Box, Button } from "@mui/material"
import { Inventory, Category } from "@mui/icons-material"
import Link from "next/link"

export default function GestionProductosPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Gestión de Productos y Materias Primas
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <Inventory sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Gestión de Materias Primas
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Administre el inventario de materias primas. Visualice, registre y modifique la información de stock,
              unidades de medida y estados de las materias primas.
            </Typography>
            <Box sx={{ mt: "auto", pt: 2, width: "100%" }}>
              <Button variant="contained" color="primary" size="large" component={Link} href="/materiaprima" fullWidth>
                Acceder
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 6,
              },
            }}
          >
            <Category sx={{ fontSize: 80, color: "secondary.main", mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Gestión de Productos
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Administre el catálogo de productos. Visualice, registre y modifique la información de precios, tipos,
              pesos y estados de los productos.
            </Typography>
            <Box sx={{ mt: "auto", pt: 2, width: "100%" }}>
              <Button variant="contained" color="secondary" size="large" component={Link} href="/producto" fullWidth>
                Acceder
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

