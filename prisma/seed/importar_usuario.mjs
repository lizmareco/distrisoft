import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs"

const prisma = new PrismaClient();
const SALT_ROUNDS = parseInt(process.env.PASSWORD_SALT) || 17;

async function configurarAdmin() {
  try {
    console.log("🚀 Iniciando configuración del usuario admin...");

    // 1. Buscar usuario existente
    const usuarioExistente = await prisma.usuario.findFirst({
      where: { nombreUsuario: "admin" },
      include: { persona: true, rol: true }
    });

    const contrasenaHash = await bcrypt.hash("Admin123!", SALT_ROUNDS);

    // 2. Actualizar o crear usuario
    if (usuarioExistente) {
      console.log("🔄 Usuario admin existente encontrado, actualizando...");
      
      // Actualización CORREGIDA usando la relación 'rol' en lugar de 'idRol'
      await prisma.usuario.update({
        where: { idUsuario: usuarioExistente.idUsuario },
        data: {
          contrasena: contrasenaHash,
          rol: {
            connect: { idRol: 1 } // Forma correcta de actualizar la relación
          },
          estado: "ACTIVO",
          persona: {
            update: {
              nombre: "Admin",
              apellido: "Sistema",
              correoPersona: "admin@distrisoft.com"
            }
          }
        }
      });
    } else {
      console.log("🆕 Creando nuevo usuario admin...");
      
      // Creación CORREGIDA usando la relación 'rol'
      await prisma.usuario.create({
        data: {
          nombreUsuario: "admin",
          contrasena: contrasenaHash,
          estado: "ACTIVO",
          rol: {
            connect: { idRol: 1 } // Forma correcta de establecer la relación
          },
          persona: {
            create: {
              nombre: "Admin",
              apellido: "Sistema",
              correoPersona: "admin@distrisoft.com",
              fechaNacimiento: new Date("1980-01-01"),
              nroDocumento: "12345678",
              direccion: "Sede Central",
              nroTelefono: "595981123456",
              idCiudad: 1,
              idTipoDocumento: 1
            }
          }
        }
      });
    }

    console.log("🎉 Configuración completada exitosamente!");

  } catch (error) {
    console.error("❌ Error crítico:", error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
configurarAdmin();