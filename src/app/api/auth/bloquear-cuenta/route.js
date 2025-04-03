// src/app/api/auth/bloquear-cuenta/route.js
import AuthController from '@/src/backend/controllers/auth-controller';
import { HTTP_STATUS_CODES } from '@/src/lib/http/http-status-code';
import CustomError from '@/src/lib/errors/custom-errors';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authController = new AuthController();
    
    // Verificar que el usuario actual esté autenticado
    const accessToken = await authController.hasAccessToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { message: 'No autorizado' },
        { status: HTTP_STATUS_CODES.unauthorized }
      );
    }
    
    // Verificar rol de administrador
    const userData = await authController.getUserFromToken(accessToken);
    if (!userData || userData.rol !== 'ADMINISTRADOR') {
      return NextResponse.json(
        { message: 'No tienes permisos para realizar esta acción' },
        { status: HTTP_STATUS_CODES.forbidden }
      );
    }

    // Obtener el ID del usuario a bloquear
    const { idUsuario } = await request.json();
    
    if (!idUsuario) {
      return NextResponse.json(
        { message: 'ID de usuario requerido' },
        { status: HTTP_STATUS_CODES.badRequest }
      );
    }

    // Bloquear la cuenta
    await authController.bloquearCuenta(idUsuario);

    return NextResponse.json(
      { message: 'Cuenta bloqueada exitosamente' },
      { status: HTTP_STATUS_CODES.ok }
    );
  } catch (error) {
    if (error.isCustom) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    } else {
      console.error('Error en /api/auth/bloquear-cuenta: ', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { message: 'Ha ocurrido un error' },
        { status: HTTP_STATUS_CODES.internalServerError }
      );
    }
  }
}