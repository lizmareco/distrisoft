import migrarPermisoCSV from "./seed/importar_permisos"
async function main() {

	const subTopics = await migrarPermisoCSV();
}

main();