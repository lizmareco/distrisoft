import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code"
import AuthController from "@/src/backend/controllers/auth-controller"

const prisma = new PrismaClient()

export async function GET(request) {
  try {
    const authController = new AuthController()

    // Verificar que el usuario esté autenticado
    const accessToken = await authController.hasAccessToken(request)
    if (!accessToken) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Obtener el usuario del token
    const userData = await authController.getUserFromToken(accessToken)
    if (!userData) {
      return NextResponse.json({ message: "No autorizado" }, { status: HTTP_STATUS_CODES.unauthorized })
    }

    // Obtener datos completos del usuario desde la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: {
        idUsuario: userData.idUsuario,
        deletedAt: null,
      },
      include: {
        persona: {
          include: {
            ciudad: true,
            tipoDocumento: true,
          },
        },
        rol: true,
      },
    })

    if (!usuario) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: HTTP_STATUS_CODES.notFound })
    }

    // Obtener información adicional como la fecha del último cambio de contraseña
    const ultimosCambiosContrasena = await prisma.auditoria.findMany({
      where: {
        entidad: "Usuario",
        idRegistro: String(userData.idUsuario),
        accion: "CAMBIO_CONTRASEÑA_EXITOSO",
      },
      orderBy: {
        fechaCreacion: "desc",
      },
      take: 1,
    })

    // Calcular días restantes hasta vencimiento de contraseña (90 días)
    const DIAS_VENCIMIENTO = 90
    const fechaUltimoCambio = new Date(usuario.ultimoCambioContrasena)
    const fechaActual = new Date()
    const diasTranscurridos = Math.floor((fechaActual - fechaUltimoCambio) / (1000 * 60 * 60 * 24))
    const diasRestantes = DIAS_VENCIMIENTO - diasTranscurridos

    // Preparar respuesta con datos del usuario
    const perfilUsuario = {
      idUsuario: usuario.idUsuario,
      nombreUsuario: usuario.nombreUsuario,
      estado: usuario.estado,
      rol: usuario.rol.nombreRol,
      persona: {
        idPersona: usuario.persona.idPersona,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        nroDocumento: usuario.persona.nroDocumento,
        tipoDocumento: usuario.persona.tipoDocumento?.descTipoDocumento || null,
        fechaNacimiento: usuario.persona.fechaNacimiento,
        direccion: usuario.persona.direccion,
        nroTelefono: usuario.persona.nroTelefono,
        correoPersona: usuario.persona.correoPersona,
        ciudad: usuario.persona.ciudad?.nombreCiudad || null,
      },
      seguridad: {
        ultimoCambioContrasena: usuario.ultimoCambioContrasena,
        diasRestantesContrasena: diasRestantes,
        contrasenaVencida: diasRestantes <= 0,
        ultimoInicioSesion: ultimosCambiosContrasena[0]?.fechaCreacion || null,
      },
    }

    return NextResponse.json(perfilUsuario, { status: HTTP_STATUS_CODES.ok })
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error)
    return NextResponse.json(
      { message: "Error al obtener perfil de usuario", error: error.message },
      { status: HTTP_STATUS_CODES.internalServerError },
    )
  }
}

