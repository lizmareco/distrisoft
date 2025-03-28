import RolesManagement from "@/src/components/roles/RolesManagement"

export default function RolesPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Roles del Sistema</h1>
      <RolesManagement />
    </div>
  )
}

