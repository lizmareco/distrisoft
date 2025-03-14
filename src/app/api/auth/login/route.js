import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from '@/settings';
import AuthController from '@/src/backend/controllers/auth-controller';
import { HTTP_STATUS_CODES } from '@/src/lib/http/http-status-code';
import { emailRegex, passwordRegex } from '@/src/lib/regex';
import CustomError from '@/src/lib/errors/custom-errors';
import { NextResponse } from 'next/server';


const validateLoginForm = (loginForm) => {
  if(!loginForm.email || !loginForm.password) {
    throw new CustomError('Correo electrónico o contraseña incorrecta', HTTP_STATUS_CODES.forbidden);
  }

  // delete white spaces
  loginForm.email = loginForm.email.trim();
  loginForm.password = loginForm.password.trim();
  if(!emailRegex.test(loginForm.email)) {
    throw new CustomError('Correo electrónico o contraseña incorrecta', HTTP_STATUS_CODES.forbidden);
  }
  if(!passwordRegex.test(loginForm.password)) {
    throw new CustomError('Correo electrónico o contraseña incorrecta', HTTP_STATUS_CODES.forbidden);
  }

  return loginForm;
}


export async function POST(request) {
  try {
    const authController = new AuthController();
    const accessToken = await authController.hasAccessToken(request);
    if(accessToken) {
      return NextResponse.json(
        { accessToken, message: 'Ya has iniciado sesión' },
        { status: HTTP_STATUS_CODES.ok }
      );
    }

    let loginForm = await request.json();
    
    const tokens = await authController.login(loginForm);

    if(!tokens) {
      return NextResponse.json(
        { message: '¡Correo electrónico o contraseña incorrecta!' },
        { status: HTTP_STATUS_CODES.forbidden }
      );
    }
    
    const response = NextResponse.json(
      { accessToken: tokens.accessToken },
      { status: HTTP_STATUS_CODES.ok }
    );
    response.cookies.set('at', tokens.accessToken, {
      httpOnly: true,
      maxAge: ACCESS_TOKEN_MAX_AGE,
      secure: false,
      sameSite: 'lax'
    });

    response.cookies.set('rt', tokens.refreshToken, {
      httpOnly: true,
      maxAge: REFRESH_TOKEN_MAX_AGE,
      secure: false,
      sameSite: 'lax'
    });

    return response;
  } catch(error) {
    if(error.isCustom) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    } else {
      console.error('Error in /api/login: ', JSON.stringify(error, null, 2));
      return NextResponse.json({ message: 'Ha ocurrido un error' }, { status: HTTP_STATUS_CODES.internalServerError });
    }
  }
}