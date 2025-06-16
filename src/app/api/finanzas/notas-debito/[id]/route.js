import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()



// Anular una nota de débito (soft delete: marca como anulada)
export async function PATCH(request, { params }) {
  const { id } = await params; // <-- importante, await aquí

  if (!id) {
    console.warn('PATCH llamado sin ID:', params);
    return Response.json({ error: 'ID no proporcionado' }, { status: 400 });
  }

  try {
    const nota = await prisma.notaDebito.update({
      where: { id_notadb: Number(id) },
      data: {
        id_estado: 3,
        deleted_at: new Date()
      }
    });
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error al anular nota:", error);
    return Response.json({ error: error.message }, { status: 400 });
  }
}
