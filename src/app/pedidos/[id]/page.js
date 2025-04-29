import DetallePedido from "../../../components/pedidos/DetallePedido"

export const metadata = {
  title: "Detalle de Pedido",
  description: "Visualización detallada de un pedido",
}

export default function DetallePedidoPage({ params }) {
  return (
    <div>
      <h1>Detalle de Pedido</h1>
      <DetallePedido id={params.id} />
    </div>
  )
}
