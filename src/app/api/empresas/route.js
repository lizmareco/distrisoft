import { prisma } from "@/prisma/client"
import { NextResponse } from "next/server"
import AuditoriaService from "@/src/backend/services/auditoria-service"

export async function GET(request) {
  try {
    console.log("Obteniendo empresas...")

    const empresas = await prisma.empresa.findMany({
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
      where: {
        deletedAt: null,
      },
    })

    console.log(`Se encontraron ${empresas.length} empresas`)
    return NextResponse.json(empresas)
  } catch (error) {
    console.error("Error al obtener empresas:", error)
    return NextResponse.json({ error: "Error al obtener empresas: " + error.message }, { status: 500 })
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
    if (!data.razonSocial || !data.idCategoriaEmpresa || !data.idTipoDocumento || !data.ruc) {
      console.error("Datos incompletos:", data)
      return NextResponse.json(
        { error: "Faltan datos requeridos (razón social, categoría, tipo de documento o RUC)" },
        { status: 400 },
      )
    }

    const empresa = await prisma.empresa.create({
      data: {
        idCategoriaEmpresa: Number.parseInt(data.idCategoriaEmpresa),
        razonSocial: data.razonSocial,
        idTipoDocumento: Number.parseInt(data.idTipoDocumento),
        ruc: data.ruc,
        direccionEmpresa: data.direccionEmpresa,
        idCiudad: Number.parseInt(data.idCiudad),
        correoEmpresa: data.correoEmpresa,
        telefono: data.telefono,
        personaContacto: data.personaContacto ? Number.parseInt(data.personaContacto) : null,
      },
      include: {
        categoriaEmpresa: true,
        ciudad: true,
        persona: true,
        tipoDocumento: true,
      },
    })

    // Registrar la acción en auditoría
    await auditoriaService.registrarCreacion("Empresa", empresa.idEmpresa, empresa, userData.idUsuario, request)

    console.log("Empresa creada con ID:", empresa.idEmpresa)
    return NextResponse.json(empresa)
  } catch (error) {
    console.error("Error al crear empresa:", error)
    return NextResponse.json({ error: `Error al crear empresa: ${error.message}` }, { status: 500 })
  }
}

