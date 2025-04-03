"use client"; // Asegura que este componente se ejecute en el cliente

import { useParams } from "next/navigation";
import FormularioUsuario from "../../../../components/usuarios/FormularioUsuario";

// Importa el metadata desde el archivo del servidor
import { metadata } from "./metadata";

export default function EditarUsuarioPage() {
  const params = useParams();
  const id = params?.id;

  return (
    <div>
      <h1>{metadata.title}</h1>
      {id ? <FormularioUsuario id={id} /> : <p>Cargando...</p>}
    </div>
  );
}
