"use client"
import * as XLSX from "xlsx"
import { Button } from "@mui/material"
import FileDownloadIcon from "@mui/icons-material/FileDownload"

const ExportarExcel = ({
  datos,
  nombreArchivo,
  nombreHoja = "Hoja1",
  textoBoton = "Exportar a Excel",
  columnas = null,
}) => {
  const exportarAExcel = () => {
    // Si se proporcionaron columnas específicas, filtrar los datos
    const datosAExportar = columnas
      ? datos.map((item) => {
          const nuevoItem = {}
          columnas.forEach((col) => {
            nuevoItem[col.header] = col.accessor(item)
          })
          return nuevoItem
        })
      : datos

    const worksheet = XLSX.utils.json_to_sheet(datosAExportar)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, nombreHoja)

    // Auto-ajustar columnas
    const anchoMaximo = datosAExportar.reduce((w, r) => {
      return Object.keys(r).reduce((ww, k) => {
        return Math.max(ww, k.length, String(r[k]).length)
      }, w)
    }, 10)

    const colWidth = [{ wch: anchoMaximo }]
    worksheet["!cols"] = colWidth

    // Generar archivo Excel
    XLSX.writeFile(workbook, `${nombreArchivo}.xlsx`)
  }

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<FileDownloadIcon />}
      onClick={exportarAExcel}
      sx={{ ml: 2 }}
    >
      {textoBoton}
    </Button>
  )
}

export default ExportarExcel
