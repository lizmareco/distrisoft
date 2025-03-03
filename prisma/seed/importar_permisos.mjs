import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function migrarPermisoCSV() {
    const filePath = `${path.resolve()}/prisma/seed/permisos.csv`;
    const results = [];
    
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

export default migrarPermisoCSV