// app/api/produccion/registrar/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import AuthController from "@/src/backend/controllers/auth-controller";
import AuditoriaService from "@/src/backend/services/auditoria-service";

export async function POST(request) {
  try {
    // Verificar autenticación
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    let userData = null;
    
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Si hay token, obtener el usuario
    if (token) {
      userData = await authController.getUserFromToken(token);
      if (!userData) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
    }

    const { idOrdenProduccion, idFormula, idProducto, cantidadProducida, observaciones } = await request.json();
    
    if (!idOrdenProduccion || !idFormula || !idProducto || !cantidadProducida) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar si la orden de producción existe
    const ordenProduccion = await prisma.ordenProduccion.findUnique({
      where: { idOrdenProduccion }
    });

    if (!ordenProduccion) {
      return NextResponse.json(
        { error: "Orden de producción no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si la fórmula existe
    const formula = await prisma.formula.findUnique({
      where: { idFormula },
      include: {
        FormulaDetalle: {
          include: {
            materiaPrima: true
          }
        }
      }
    });

    if (!formula) {
      return NextResponse.json(
        { error: "Fórmula no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si el producto existe
    const producto = await prisma.producto.findUnique({
      where: { idProducto }
    });

    if (!producto) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Calcular cuántos lotes se están produciendo
    const lotesProducidos = Math.ceil(cantidadProducida / formula.rendimiento);
    
    // Iniciar transacción para asegurar la integridad de los datos
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Verificar stock suficiente de todas las materias primas
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadConsumida = detalleFormula.cantidad * lotesProducidos;
        
        if (detalleFormula.materiaPrima.stockActual < cantidadConsumida) {
          throw new Error(`Stock insuficiente de ${detalleFormula.materiaPrima.nombreMateriaPrima}`);
        }
      }
      
      // 2. Registrar la producción
      const produccion = await prisma.produccion.create({
        data: {
          idFormula,
          idProducto,
          cantidadProducida,
          idUsuario: userData ? userData.idUsuario : 1,
          observaciones,
          fechaProduccion: new Date(),
          idOrdenProduccion: idOrdenProduccion
        }
      });
      
      // 3. Consumir materias primas según la fórmula
      const movimientosInventario = [];
      
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadConsumida = detalleFormula.cantidad * lotesProducidos;
        
        // Actualizar stock de materia prima
        await prisma.materiaPrima.update({
          where: { idMateriaPrima: detalleFormula.idMateriaPrima },
          data: { stockActual: { decrement: cantidadConsumida } }
        });
        
        // Registrar movimiento en inventario
        const movimiento = await prisma.inventario.create({
          data: {
            idMateriaPrima: detalleFormula.idMateriaPrima,
            cantidad: -cantidadConsumida,
            fechaMovimiento: new Date(),
            idTipoMovimiento: 2, // Asumiendo que 2 es "SALIDA" o "CONSUMO"
            observacion: `Consumo para producción #${produccion.idProduccion}`
          }
        });
        
        movimientosInventario.push(movimiento);
      }
      
      // 4. Aumentar stock del producto terminado
      await prisma.producto.update({
        where: { idProducto },
        data: { stockActual: { increment: cantidadProducida } }
      });
      
      // 5. Registrar movimiento en inventario de producto
      const movimientoProducto = await prisma.inventarioProducto.create({
        data: {
          idProducto,
          cantidad: cantidadProducida,
          fechaMovimiento: new Date(),
          idTipoMovimiento: 1, // Asumiendo que 1 es "ENTRADA" o "PRODUCCIÓN"
          observacion: `Producción #${produccion.idProduccion}`,
          idOrdenProduccion: idOrdenProduccion
        }
      });
      
      return { 
        produccion, 
        movimientosInventario, 
        movimientoProducto 
      };
    });

    // Registrar en auditoría
    const auditoriaService = new AuditoriaService();
    
    // Construir el objeto valorNuevo
    const valorNuevo = {
      idFormula: resultado.produccion.idFormula,
      idProducto: resultado.produccion.idProducto,
      cantidadProducida: resultado.produccion.cantidadProducida,
      observaciones: resultado.produccion.observaciones,
      movimientosInventario: resultado.movimientosInventario.map(m => ({
        idMateriaPrima: m.idMateriaPrima,
        cantidad: m.cantidad,
        tipoMovimiento: m.idTipoMovimiento
      })),
      movimientoProducto: {
        idProducto: resultado.movimientoProducto.idProducto,
        cantidad: resultado.movimientoProducto.cantidad,
        tipoMovimiento: resultado.movimientoProducto.idTipoMovimiento
      }
    };
    
    await auditoriaService.registrarAuditoria(
      "Produccion",
      resultado.produccion.idProduccion,
      valorNuevo,
      userData ? userData.idUsuario : 1,
      request
    );

    return NextResponse.json({
      mensaje: "Producción registrada exitosamente",
      produccion: resultado.produccion
    }, { status: 201 });
  } catch (error) {
    console.error("Error al registrar producción:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}