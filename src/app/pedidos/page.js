import { Box, Container, Typography } from '@mui/material';
import ListaPedidos from "../../components/pedidos/ListaPedidos"
import Link from "next/link"
import { ArrowBack } from "@mui/icons-material"
import { Button } from "@mui/material"

export const metadata = {
  title: "Gestión de Pedidos",
  description: "Sistema de gestión de pedidos",
}

export default function PedidosPage() {
  return (
    <Container maxWidth="xl">
        <Button component={Link} href="/dashboard" startIcon={<ArrowBack />} variant="outlined" sx={{ mr: 2 }}>
          Volver a Gestión
        </Button>
      <Box sx={{ py: 4 }}>
      <ListaPedidos />
    </Box>
    </Container>
  )
}
