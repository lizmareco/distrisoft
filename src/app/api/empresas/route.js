import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuditoriaService from "@/src/backend/services/auditoria-service"

// Función auxiliar para obtener el ID del tipo de documento RUC
async function getTipoDocumentoRUC() {
  try {
    // Buscar el tipo de documento RUC
    const tipoRUC = await prisma.tipoDocumento.findFirst({
      where: {
        OR: [
          { descTipoDocumento: { equals: "RUC", mode: "insensitive" } },
          { descTipoDocumento: { contains: "RUC", mode: "insensitive" } },
        ],
        deletedAt: null,
      },
    })

    if (!tipoRUC) {
      // Si no se encuentra, obtener el primer tipo de documento disponible
      const primerTipo = await prisma.tipoDocumento.findFirst({
        where: { deletedAt: null },
        orderBy: { idTipoDocumento: "asc" },
      })

      if (!primerTipo) {
        throw new Error("No se encontraron tipos de documento en el sistema")
      }

      console.warn("No se encontró el tipo de documento RUC. Se usará el ID:", primerTipo.idTipoDocumento)
      return primerTipo.idTipoDocumento
    }

    return tipoRUC.idTipoDocumento
  } catch (error) {
    console.error("Error al obtener el tipo de documento RUC:", error)
    throw error
  }
}

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const numeroDocumento = searchParams.get("numeroDocumento")
    const razonSocial = searchParams.get("razonSocial")

    console.log("API: Buscando empresas con parámetros:", { numeroDocumento, razonSocial })

    // Construir la consulta base
    const whereClause = {
      deletedAt: null,
    }

    // Añadir filtros de búsqueda si se proporcionan
    if (numeroDocumento) {
      whereClause.ruc = {
        contains: numeroDocumento,
        mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
      }
    } else if (razonSocial) {
      whereClause.razonSocial = {
        contains: razonSocial,
        mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
      }
    } else {
      // Si no hay parámetros de búsqueda, devolver un array vacío
      console.log("API: No se proporcionaron parámetros de búsqueda completos")
      return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
    }

    // Ejecutar la consulta con los filtros aplicados
    const empresas = await prisma.empresa.findMany({
      where: whereClause,
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
      },
      orderBy: {
        razonSocial: "asc",
      },
    })

    console.log(`API: Se encontraron ${empresas.length} empresas con los criterios de búsqueda`)
    return NextResponse.json(empresas, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al buscar empresas:", error)
    return NextResponse.json(
      {
        error: "Error al buscar empresas",
        message: error.message,
      },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function POST(request) {
  try {
    console.log("Creando nueva empresa...")
    const auditoriaService = new AuditoriaService()

    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Validar datos requeridos
    if (!data.razonSocial || !data.idCategoriaEmpresa || !data.ruc) {
      console.error("Datos incompletos:", data)
      return NextResponse.json(
        { error: "Faltan datos requeridos (razón social, categoría o RUC)" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Verificar si ya existe una empresa con el mismo RUC
    const empresaExistente = await prisma.empresa.findFirst({
      where: {
        ruc: data.ruc,
        deletedAt: null, // Solo considerar empresas activas
      },
    })

    if (empresaExistente) {
      console.log(`Ya existe una empresa con el RUC ${data.ruc}: ID ${empresaExistente.idEmpresa}`)
      return NextResponse.json(
        {
          error: `Ya existe una empresa registrada con el RUC ${data.ruc}`,
          empresaExistente: {
            id: empresaExistente.idEmpresa,
            razonSocial: empresaExistente.razonSocial,
          },
        },
        { status: HTTP_STATUS_CODES.conflict }, // 409 Conflict
      )
    }

    // Obtener el ID del tipo de documento RUC
    const idTipoDocumentoRUC = await getTipoDocumentoRUC()

    const empresa = await prisma.empresa.create({
      data: {
        idCategoriaEmpresa: Number.parseInt(data.idCategoriaEmpresa),
        razonSocial: data.razonSocial,
        idTipoDocumento: idTipoDocumentoRUC, // Asignar automáticamente el tipo RUC
        ruc: data.ruc,
        direccionEmpresa: data.direccionEmpresa || "",
        idCiudad: data.idCiudad ? Number.parseInt(data.idCiudad) : null,
        correoEmpresa: data.correoEmpresa || "",
        telefono: data.telefono || "",
        contacto: data.contacto || "",
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Empresa", empresa.idEmpresa, empresa, userData.idUsuario, request)

    console.log("Empresa creada con ID:", empresa.idEmpresa)
    return NextResponse.json(empresa, { status: HTTP_STATUS_CODES.created })
  } catch (error) {
    console.error("Error al crear empresa:", error)
    return NextResponse.json(
      { error: `Error al crear empresa: ${error.message}` },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
