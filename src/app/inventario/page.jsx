"use client"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function InventarioDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/inventario/movimientos")
  }, [router])

  return null // No renderizamos nada ya que redirigimos
}