import FormularioPedido from "../../../components/pedidos/FormularioPedido"

export const metadata = {
  title: "Nuevo Pedido",
  description: "Formulario para crear un nuevo pedido",
}

export default function NuevoPedidoPage() {
  return (
    <div>
      <h1>Crear Nuevo Pedido</h1>
      <FormularioPedido />
    </div>
  )
}
