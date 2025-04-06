import { NextResponse } from 'next/server';
import AuthController from '@/src/backend/controllers/auth-controller';

const authController = new AuthController();

// Función para validar la contraseña
function validarContrasena(contrasena) {
  const minLength = contrasena.length >= 8;
  const hasUppercase = /[A-Z]/.test(contrasena);
  const hasLowercase = /[a-z]/.test(contrasena);
  const hasNumber = /[0-9]/.test(contrasena);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(contrasena);
  
  const isValid = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
  
  if (!isValid) {
    const errors = [];
    if (!minLength) errors.push('al menos 8 caracteres');
    if (!hasUppercase) errors.push('al menos una letra mayúscula');
    if (!hasLowercase) errors.push('al menos una letra minúscula');
    if (!hasNumber) errors.push('al menos un número');
    if (!hasSpecial) errors.push('al menos un carácter especial');
    
    return {
      isValid: false,
      message: `La contraseña debe tener ${errors.join(', ')}.`
    };
  }
  
  return { isValid: true };
}

export async function POST(request) {
  try {
    const { token, nuevaContrasena } = await request.json();
    
    if (!token || !nuevaContrasena) {
      return NextResponse.json(
        { error: 'Token y nueva contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    // Validar la contraseña
    const validacion = validarContrasena(nuevaContrasena);
    if (!validacion.isValid) {
      return NextResponse.json(
        { error: validacion.message },
        { status: 400 }
      );
    }
    
    const result = await authController.establecerNuevaContrasena(token, { nuevaContrasena });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en POST /api/auth/reset-password:', error);
    
    return NextResponse.json(
      { error: error.message || 'Error al restablecer la contraseña' },
      { status: error.status || 500 }
    );
  }
}