import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

export async function GET() {
  try {
    const formulas = await prisma.formula.findMany({
      include: {
        FormulaDetalle: {
          include: {
            materiaPrima: true,
          },
        },
        producto: true,
      },
    })

    const analisis = formulas.map((formula) => {
      const producto = formula.producto
      const rendimiento = formula.rendimiento
      const pesoTotalProducto = rendimiento * (producto.pesoUnidad || 1)

      const detalles = formula.FormulaDetalle.map((detalle) => {
        const materiaPrima = detalle.materiaPrima
        return {
          materiaPrima: materiaPrima.nombreMateriaPrima,
          cantidadEnFormula: detalle.cantidad,
          unidadMedida: detalle.unidadMedida,
          esLogico: detalle.cantidad > 0 && detalle.cantidad <= pesoTotalProducto,
        }
      })

      return {
        idFormula: formula.idFormula,
        nombreFormula: formula.nombre,
        producto: producto.nombreProducto,
        rendimiento: rendimiento,
        pesoUnidadProducto: producto.pesoUnidad,
        pesoTotalProducto: pesoTotalProducto,
        detalles: detalles,
        formulaCorrecta: detalles.every((d) => d.esLogico),
      }
    })

    return NextResponse.json({
      analisis,
      resumen: {
        totalFormulas: formulas.length,
        formulasCorrectas: analisis.filter((a) => a.formulaCorrecta).length,
        formulasIncorrectas: analisis.filter((a) => !a.formulaCorrecta).length,
      },
    })
  } catch (error) {
    console.error("Error al verificar fórmulas:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
