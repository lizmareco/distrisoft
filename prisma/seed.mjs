import migrarPermisoCSV from "./seed/importar_permisos.mjs"
async function main() {

	const subTopics = await migrarPermisoCSV();
}

main();