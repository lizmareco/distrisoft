import { Box, Container, Typography } from '@mui/material';
import ListaPedidos from "../../components/pedidos/ListaPedidos"

export const metadata = {
  title: "Gestión de Pedidos",
  description: "Sistema de gestión de pedidos",
}

export default function PedidosPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
      <ListaPedidos />
    </Box>
    </Container>
  )
}
