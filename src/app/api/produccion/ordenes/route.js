// app/api/produccion/ordenes/route.js
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
    const idPedido = searchParams.get('idPedido');
    
    let whereClause = {};
    
    if (idPedido) {
      whereClause.idPedido = parseInt(idPedido);
    }
    
    const ordenesProduccion = await prisma.ordenProduccion.findMany({
      where: {
        ...whereClause,
        deletedAt: null
      },
      include: {
        estadoOrdenProd: true,
        pedidoCliente: {
          include: {
            cliente: {
              include: {
                persona: true
              }
            }
          }
        },
        usuario: {
          include: {
            persona: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Formatear datos para la respuesta
    const ordenesFormateadas = ordenesProduccion.map(orden => ({
      ...orden,
      operadorNombre: orden.usuario?.persona ? 
        `${orden.usuario.persona.nombre} ${orden.usuario.persona.apellido}` : 
        `Usuario ID: ${orden.operadorEncargado}`,
      clienteNombre: orden.pedidoCliente?.cliente?.persona ? 
        `${orden.pedidoCliente.cliente.persona.nombre} ${orden.pedidoCliente.cliente.persona.apellido}` : 
        `Cliente ID: ${orden.pedidoCliente?.idCliente || 'Desconocido'}`
    }));

    return NextResponse.json(ordenesFormateadas);
  } catch (error) {
    console.error("Error al obtener órdenes de producción:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}