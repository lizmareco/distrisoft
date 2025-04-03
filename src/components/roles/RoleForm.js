"use client"

import { useState, useEffect } from "react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Label } from "@/src/components/ui/label"
import { Checkbox } from "@/src/components/ui/checkbox"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Separator } from "@/src/components/ui/separator"
import { useToast } from "@/src/hooks/use-toast"
import { createRole, updateRole } from "@/src/lib/api/roles"
import { fetchPermissions } from "@/src/lib/api/permissions"

export default function RoleForm({ role = null, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    nombreRol: "",
  })
  const [permissions, setPermissions] = useState([])
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(false)
  const [errors, setErrors] = useState({})
  const { toast } = useToast()
  const isEditing = !!role

  useEffect(() => {
    fetchAllPermissions()
    
    if (role) {
      setFormData({
        nombreRol: role.nombreRol || "",
      })
      
      // Si estamos editando, cargamos los permisos ya asignados
      if (role.rolPermiso) {
        const assignedPermissionIds = role.rolPermiso.map(rp => rp.permiso.idPermiso)
        setSelectedPermissions(assignedPermissionIds)
      }
    }
  }, [role])

  const fetchAllPermissions = async () => {
    try {
      setLoadingPermissions(true)
      // Asegúrate de que esta función apunte a la ruta correcta (/api/permiso)
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

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombreRol.trim()) {
      newErrors.nombreRol = "El nombre del rol es obligatorio"
    }
    
    // Validación para asegurar que al menos un permiso esté seleccionado
    if (selectedPermissions.length === 0) {
      newErrors.permissions = "Debe seleccionar al menos un permiso"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
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
    
    // Limpiar error de permisos si se selecciona alguno
    if (errors.permissions && selectedPermissions.length > 0) {
      setErrors((prev) => ({
        ...prev,
        permissions: undefined,
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const dataToSend = {
        nombreRol: formData.nombreRol,
      }

      if (isEditing) {
        await updateRole(role.idRol, {
          roleData: dataToSend,
          permissionIds: selectedPermissions,
        })
      } else {
        await createRole({
          roleData: dataToSend,
          permissionIds: selectedPermissions,
        })
      }

      toast({
        title: isEditing ? "Rol actualizado" : "Rol creado",
        description: isEditing ? "El rol ha sido actualizado exitosamente" : "El rol ha sido creado exitosamente",
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Rol" : "Crear Nuevo Rol"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombreRol">
              Nombre del Rol <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nombreRol"
              name="nombreRol"
              value={formData.nombreRol}
              onChange={handleChange}
              placeholder="Ej: Administrador"
              className={errors.nombreRol ? "border-destructive" : ""}
            />
            {errors.nombreRol && <p className="text-sm text-destructive">{errors.nombreRol}</p>}
          </div>
          
          {/* Sección de permisos */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-between items-center">
              <Label>
                Permisos <span className="text-destructive">*</span>
              </Label>
              <span className="text-sm text-muted-foreground">
                Seleccionados: {selectedPermissions.length}
              </span>
            </div>
            <Separator />
            
            {loadingPermissions ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {permissions.length > 0 ? (
                  permissions.map((permission) => (
                    <div key={permission.idPermiso} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.idPermiso}`}
                        checked={selectedPermissions.includes(permission.idPermiso)}
                        onCheckedChange={() => handlePermissionToggle(permission.idPermiso)}
                      />
                      <Label 
                        htmlFor={`permission-${permission.idPermiso}`} 
                        className="text-sm cursor-pointer"
                      >
                        {permission.nombrePermiso}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-full">
                    No hay permisos disponibles
                  </p>
                )}
              </div>
            )}
            
            {errors.permissions && (
              <p className="text-sm text-destructive">{errors.permissions}</p>
            )}
            
            {/* Botones para seleccionar/deseleccionar todos los permisos */}
            <div className="flex justify-end gap-2 pt-2">
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
                onClick={() => setSelectedPermissions(permissions.map(p => p.idPermiso))}
                disabled={selectedPermissions.length === permissions.length || permissions.length === 0}
              >
                Seleccionar todos
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}