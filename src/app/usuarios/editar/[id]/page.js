import FormularioUsuario from "../../../../components/usuarios/FormularioUsuario"

export const metadata = {
  title: "Editar Usuario",
  description: "Formulario para editar un usuario existente",
}

export default function EditarUsuarioPage({ params }) {
  return (
    <div>
      <h1>Editar Usuario</h1>
      <FormularioUsuario id={params.id} />
    </div>
  )
}

