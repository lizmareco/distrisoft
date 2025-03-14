import migrarPermisoCSV from "./seed/importar_permisos.mjs"
import migrarUsuarios from "./seed/importar_usuario.mjs";
async function main() {

	await migrarPermisoCSV();
	// await migrarUsuarios(); 
}

main();