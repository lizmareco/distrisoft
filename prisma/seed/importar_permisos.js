const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrarPermisoCSV() {
    const filePath = path.join(__dirname, 'prisma', 'seed', 'permisos.csv');
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

