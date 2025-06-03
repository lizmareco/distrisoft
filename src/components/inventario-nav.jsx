"use client"

import { Box, Tab, Tabs } from "@mui/material"
import { useRouter } from "next/navigation"

const InventarioNav = ({ activeTab }) => {
  const router = useRouter()

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case "materiasprimas":
        router.push("/inventario/materiaprima")
        break
      case "productos":
        router.push("/inventario/productos")
        break
      case "movimientos":
        router.push("/inventario/movimientos")
        break
      default:
        router.push("/inventario")
    }
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="navegación de inventario"
      >
        <Tab label="Materias Primas" value="materiasprimas" />
        <Tab label="Productos" value="productos" />
        <Tab label="Movimientos" value="movimientos" />
      </Tabs>
    </Box>
  )
}

export default InventarioNav
