import * as XLSX from "xlsx"

/**
 * Exporta datos a un archivo Excel
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {string} fileName - Nombre del archivo sin extensión
 */
export const exportToExcel = (data, fileName) => {
  try {
    // Crear un libro de trabajo
    const workbook = XLSX.utils.book_new()

    // Convertir los datos a una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, "Datos")

    // Generar el archivo y descargarlo
    XLSX.writeFile(workbook, `${fileName}.xlsx`)
  } catch (error) {
    console.error("Error al exportar a Excel:", error)
    throw error
  }
}

/**
 * Exporta datos a un archivo CSV
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {string} fileName - Nombre del archivo sin extensión
 */
export const exportToCSV = (data, fileName) => {
  try {
    // Convertir los datos a una hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Convertir la hoja a CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet)

    // Crear un blob con el contenido CSV
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })

    // Crear un enlace para descargar el archivo
    const link = document.createElement("a")

    // Crear una URL para el blob
    const url = URL.createObjectURL(blob)

    // Configurar el enlace
    link.href = url
    link.setAttribute("download", `${fileName}.csv`)

    // Añadir el enlace al documento
    document.body.appendChild(link)

    // Simular clic en el enlace para iniciar la descarga
    link.click()

    // Limpiar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error al exportar a CSV:", error)
    throw error
  }
}

/**
 * Función alternativa para exportar a CSV sin depender de xlsx
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {string} fileName - Nombre del archivo sin extensión
 */
export const exportToCSVNative = (data, fileName) => {
  try {
    if (!data || !data.length) {
      throw new Error("No hay datos para exportar")
    }

    // Obtener las cabeceras (nombres de las propiedades)
    const headers = Object.keys(data[0])

    // Crear la línea de cabeceras
    let csvContent = headers.join(",") + "\n"

    // Añadir los datos
    data.forEach((item) => {
      const row = headers.map((header) => {
        // Escapar comillas y formatear correctamente para CSV
        const cell = item[header] === null || item[header] === undefined ? "" : String(item[header])
        return `"${cell.replace(/"/g, '""')}"`
      })
      csvContent += row.join(",") + "\n"
    })

    // Crear un blob con el contenido CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

    // Crear un enlace para descargar el archivo
    const link = document.createElement("a")

    // Crear una URL para el blob
    const url = URL.createObjectURL(blob)

    // Configurar el enlace
    link.href = url
    link.setAttribute("download", `${fileName}.csv`)

    // Añadir el enlace al documento
    document.body.appendChild(link)

    // Simular clic en el enlace para iniciar la descarga
    link.click()

    // Limpiar
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error al exportar a CSV:", error)
    throw error
  }
}

