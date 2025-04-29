import ListaPedidos from "../../components/pedidos/ListaPedidos"

export const metadata = {
  title: "Gestión de Pedidos",
  description: "Sistema de gestión de pedidos",
}

export default function PedidosPage() {
  return (
    <div>
      <h1>Gestión de Pedidos</h1>
      <ListaPedidos />
    </div>
  )
}
