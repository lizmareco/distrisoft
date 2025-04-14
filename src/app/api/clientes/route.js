import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"
import AuthController from "@/src/backend/controllers/auth-controller"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"

export async function GET(request) {
  try {
    // Obtener parámetros de búsqueda de la URL
    const { searchParams } = new URL(request.url)
    const tipoDocumento = searchParams.get("tipoDocumento")
    const numeroDocumento = searchParams.get("numeroDocumento")

    console.log("Buscando clientes con parámetros:", { tipoDocumento, numeroDocumento })

    // Si no se proporcionan parámetros de búsqueda, devolver un array vacío
    // en lugar de todos los clientes
    if (!tipoDocumento || !numeroDocumento) {
      console.log("No se proporcionaron parámetros de búsqueda completos")
      return NextResponse.json([], { status: HTTP_STATUS_CODES.ok })
    }

    // Buscar clientes por tipo y número de documento
    const clientes = await prisma.cliente.findMany({
      where: {
        deletedAt: null,
        persona: {
          idTipoDocumento: Number(tipoDocumento),
          nroDocumento: {
            contains: numeroDocumento,
            mode: "insensitive", // Búsqueda insensible a mayúsculas/minúsculas
          },
          deletedAt: null,
        },
      },
      include: {
        persona: {
          include: {
            tipoDocumento: true,
          },
        },
        sectorCliente: true,
        empresa: true,
      },
    })

    console.log(`Se encontraron ${clientes.length} clientes con los criterios de búsqueda`)
    return NextResponse.json(clientes, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al buscar clientes:", error)
    return NextResponse.json({ error: "Error al buscar clientes" }, { status: HTTP_STATUS_CODES.internalServerError })
  }
}

export async function POST(request) {
  try {
    console.log("Creando nuevo cliente...")
    const data = await request.json()
    console.log("Datos recibidos:", data)

    // Inicializar servicio de auditoría
    const auditoriaService = new AuditoriaService()
    const authController = new AuthController()

    // Obtener el usuario actual desde el token (si está autenticado)
    const accessToken = await authController.hasAccessToken(request)
    let idUsuario = null

    if (accessToken) {
      const userData = await authController.getUserFromToken(accessToken)
      idUsuario = userData?.idUsuario || null
    }

    // Validar datos requeridos
    if (!data.idPersona || !data.idSectorCliente) {
      console.error("Datos incompletos:", data)
      return NextResponse.json(
        { error: "Faltan datos requeridos (persona, o sector)" },
        { status: HTTP_STATUS_CODES.badRequest },
      )
    }

    // Crear el cliente
    const cliente = await prisma.cliente.create({
      data: {
        idPersona: Number.parseInt(data.idPersona),
        idSectorCliente: Number.parseInt(data.idSectorCliente),
        idEmpresa: data.idEmpresa ? Number.parseInt(data.idEmpresa) : null,
      },
      include: {
        persona: true,
        sectorCliente: true,
        empresa: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Cliente",
      idRegistro: cliente.idCliente.toString(),
      accion: "CREAR",
      valorAnterior: null,
      valorNuevo: cliente,
      idUsuario: idUsuario,
      request: request,
    })

    console.log("Cliente creado con ID:", cliente.idCliente)
    return NextResponse.json(cliente, { status: HTTP_STATUS_CODES.created })
  } catch (error) {
    console.error("Error al crear cliente:", error)
    return NextResponse.json(
      { error: `Error al crear cliente: ${error.message}` },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
