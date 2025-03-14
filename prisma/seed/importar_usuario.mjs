import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import path from 'path';
import fs from 'fs';


const prisma = new PrismaClient();

async function migrarUsuarios() {
    const filePath = `${path.resolve()}/prisma/seed/permisos.csv`;
    const results = [];
    
    const promises = [
      prisma.persona.create({
        data: {
          nombre: 'admin',
          apellido: 'admin',
          correoPersona: 'correo@correo.com',
          fechaNacimiento: new Date(),
          nroDocumento: '12345678',
          direccion: 'calle falsa 123',
          nroTelefono: '595995123456'
        }
      }),
      prisma.rol.findFirst({
        where: {
          nombreRol: 'admin'
        }
      })
    ]

    const [persona, rol] = await Promise.all(promises);


    const user = await prisma.usuario.create({
      data: {
        nombreUsuario: 'admin',
        estado: 'ACTIVO',
        contrasena: 'asdfasfd',
        idPersona: persona.id,
        idRol: rol.id,
        idPersona: persona.id
      }
    })

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    for (const record of results) {
                        await prisma.permiso.create({
                            data: {
                                nombrePermiso: record.permissions
                            }
                        });
                    }
                    console.log('Importación completada.');
                    resolve();
                } catch (error) {
                    console.error('Error al insertar datos:', error);
                    reject(error);
                } finally {
                    await prisma.$disconnect();
                }
            });
    });
}

export default migrarUsuarios