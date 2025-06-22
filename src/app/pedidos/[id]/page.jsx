import { Container, Box } from '@mui/material';
import DetallePedido from "../../../components/pedidos/DetallePedido"

export const metadata = {
  title: "Detalle de Pedido",
  description: "Visualización detallada de un pedido",
}

// Convertimos la función a async para poder usar await con params
export default async function DetallePedidoPage({ params }) {
  // Esperamos a que params esté disponible y luego accedemos a id
  const id = params ? params.id : ""

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <DetallePedido id={id} />
      </Box>
    </Container>
  )
}
