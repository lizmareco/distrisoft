import ListaUsuarios from "../../components/usuarios/ListaUsuarios"

export const metadata = {
  title: "Gestión de Usuarios",
  description: "Sistema de gestión de usuarios",
}

export default function UsuariosPage() {
  return (
    <div>
      <h1>Gestión de Usuarios</h1>
      <ListaUsuarios />
    </div>
  );
}

