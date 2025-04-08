// src/backend/services/email-service.js
import { Resend } from 'resend';

// Inicializar Resend con tu API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un correo de recuperación de contraseña
 * @param {string} destinatario - Correo del destinatario
 * @param {string} token - Token de recuperación
 * @param {string} nombre - Nombre del usuario
 * @returns {Promise<boolean>} - True si el correo se envió correctamente
 */
export async function enviarCorreoRecuperacion(destinatario, token, nombre) {
  try {
    console.log('Intentando enviar correo a:', destinatario);
    
    // URL de tu frontend para resetear la contraseña
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
    console.log('URL de restablecimiento:', resetUrl);
    
    // Enviar correo usando Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Sistema de Recuperación <onboarding@resend.dev>',
      to: destinatario,
      subject: 'Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Recuperación de Contraseña</h2>
          <p>Hola ${nombre || 'Usuario'},</p>
          <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Restablecer Contraseña</a>
          </div>
          <p>O copia y pega el siguiente enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
          <p><strong>Este enlace expirará en 24 horas.</strong></p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="color: #777; font-size: 12px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
      `
    });
    
    if (error) {
      console.error('Error de Resend:', error);
      throw new Error(error.message);
    }
    
    console.log('Correo enviado exitosamente a:', destinatario, 'ID:', data.id);
    return true;
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    console.error('Detalles del error:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    throw error;
  }
}