// app/api/formulas/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import AuthController from "@/src/backend/controllers/auth-controller";
import AuditoriaService from "@/src/backend/services/auditoria-service";

// GET /api/formulas - Obtener todas las fórmulas
export async function GET(request) {
  try {
    // Verificar autenticación
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    // En desarrollo permitimos acceso sin token
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener todas las fórmulas que no están eliminadas lógicamente
    const formulas = await prisma.formula.findMany({
      where: {
        deletedAt: null // Asegurar que solo se obtienen las no eliminadas
      },
      include: {
        producto: true,
        FormulaDetalle: {
          include: {
            materiaPrima: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(formulas);
  } catch (error) {
    console.error("Error al obtener fórmulas:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/formulas - Crear una nueva fórmula
export async function POST(request) {
  try {
    // Verificar autenticación
    const authController = new AuthController();
    const token = await authController.hasAccessToken(request);
    
    let userData = null; // Inicializar userData
    
    if (!token && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    // Si hay token, obtener el usuario
    if (token) {
      userData = await authController.getUserFromToken(token);
      if (!userData) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
    }

    const datos = await request.json();
    
    if (!datos.idProducto || !datos.nombre || !datos.rendimiento || !datos.detalles || datos.detalles.length === 0) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Crear la fórmula y sus detalles en una transacción
    const resultado = await prisma.$transaction(async (prisma) => {
      // 1. Crear la fórmula
      const formula = await prisma.formula.create({
        data: {
          idProducto: parseInt(datos.idProducto, 10),
          nombre: datos.nombre,
          descripcion: datos.descripcion || "",
          rendimiento: parseInt(datos.rendimiento, 10)
        }
      });
      
      // 2. Crear los detalles de la fórmula
      const detalles = [];
      
      for (const detalle of datos.detalles) {
        const detalleCreado = await prisma.formulaDetalle.create({
          data: {
            idFormula: formula.idFormula,
            idMateriaPrima: parseInt(detalle.idMateriaPrima, 10),
            cantidad: parseFloat(detalle.cantidad),
            unidadMedida: detalle.unidadMedida
          }
        });
        
        detalles.push(detalleCreado);
      }
      
      return { formula, detalles };
    });

    // Registrar en auditoría
    const auditoriaService = new AuditoriaService();
    
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
    
    await auditoriaService.registrarAuditoria({
      entidad: "Formula",
      idRegistro: resultado.formula.idFormula,
      accion: "CREAR",
      valorAnterior: null,
      valorNuevo,
      idUsuario: userData ? userData.idUsuario : 1, // Usar el ID del usuario del token
      request // Pasar el objeto request completo
    });

    return NextResponse.json({
      mensaje: "Fórmula creada exitosamente",
      formula: resultado.formula,
      detalles: resultado.detalles
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear fórmula:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}