import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // Inicio del día

    console.log("Iniciando actualización automática de estados...")

    // 1. Actualizar días vencidos en cuentas por cobrar
    const cuentasActualizadas = await prisma.$executeRaw`
      UPDATE "CuentaPorCobrar" 
      SET "dias_vencido" = EXTRACT(DAY FROM (CURRENT_DATE - "fecha_vencimiento")),
          "updated_at" = CURRENT_TIMESTAMP
      WHERE "deleted_at" IS NULL 
        AND "saldo_restante" > 0
    `

    // 2. Cambiar estado de cuentas vigentes a vencidas
    const cuentasVencidas = await prisma.cuentaPorCobrar.updateMany({
      where: {
        deletedAt: null,
        saldoRestante: { gt: 0 },
        fechaVencimiento: { lt: hoy },
        idEstadoCuenta: 1, // Vigente
      },
      data: {
        idEstadoCuenta: 2, // Vencida
        updatedAt: new Date(),
      },
    })

    // 3. Actualizar estado de facturas según pagos
    const facturasCobradas = await prisma.facturaCliente.updateMany({
      where: {
        deletedAt: null,
        esContado: false,
        idEstadoFactuCliente: { in: [1, 2] }, // Emitida o Enviada
        cuentaPorCobrar: {
          saldoRestante: { lte: 0 },
        },
      },
      data: {
        idEstadoFactuCliente: 3, // Cobrada
        updatedAt: new Date(),
      },
    })

    // 4. Obtener resumen de cambios
    const resumen = {
      cuentasActualizadas: cuentasActualizadas,
      cuentasVencidas: cuentasVencidas.count,
      facturasCobradas: facturasCobradas.count,
      fechaActualizacion: new Date(),
    }

    console.log("Actualización completada:", resumen)

    return NextResponse.json({
      success: true,
      message: "Estados actualizados correctamente",
      resumen,
    })
  } catch (error) {
    console.error("Error al actualizar estados:", error)
    return NextResponse.json({ success: false, error: "Error al actualizar estados" }, { status: 500 })
  }
}

// Función para ejecutar automáticamente (se puede llamar desde un cron job)
export async function GET(request) {
  return POST(request)
}
