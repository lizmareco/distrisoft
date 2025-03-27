"use client"

import { Container, Typography, Grid, Paper, Box, Button } from "@mui/material"
import PeopleIcon from "@mui/icons-material/People"
import BusinessIcon from "@mui/icons-material/Business"
import LocalShippingIcon from "@mui/icons-material/LocalShipping"
import PersonIcon from "@mui/icons-material/Person"
import Link from "next/link"

export default function GestionPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Gestión de Entidades
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6} lg={3}>
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
            <PersonIcon sx={{ fontSize: 60, color: "success.main", mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Gestión de Personas
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Administre las personas del sistema. Visualice, registre y modifique la información personal.
            </Typography>
            <Box sx={{ mt: "auto", pt: 2 }}>
              <Button variant="contained" color="success" size="large" component={Link} href="/personas" fullWidth>
                Acceder
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
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
            <PeopleIcon sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Gestión de Clientes
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Administre los clientes del sistema. Visualice, registre y modifique la información de los clientes.
            </Typography>
            <Box sx={{ mt: "auto", pt: 2 }}>
              <Button variant="contained" color="primary" size="large" component={Link} href="/clientes" fullWidth>
                Acceder
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
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
            <BusinessIcon sx={{ fontSize: 60, color: "secondary.main", mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Gestión de Empresas
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Administre las empresas del sistema. Visualice, registre y modifique la información de las empresas.
            </Typography>
            <Box sx={{ mt: "auto", pt: 2 }}>
              <Button variant="contained" color="secondary" size="large" component={Link} href="/empresas" fullWidth>
                Acceder
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6} lg={3}>
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
            <LocalShippingIcon sx={{ fontSize: 60, color: "info.main", mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Gestión de Proveedores
            </Typography>
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Administre los proveedores del sistema. Visualice, registre y modifique la información de los proveedores.
            </Typography>
            <Box sx={{ mt: "auto", pt: 2 }}>
              <Button variant="contained" color="info" size="large" component={Link} href="/proveedores" fullWidth>
                Acceder
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

