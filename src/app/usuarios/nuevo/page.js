import FormularioUsuario from "../../../components/usuarios/FormularioUsuario"

export const metadata = {
  title: "Crear Usuario",
  description: "Formulario para crear un nuevo usuario",
}

export default function NuevoUsuarioPage() {
  return (
    <div>
      <h1>Crear Nuevo Usuario</h1>
      <FormularioUsuario />
    </div>
  );
}

