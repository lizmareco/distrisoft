import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function migrarUsuarios() {
  const filePath = `${path.resolve()}/prisma/seed/permisos.csv`;
  const results = [];

  const promise1 = [
    prisma.ciudad.create({
      data: {
        descCiudad: "San Lorenzo",
        deletedAt: null,
      },
    }),
    prisma.tipoDocumento.create({
      data: {
        descTipoDocumento: "Cedula",
        deletedAt: null,
      },
    }),
    prisma.tipoPersona.create({
      data: {
        descTipoPersona: "Admin",
        deletedAt: null,
      },
    }),
  ];

  const [ciudad, tipoDocumento, tipoPersona] = await Promise.all(promise1);

  const promises = [
    prisma.persona.create({
      data: {
        nombre: "admin",
        apellido: "admin",
        correoPersona: "correo@correo.com",
        fechaNacimiento: new Date(),
        nroDocumento: "12345678",
        direccion: "calle falsa 123",
        nroTelefono: "595995123456",
        // idCiudad: 1,
        ciudad: {
          connect: {
            idCiudad: ciudad.idCiudad,
          },
        },
        tipoDocumento: {
          connect: {
            idTipoDocumento: tipoDocumento.idTipoDocumento,
          },
        },
        tipoPersona: {
          connect: {
            idTipoPersona: tipoPersona.idTipoPersona,
          },
        },
        deletedAt: null,
      },
    }),
    prisma.rol.findFirst({
      where: {
        nombreRol: "admin",
      },
    }),
  ];

  const [persona, rol] = await Promise.all(promises);

  await prisma.usuario.create({
    data: {
      nombreUsuario: "admin",
      estado: "ACTIVO",
      contrasena: await bcrypt.hash("adminPassw0rd", parseInt(process.env.PASSWORD_SALT)),
      idPersona: persona.idPersona,
      idRol: rol.idRol,
    },
  });
}

export default migrarUsuarios;
