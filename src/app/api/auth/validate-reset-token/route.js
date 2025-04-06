import { NextResponse } from 'next/server';
import AuthController from '@/src/backend/controllers/auth-controller';

const authController = new AuthController();

export async function POST(request) {
  try {
    const { token } = await request.json();
    const result = await authController.validarTokenRecuperacion(token);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en POST /api/auth/validate-reset-token:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error al validar el token' },
      { status: error.status || 500 }
    );
  }
}