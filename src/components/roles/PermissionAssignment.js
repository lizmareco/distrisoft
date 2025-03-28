"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Label } from "@/src/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Separator } from "@/src/components/ui/separator"
import { useToast } from "@/src/hooks/use-toast"
import { Search } from "lucide-react"
import { Input } from "@/src/components/ui/input"
import { fetchPermissions } from "@/src/lib/api/permissions"
import { updateRolePermissions } from "@/src/lib/api/roles"

export default function PermissionAssignment({ role, onSuccess, onCancel }) {
  const [permissions, setPermissions] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (role) {
      // Extract permission IDs from role
      const assignedPermissionIds = role.rolPermiso ? role.rolPermiso.map((rp) => rp.permiso.idPermiso) : []

      setSelectedPermissions(assignedPermissionIds)
    }

    fetchAllPermissions()
  }, [role])

  const fetchAllPermissions = async () => {
    try {
      setLoadingPermissions(true)
      const data = await fetchPermissions()
      setPermissions(data)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los permisos",
        variant: "destructive",
      })
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId)
      } else {
        return [...prev, permissionId]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Obtener permisos actuales
      const currentPermissionIds = role.rolPermiso ? role.rolPermiso.map((rp) => rp.permiso.idPermiso) : []

      // Permisos a agregar
      const permissionIdsToAdd = selectedPermissions.filter((id) => !currentPermissionIds.includes(id))

      // Permisos a quitar
      const permissionIdsToRemove = currentPermissionIds.filter((id) => !selectedPermissions.includes(id))

      // Actualizar permisos
      await updateRolePermissions(role.idRol, {
        permissionIdsToAdd,
        permissionIdsToRemove,
      })

      toast({
        title: "Permisos actualizados",
        description: "Los permisos del rol han sido actualizados exitosamente",
      })

      onSuccess()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter permissions based on search term
  const filteredPermissions = permissions.filter((permission) =>
    permission.nombrePermiso.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Group permissions by category (if available)
  const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
    const category = permission.categoria || "General"
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
    return groups
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestionar Permisos - {role.nombreRol}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar permisos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {loadingPermissions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">{category}</h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                    {perms.map((permission) => (
                      <div key={permission.idPermiso} className="flex items-center space-x-2">
                        <Checkbox
                          id={`permission-${permission.idPermiso}`}
                          checked={selectedPermissions.includes(permission.idPermiso)}
                          onCheckedChange={() => handlePermissionToggle(permission.idPermiso)}
                        />
                        <Label htmlFor={`permission-${permission.idPermiso}`} className="text-sm cursor-pointer">
                          {permission.nombrePermiso}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredPermissions.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  {searchTerm
                    ? "No se encontraron permisos que coincidan con la búsqueda"
                    : "No hay permisos disponibles"}
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
              <div>
                <p className="text-sm font-medium">Permisos seleccionados</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPermissions.length} de {permissions.length} permisos
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions([])}
                  disabled={selectedPermissions.length === 0}
                >
                  Deseleccionar todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPermissions(permissions.map((p) => p.idPermiso))}
                  disabled={selectedPermissions.length === permissions.length}
                >
                  Seleccionar todos
                </Button>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Permisos"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

