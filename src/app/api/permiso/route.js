import PermisoController from "@/backend/controllers/permiso-controller";

const permisoController = new PermisoController();

export async function GET(req) {
    try {
        const permisos = await permisoController.getAllPermisos();
        return new Response(JSON.stringify(permisos), { status: 200 });
    } catch (error) {
        console.error("Error en GET /api/permiso:", error);
        return new Response(JSON.stringify({ message: "Error al obtener los permisos." }), { status: 500 });
    }
}

