import { Box, Container, Typography, Button } from '@mui/material';
import ListaPedidos from "../../components/pedidos/ListaPedidos"
import Link from "next/link"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"

export const metadata = {
  title: "Gestión de Pedidos",
  description: "Sistema de gestión de pedidos",
}

export default function PedidosPage() {
  return (
    <Container maxWidth="xl">
      <Button component={Link} href="/dashboard" variant="outlined" sx={{ mr: 2 }} startIcon={<ArrowBackIcon />}>
                  Volver a Gestión
                </Button>
      <Box sx={{ py: 4 }}>
      <ListaPedidos />
    </Box>
    </Container>
  )
}
