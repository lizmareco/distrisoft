// app/api/pedidos/verificar-stock/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function POST(request) {
  try {
    const { idPedido } = await request.json();
    
    if (!idPedido) {
      return NextResponse.json(
        { error: "Se requiere el ID del pedido" },
        { status: 400 }
      );
    }

    // Obtener detalles del pedido
    const pedido = await prisma.pedidoCliente.findUnique({
      where: { idPedido },
      include: {
        pedidoDetalle: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Verificar stock para cada producto
    const resultadosVerificacion = [];
    let stockSuficiente = true;
    const materialesFaltantes = [];

    for (const detalle of pedido.pedidoDetalle) {
      // Buscar fórmulas para el producto
      const formulas = await prisma.formula.findMany({
        where: { idProducto: detalle.idProducto },
        include: {
          FormulaDetalle: {
            include: {
              materiaPrima: true
            }
          }
        }
      });

      if (formulas.length === 0) {
        resultadosVerificacion.push({
          producto: detalle.producto.nombreProducto,
          cantidad: detalle.cantidad,
          error: "No hay fórmula definida para este producto"
        });
        stockSuficiente = false;
        continue;
      }

      // Usar la primera fórmula (podría mejorarse para seleccionar la mejor)
      const formula = formulas[0];
      
      // Calcular cuántos lotes de producción se necesitan
      const cantidadPorLote = formula.rendimiento;
      const lotesNecesarios = Math.ceil(detalle.cantidad / cantidadPorLote);
      
      // Verificar stock de cada materia prima
      for (const detalleFormula of formula.FormulaDetalle) {
        const cantidadNecesaria = detalleFormula.cantidad * lotesNecesarios;
        const materiaPrima = detalleFormula.materiaPrima;
        
        if (materiaPrima.stockActual < cantidadNecesaria) {
          stockSuficiente = false;
          materialesFaltantes.push({
            idMateriaPrima: materiaPrima.idMateriaPrima,
            materiaPrima: materiaPrima.nombreMateriaPrima,
            stockActual: materiaPrima.stockActual,
            cantidadNecesaria,
            faltante: cantidadNecesaria - materiaPrima.stockActual
          });
        }
      }
      
      resultadosVerificacion.push({
        producto: detalle.producto.nombreProducto,
        cantidad: detalle.cantidad,
        lotesNecesarios,
        cantidadPorLote
      });
    }

    return NextResponse.json({
      idPedido,
      stockSuficiente,
      resultadosVerificacion,
      materialesFaltantes
    });
  } catch (error) {
    console.error("Error al verificar stock:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}