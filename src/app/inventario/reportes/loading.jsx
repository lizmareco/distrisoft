import { Box, CircularProgress, Container, Typography } from "@mui/material"

export default function Loading() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Generando reporte de inventario...
        </Typography>
      </Box>
    </Container>
  )
}
