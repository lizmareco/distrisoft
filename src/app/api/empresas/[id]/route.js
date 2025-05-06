import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Obteniendo empresa con ID: ${id}`)

    const empresa = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
        deletedAt: null,
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
      },
    })

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    return NextResponse.json(empresa, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al obtener empresa:", error)
    return NextResponse.json(
      { error: "Error al obtener empresa", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const data = await request.json()
    console.log(`API: Actualizando empresa con ID: ${id}`)
    console.log("Datos recibidos:", data)

    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    // Obtener la empresa actual para auditoría
    const empresaAnterior = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
      },
    })

    if (!empresaAnterior) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Verificar si ya existe otra empresa con el mismo RUC
    if (data.ruc && data.ruc !== empresaAnterior.ruc) {
      const empresaExistente = await prisma.empresa.findFirst({
        where: {
          ruc: data.ruc,
          idEmpresa: { not: Number.parseInt(id) }, // Excluir la empresa actual
          deletedAt: null, // Solo considerar empresas activas
        },
      })

      if (empresaExistente) {
        console.log(`Ya existe otra empresa con el RUC ${data.ruc}: ID ${empresaExistente.idEmpresa}`)
        return NextResponse.json(
          {
            error: `Ya existe otra empresa registrada con el RUC ${data.ruc}`,
            empresaExistente: {
              id: empresaExistente.idEmpresa,
              razonSocial: empresaExistente.razonSocial,
            },
          },
          { status: HTTP_STATUS_CODES.conflict }, // 409 Conflict
        )
      }
    }

    // Actualizar la empresa
    const empresa = await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        idCategoriaEmpresa: data.idCategoriaEmpresa ? Number.parseInt(data.idCategoriaEmpresa) : undefined,
        razonSocial: data.razonSocial,
        idTipoDocumento: data.idTipoDocumento ? Number.parseInt(data.idTipoDocumento) : undefined,
        ruc: data.ruc,
        direccionEmpresa: data.direccionEmpresa,
        idCiudad: data.idCiudad ? Number.parseInt(data.idCiudad) : undefined,
        correoEmpresa: data.correoEmpresa,
        telefono: data.telefono,
        contacto: data.contacto || "", // Usar el nuevo campo contacto
        updatedAt: new Date(),
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        tipoDocumento: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Empresa",
      idRegistro: id.toString(),
      accion: "ACTUALIZAR",
      valorAnterior: empresaAnterior,
      valorNuevo: empresa,
      idUsuario: userData.idUsuario,
      request: request,
    })

    return NextResponse.json(empresa, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al actualizar empresa:", error)
    return NextResponse.json(
      { error: "Error al actualizar empresa", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    console.log(`API: Eliminando empresa con ID: ${id}`)

    const auditoriaService = new AuditoriaService()
    // Usuario ficticio para auditoría en desarrollo
    const userData = { idUsuario: 1 }

    // Obtener la empresa actual para auditoría
    const empresaAnterior = await prisma.empresa.findUnique({
      where: {
        idEmpresa: Number.parseInt(id),
      },
    })

    if (!empresaAnterior) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Eliminar la empresa (soft delete)
    await prisma.empresa.update({
      where: {
        idEmpresa: Number.parseInt(id),
      },
      data: {
        deletedAt: new Date(),
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarAuditoria({
      entidad: "Empresa",
      idRegistro: id.toString(),
      accion: "ELIMINAR",
      valorAnterior: empresaAnterior,
      valorNuevo: null,
      idUsuario: userData.idUsuario,
      request: request,
    })

    return NextResponse.json({ message: "Empresa eliminada correctamente" }, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("API: Error al eliminar empresa:", error)
    return NextResponse.json(
      { error: "Error al eliminar empresa", message: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}
