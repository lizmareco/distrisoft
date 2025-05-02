import { NextResponse } from "next/server"
import { prisma } from "@/prisma/client"

// GET /api/clientes/debug - Depurar problemas con el modelo Cliente
export async function GET() {
  try {
    console.log("API clientes/debug: Iniciando depuración del modelo Cliente...")

    // Verificar si el modelo Cliente existe
    const clienteModelExists = !!prisma.cliente
    console.log("¿Existe el modelo cliente?", clienteModelExists)

    // Verificar si el modelo Cliente (con C mayúscula) existe
    const ClienteModelExists = !!prisma.Cliente
    console.log("¿Existe el modelo Cliente (con C mayúscula)?", ClienteModelExists)

    // Obtener todos los modelos disponibles en Prisma
    const prismaModels = Object.keys(prisma).filter(
      (key) =>
        typeof prisma[key] === "object" &&
        prisma[key] !== null &&
        key !== "$on" &&
        key !== "$connect" &&
        key !== "$disconnect" &&
        key !== "$use" &&
        key !== "$executeRaw" &&
        key !== "$queryRaw" &&
        key !== "$transaction",
    )
    console.log("Modelos Prisma disponibles:", prismaModels)

    // Intentar usar el modelo correcto
    let clientes = []
    let error = null
    let modeloUsado = null

    if (ClienteModelExists) {
      try {
        console.log("Intentando usar el modelo 'Cliente' (con C mayúscula)...")
        clientes = await prisma.Cliente.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            persona: true,
          },
        })
        modeloUsado = "Cliente"
        console.log(`Se encontraron ${clientes.length} clientes usando el modelo 'Cliente'`)
      } catch (e) {
        console.error("Error al usar el modelo 'Cliente':", e)
        error = e.message
      }
    } else if (clienteModelExists) {
      try {
        console.log("Intentando usar el modelo 'cliente'...")
        clientes = await prisma.cliente.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            persona: true,
          },
        })
        modeloUsado = "cliente"
        console.log(`Se encontraron ${clientes.length} clientes usando el modelo 'cliente'`)
      } catch (e) {
        console.error("Error al usar el modelo 'cliente':", e)
        error = e.message
      }
    } else {
      // Intentar encontrar el modelo correcto para clientes
      for (const model of prismaModels) {
        if (model.toLowerCase().includes("client") || model.toLowerCase().includes("cliente")) {
          try {
            console.log(`Intentando usar el modelo '${model}'...`)
            clientes = await prisma[model].findMany({
              where: {
                deletedAt: null,
              },
            })
            modeloUsado = model
            console.log(`Se encontraron ${clientes.length} clientes usando el modelo '${model}'`)
            break
          } catch (e) {
            console.error(`Error al usar el modelo '${model}':`, e)
          }
        }
      }
    }

    // Si no se encontró ningún modelo adecuado
    if (!modeloUsado && prismaModels.length > 0) {
      console.log(
        "No se encontró un modelo específico para clientes. Intentando listar todos los modelos disponibles...",
      )

      const modelResults = {}

      for (const model of prismaModels) {
        try {
          const records = await prisma[model].findMany({ take: 5 })
          modelResults[model] = {
            count: records.length,
            sample: records.length > 0 ? records[0] : null,
          }
        } catch (e) {
          modelResults[model] = { error: e.message }
        }
      }

      return NextResponse.json(
        {
          error: "No se encontró un modelo adecuado para clientes",
          clienteModelExists,
          ClienteModelExists,
          prismaModels,
          modelResults,
        },
        { status: 404 },
      )
    }

    // Transformar los datos para tener una estructura más plana si se encontraron clientes
    const clientesTransformados = clientes.map((cliente) => {
      // Crear un objeto base con las propiedades del cliente
      const clienteTransformado = { ...cliente }

      // Si hay una relación persona, añadir sus propiedades directamente
      if (cliente.persona) {
        clienteTransformado.nombre = cliente.persona.nombre
        clienteTransformado.apellido = cliente.persona.apellido
        clienteTransformado.nroDocumento = cliente.persona.nroDocumento
      }

      return clienteTransformado
    })

    return NextResponse.json(
      {
        modeloUsado,
        clienteModelExists,
        ClienteModelExists,
        prismaModels,
        error,
        clientes: clientesTransformados,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("API clientes/debug: Error general:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
