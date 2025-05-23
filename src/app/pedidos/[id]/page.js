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
    <div>
      <h1>Detalle de Pedido</h1>
      <DetallePedido id={id} />
    </div>
  )
}
