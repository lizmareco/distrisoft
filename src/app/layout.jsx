import Navbar from "@/src/components/navbar"
import { RootProvider } from "./context/root"

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <RootProvider>
          <Navbar />
          <main>{children}</main>
        </RootProvider>
      </body>
    </html>
  )
}

