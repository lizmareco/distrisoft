import { PrismaClient } from "@prisma/client";
import csv from "csv-parser";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

async function migrarPermisos() {
  try {
    console.log("Iniciando importación de permisos...");
    
    // 1. Configurar rutas
    const filePath = path.join(process.cwd(), "prisma", "seed", "permisos.csv");
    
    // 2. Verificar archivo
    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    // 3. Leer y transformar CSV
    const permisos = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv({ separator: "," }))
        .on("data", (row) => {
          // Extraer todos los permisos de cada fila
          Object.values(row).forEach(val => {
            if (val && val !== "TABLAS") {
              results.push({ nombrePermiso: val });
            }
          });
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });

    console.log(`Encontrados ${permisos.length} permisos para importar`);

    // 4. Eliminar permisos duplicados
    const permisosUnicos = [...new Map(permisos.map(item => 
      [item.nombrePermiso, item])).values()];

    // 5. Crear permisos en la base de datos
    const created = await prisma.$transaction([
      prisma.permiso.deleteMany(), // Limpiar tabla primero
      ...permisosUnicos.map(permiso => 
        prisma.permiso.create({ data: permiso }))
    ]);

    console.log(`Creados ${created.length - 1} permisos`);

    // 6. Crear rol admin si no existe
    let admin = await prisma.rol.findFirst({ 
      where: { nombreRol: "admin" }
    });

    if (!admin) {
      admin = await prisma.rol.create({
        data: { nombreRol: "admin" }
      });
      console.log("Rol admin creado");
    }

    // 7. Asignar todos los permisos al admin
    const allPermisos = await prisma.permiso.findMany();
    await prisma.rolPermiso.createMany({
      data: allPermisos.map(p => ({
        idRol: admin.idRol,
        idPermiso: p.idPermiso
      })),
      skipDuplicates: true
    });

    console.log(`Asignados ${allPermisos.length} permisos al rol admin`);
    console.log("Importación completada con éxito!");

  } catch (error) {
    console.error("Error en la importación:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrarPermisos();