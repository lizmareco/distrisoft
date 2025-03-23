import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function migrarPermisoCSV() {
  const filePath = `${path.resolve()}/prisma/seed/permisos.csv`;
  const results = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          const permisosCreados = [];

          // Crear permisos
          for (const record of results) {
            const permiso = await prisma.permiso.create({
              data: {
                nombrePermiso: record.permissions,
              },
            });
            permisosCreados.push(permiso);
          }
          console.log("Importación de permisos completada.");

          const adminRol = await prisma.rol.create({
            data: {
              nombreRol: "admin",
            },
          });

          const promises = permisosCreados.map(async (permiso) => {
            return prisma.rolPermiso.create({
              data: {
                idPermiso: permiso.idPermiso,
                idRol: adminRol.idRol,
              },
            });
          });

          await Promise.all(promises);
          console.log("Rol admin creado con todos los permisos.");

          resolve();
        } catch (error) {
          console.error("Error al insertar datos:", error);
          reject(error);
        } finally {
          await prisma.$disconnect();
        }
      });
  });
}

export default migrarPermisoCSV;
