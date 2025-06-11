// app/api/formulas/[id]/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import AuthController from "@/src/backend/controllers/auth-controller";
import AuditoriaService from "@/src/backend/services/auditoria-service";
import cookie from "cookie" 

async function getUserIdFromRequest(request) {
  const authController = new AuthController()
  let token = null

  // Leer la cookie "at" del header (para Next.js App Router y API routes modernas)
  const cookieHeader = request.headers.get("cookie")
  if (cookieHeader) {
    const cookies = cookie.parse(cookieHeader)
    token = cookies.at
  }

  // Fallback: Authorization header (Bearer)
  if (!token) {
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.replace("Bearer ", "")
    }
  }

  if (!token) {
    console.warn("NO TOKEN FOUND, defaulting to 1")
    return 1
  }

  const userData = await authController.getUserFromToken(token)
  return userData?.idUsuario || 1
}

// GET /api/formulas/[id] - Obtener una fórmula específica
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de fórmula no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    // En desarrollo permitimos acceso sin token
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener la fórmula
    const formula = await prisma.formula.findUnique({
      where: {
        idFormula: parseInt(id),
        deletedAt: null
      },
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
      return NextResponse.json(
        { error: "Fórmula no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(formula);
  } catch (error) {
    console.error(`Error al obtener fórmula con ID ${params?.id}:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/formulas/[id] - Actualizar una fórmula
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de fórmula no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)

    const datos = await request.json();
    
    if (!datos.idProducto || !datos.nombre || !datos.rendimiento || !datos.detalles) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la fórmula existe
    const formulaExistente = await prisma.formula.findUnique({
      where: {
        idFormula: parseInt(id),
        deletedAt: null
      },
      include: {
        FormulaDetalle: true
      }
    });

    if (!formulaExistente) {
      return NextResponse.json(
        { error: "Fórmula no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la fórmula y sus detalles en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Actualizar la fórmula
      const formulaActualizada = await prisma.formula.update({
        where: {
          idFormula: parseInt(id)
        },
        data: {
          idProducto: parseInt(datos.idProducto, 10),
          nombre: datos.nombre,
          descripcion: datos.descripcion || "",
          rendimiento: parseInt(datos.rendimiento, 10),
          updatedAt: new Date()
        }
      });
      
      // 2. Eliminar los detalles existentes
      await prisma.formulaDetalle.deleteMany({
        where: {
          idFormula: parseInt(id)
        }
      });
      
      // 3. Crear los nuevos detalles
      const detalles = [];
      
      for (const detalle of datos.detalles) {
        const detalleCreado = await prisma.formulaDetalle.create({
          data: {
            idFormula: parseInt(id),
            idMateriaPrima: parseInt(detalle.idMateriaPrima, 10),
            cantidad: parseFloat(detalle.cantidad),
            unidadMedida: detalle.unidadMedida
          }
        });
        
        detalles.push(detalleCreado);
      }
      
      return { formula: formulaActualizada, detalles };
    });

    
    // Construir el objeto valorNuevo
    const valorNuevo = {
      idProducto: resultado.formula.idProducto,
      nombre: resultado.formula.nombre,
      descripcion: resultado.formula.descripcion,
      rendimiento: resultado.formula.rendimiento,
      detalles: resultado.detalles.map(d => ({
        idMateriaPrima: d.idMateriaPrima,
        cantidad: d.cantidad,
        unidadMedida: d.unidadMedida
      }))
    };

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)
    
    await auditoriaService.registrarAuditoria({
      entidad: "Formula",
      idRegistro: parseInt(id, 10),
      accion: "ACTUALIZAR",
      valorAnterior: formulaExistente,
      valorNuevo,
      idUsuario,
      direccionIP,
      navegador
    });

    return NextResponse.json({
      mensaje: "Fórmula actualizada exitosamente",
      formula: resultado.formula,
      detalles: resultado.detalles
    });
  } catch (error) {
    console.error(`Error al actualizar fórmula con ID ${params?.id}:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/formulas/[id] - Eliminar una fórmula (borrado lógico)
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de fórmula no proporcionado" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const auditoriaService = new AuditoriaService()
    const idUsuario = await getUserIdFromRequest(request)
    

    // Verificar que la fórmula existe y no está eliminada
    const formulaExistente = await prisma.formula.findFirst({
      where: {
        idFormula: parseInt(id, 10),
        deletedAt: null // Verificar que no esté eliminada
      }
    });

    if (!formulaExistente) {
      return NextResponse.json(
        { error: "Fórmula no encontrada" },
        { status: 404 }
      );
    }

    // Realizar borrado lógico estableciendo deletedAt
    const formulaEliminada = await prisma.formula.update({
      where: {
        idFormula: parseInt(id, 10)
      },
      data: {
        deletedAt: new Date() // Establecer la fecha actual
      }
    });

    const direccionIP = auditoriaService.obtenerDireccionIP(request)
    const navegador = auditoriaService.obtenerInfoNavegador(request)
    
    await auditoriaService.registrarAuditoria({
      entidad: "Formula",
      idRegistro: parseInt(id, 10),
      accion: "ELIMINAR",
      valorAnterior: formulaExistente,
      valorNuevo: null,
      idUsuario,
      direccionIP,
      navegador
    });

    return NextResponse.json({
      mensaje: "Fórmula eliminada exitosamente",
      formula: formulaEliminada
    });
  } catch (error) {
    console.error(`Error al eliminar fórmula con ID ${params?.id}:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}