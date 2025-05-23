import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { verificarToken } from "@/lib/auth";
import { AuditoriaService } from "@/services/auditoria-service";

const auditoriaService = new AuditoriaService();

// POST /api/produccion - Registrar una producción
export async function POST(request) {
  try {
    // Verificar autenticación
    const resultadoAuth = await verificarToken(request);
    if (!resultadoAuth.success && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const usuario = resultadoAuth.usuario;
    const datos = await request.json();
    
    // Validar datos
    if (!datos.idFormula || !datos.cantidadProducir) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Obtener la fórmula con sus detalles
    const formula = await prisma.formula.findUnique({
      where: { idFormula: datos.idFormula },
      include: {
        producto: true,
        FormulaDetalle: {
          include: {
            materiaPrima: true
          }
        }
      }
    });

    if (!formula) {
      return NextResponse.json({ error: "Fórmula no encontrada" }, { status: 404 });
    }

    // Calcular la cantidad total a producir
    const cantidadTotal = datos.cantidadProducir * formula.rendimiento;
    
    // Verificar stock de materias primas
    const materialesInsuficientes = [];
    for (const detalle of formula.FormulaDetalle) {
      const cantidadNecesaria = detalle.cantidad * datos.cantidadProducir;
      if (detalle.materiaPrima.stockActual < cantidadNecesaria) {
        materialesInsuficientes.push({
          materiaPrima: detalle.materiaPrima.nombreMateriaPrima,
          stockActual: detalle.materiaPrima.stockActual,
          cantidadNecesaria
        });
      }
    }

    if (materialesInsuficientes.length > 0) {
      return NextResponse.json({ 
        error: "Stock insuficiente de materias primas", 
        materialesInsuficientes 
      }, { status: 400 });
    }

    // Registrar la producción en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // Crear registro de producción
      const produccion = await prisma.produccion.create({
        data: {
          idFormula: datos.idFormula,
          idProducto: formula.idProducto,
          cantidadProducida: cantidadTotal,
          fechaProduccion: new Date(),
          idUsuario: usuario?.idUsuario || 1,
          observaciones: datos.observaciones || ""
        }
      });

      // Actualizar stock de materias primas (restar)
      for (const detalle of formula.FormulaDetalle) {
        const cantidadUsada = detalle.cantidad * datos.cantidadProducir;
        
        await prisma.materiaPrima.update({
          where: { idMateriaPrima: detalle.idMateriaPrima },
          data: {
            stockActual: {
              decrement: cantidadUsada
            }
          }
        });

        // Registrar movimiento de inventario para materia prima
        await prisma.inventarioMateriaPrima.create({
          data: {
            idMateriaPrima: detalle.idMateriaPrima,
            cantidad: -cantidadUsada,
            tipoMovimiento: "PRODUCCION",
            fechaMovimiento: new Date(),
            idUsuario: usuario?.idUsuario || 1,
            observacion: `Usado en producción #${produccion.idProduccion}`
          }
        });
      }

      // Actualizar stock del producto (sumar)
      await prisma.producto.update({
        where: { idProducto: formula.idProducto },
        data: {
          stockActual: {
            increment: cantidadTotal
          }
        }
      });

      // Registrar movimiento de inventario para producto
      await prisma.inventarioProducto.create({
        data: {
          idProducto: formula.idProducto,
          cantidad: cantidadTotal,
          tipoMovimiento: "PRODUCCION",
          fechaMovimiento: new Date(),
          idUsuario: usuario?.idUsuario || 1,
          observacion: `Producción #${produccion.idProduccion}`
        }
      });

      return {
        produccion,
        cantidadProducida: cantidadTotal
      };
    });

    // Registrar en auditoría
    await auditoriaService.registrarCreacion(
      "Produccion",
      resultado.produccion.idProduccion,
      usuario?.idUsuario || 0,
      null,
      resultado,
      request
    );

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Error al registrar producción:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}