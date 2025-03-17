import RolController from "@/backend/controllers/rol-controller";

const rolController = new RolController();

export async function GET(req) {
  try {
    const roles = await rolController.getAllRoles();
    return new Response(JSON.stringify(roles), { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/rol:", error);
    return new Response(
      JSON.stringify({ message: "Error al obtener los roles." }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // Se espera que el body tenga { roleData: {...}, permissionIds: [1,2,...] }
    const { roleData, permissionIds } = await req.json();
    const newRole = await rolController.createRole(roleData, permissionIds);
    return new Response(JSON.stringify(newRole), { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/rol:", error);
    return new Response(
      JSON.stringify({ message: "Error al crear el rol." }),
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    /* 
      Se espera que el body tenga:
      {
        id,               // ID del rol a actualizar
        roleData,         // Datos para actualizar (opcional)
        permissionIdsToAdd,    // Arreglo de IDs de permisos a agregar (opcional)
        permissionIdsToRemove  // Arreglo de IDs de permisos a quitar (opcional)
      }
    */
    const {
      id,
      roleData,
      permissionIdsToAdd,
      permissionIdsToRemove,
    } = await req.json();

    // Actualizar datos básicos del rol (si se proporcionan)
    let updatedRole = null;
    if (roleData) {
      updatedRole = await rolController.updateRole(id, roleData);
    }

    // Agregar nuevos permisos
    let addedPermissions = [];
    if (permissionIdsToAdd && permissionIdsToAdd.length > 0) {
      for (const permId of permissionIdsToAdd) {
        const assignment = await rolController.assignPermission(id, permId);
        addedPermissions.push(assignment);
      }
    }

    // Quitar permisos existentes
    let removedPermissions = [];
    if (permissionIdsToRemove && permissionIdsToRemove.length > 0) {
      for (const permId of permissionIdsToRemove) {
        // IMPORTANTE: Asegúrate de tener implementado el método removePermission
        const removal = await rolController.removePermission(id, permId);
        removedPermissions.push(removal);
      }
    }

    // Opcional: Obtener el rol actualizado
    const finalRole = await rolController.getRole(id);

    return new Response(
      JSON.stringify({
        updatedRole,
        addedPermissions,
        removedPermissions,
        finalRole,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en PATCH /api/rol:", error);
    return new Response(
      JSON.stringify({ message: "Error al actualizar el rol." }),
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    // Se espera que se envíe { id } en el body para identificar el rol a eliminar
    const { id } = await req.json();
    const deletedRole = await rolController.deleteRole(id);
    return new Response(JSON.stringify(deletedRole), { status: 200 });
  } catch (error) {
    console.error("Error en DELETE /api/rol:", error);
    return new Response(
      JSON.stringify({ message: "Error al eliminar el rol." }),
      { status: 500 }
    );
  }
}
