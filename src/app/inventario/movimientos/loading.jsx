import { Box, CircularProgress, Container } from "@mui/material"
import InventarioNav from "@/src/components/inventario-nav"

export default function Loading() {
  return (
    <Container maxWidth="xl">
      <InventarioNav activeTab="movimientos" />
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    </Container>
  )
}
