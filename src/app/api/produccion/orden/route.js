// app/api/produccion/orden/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import AuthController from "@/src/backend/controllers/auth-controller";
import AuditoriaService from "@/src/backend/services/auditoria-service";

export async function POST(request) {
  try {
    // Verificar autenticación usando los métodos correctos
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    let idUsuario = 1; // Usuario por defecto para desarrollo
    
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Si hay token, obtener el usuario
    if (token) {
      const userData = await authController.getUserFromToken(token);
      if (userData) {
        idUsuario = userData.idUsuario;
      }
    }

    const { idPedido, operadorEncargado, fechaInicioProd, fechaFinProd } = await request.json();
    
    if (!idPedido || !operadorEncargado) {
      return NextResponse.json(
        { error: "Se requieren idPedido y operadorEncargado" },
        { status: 400 }
      );
    }

    // Verificar si el pedido existe
    const pedido = await prisma.pedidoCliente.findUnique({
      where: { idPedido }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Verificar stock antes de crear la orden
    const verificacionStockRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pedidos/verificar-stock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idPedido })
    });
    
    if (!verificacionStockRes.ok) {
      const errorData = await verificacionStockRes.json();
      return NextResponse.json({
        error: errorData.error || "Error al verificar stock"
      }, { status: 400 });
    }
    
    const verificacionStock = await verificacionStockRes.json();

    if (!verificacionStock.stockSuficiente) {
      return NextResponse.json({
        error: "Stock insuficiente para iniciar producción",
        materialesFaltantes: verificacionStock.materialesFaltantes
      }, { status: 400 });
    }

    // Buscar el ID del estado "PENDIENTE" para órdenes de producción
    const estadoPendiente = await prisma.estadoOrdenProd.findFirst({
      where: { descEstadoOrdenProd: "PENDIENTE" }
    });

    if (!estadoPendiente) {
      return NextResponse.json(
        { error: "No se encontró el estado PENDIENTE para órdenes de producción" },
        { status: 500 }
      );
    }

    // Crear la orden de producción
    const ordenProduccion = await prisma.$transaction(async (prisma) => {
      // 1. Crear la orden de producción
      const orden = await prisma.ordenProduccion.create({
        data: {
          idPedido,
          operadorEncargado,
          fechaInicioProd: fechaInicioProd ? new Date(fechaInicioProd) : new Date(),
          fechaFinProd: fechaFinProd ? new Date(fechaFinProd) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días después por defecto
          idEstadoOrdenProd: estadoPendiente.idEstadoOrdenProd
        }
      });
      
      // 2. Actualizar el estado del pedido a "EN PRODUCCIÓN"
      const estadoEnProduccion = await prisma.estadoPedido.findFirst({
        where: { descEstadoPedido: "EN PRODUCCION" }
      });

      if (estadoEnProduccion) {
        await prisma.pedidoCliente.update({
          where: { idPedido },
          data: { idEstadoPedido: estadoEnProduccion.idEstadoPedido }
        });
      }
      
      return orden;
    });

    // Registrar en auditoría
    const auditoriaService = new AuditoriaService();
    await auditoriaService.registrarCreacion(
      "OrdenProduccion",
      ordenProduccion.idOrdenProduccion,
      ordenProduccion,
      idUsuario
    );

    return NextResponse.json({
      mensaje: "Orden de producción creada exitosamente",
      ordenProduccion
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear orden de producción:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}