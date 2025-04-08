import MUIRegistry from "@/src/lib/mui-registry"
import Navbar from "@/src/components/navbar"
import { RootProvider } from "./context/root"
import "./globals.css" // Si tienes estilos globales


export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <RootProvider>
          <Navbar />
          <MUIRegistry>{children}</MUIRegistry>
        </RootProvider>
      </body>
    </html>
  )
}