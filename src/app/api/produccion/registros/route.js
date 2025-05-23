// app/api/produccion/registros/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import AuthController from "@/src/backend/controllers/auth-controller";

export async function GET(request) {
  try {
    // Verificar autenticación usando los métodos correctos
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idOrdenProduccion = searchParams.get('idOrdenProduccion');
    const idProducto = searchParams.get('idProducto');
    
    let whereClause = {};
    
    // Filtrar por orden de producción indirectamente a través de inventarioProducto
    if (idOrdenProduccion) {
      // Primero obtenemos los movimientos de inventario asociados a esta orden
      const movimientos = await prisma.inventarioProducto.findMany({
        where: {
          idOrdenProduccion: parseInt(idOrdenProduccion)
        }
      });
      
      // Extraemos los IDs de producción de las observaciones
      const idsProduccion = movimientos
        .map(m => {
          const match = m.observacion?.match(/Producción #(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(id => id !== null);
      
      if (idsProduccion.length > 0) {
        whereClause.idProduccion = { in: idsProduccion };
      } else {
        // Si no hay movimientos asociados, devolver array vacío
        return NextResponse.json([]);
      }
    }
    
    if (idProducto) {
      whereClause.idProducto = parseInt(idProducto);
    }
    
    const producciones = await prisma.produccion.findMany({
      where: {
        ...whereClause,
        deletedAt: null
      },
      include: {
        formula: true,
        producto: true,
        usuario: {
          include: {
            persona: true
          }
        }
      },
      orderBy: {
        fechaProduccion: 'desc'
      }
    });

    return NextResponse.json(producciones);
  } catch (error) {
    console.error("Error al obtener registros de producción:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}