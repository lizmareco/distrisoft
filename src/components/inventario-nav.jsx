"use client"

import { Box, Tabs, Tab } from "@mui/material"
import { useRouter } from "next/navigation"

export default function InventarioNav({ activeTab = "materias" }) {
  const router = useRouter()

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case "materias":
        router.push("/inventario/materiaprima")
        break
      case "productos":
        router.push("/inventario/productos")
        break
      case "movimientos":
        router.push("/inventario")
        break
      case "reportes":
        router.push("/inventario/reporte")
        break
      default:
        router.push("/inventario/materiaprima")
    }
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs value={activeTab} onChange={handleChange} aria-label="inventario navigation tabs">
        <Tab label="Materias Primas" value="materias" />
        <Tab label="Productos" value="productos" />
        <Tab label="Movimientos" value="movimientos" />
        <Tab label="Reportes" value="reportes" />
      </Tabs>
    </Box>
  )
}
