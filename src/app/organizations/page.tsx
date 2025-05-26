'use client'

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import axios, { AxiosResponse, isAxiosError } from "axios"
import Navigation from "../components/Navigation"
import { Header } from "../components/Header"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Organization, useOrganizationStore } from "@/store/organizationStore"
import { useUserStore } from "@/store/userStore"

type OrganizationsUnjoined = {
  id: number;
  name: string;
  requested: boolean;
};

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationsUnjoined[]>([])
  const [newOrgName, setNewOrgName] = useState("")
  const [creating, setCreating] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [loading, setLoading] = useState(true)

  const {
    organizations,
    setOrganizations,
    setCurrentOrganization
  } = useOrganizationStore();

  const { user } = useUserStore()

  const fetchOrganizations = async () => {
    try {
      const { data } = await axios.get<null, AxiosResponse<OrganizationsUnjoined[]>>('/api/organizations', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      })
      setOrgs(data)
    } catch {
      toast.error("Error al cargar organizaciones.")
    }
  }

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      await fetchOrganizations()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()
  }, [])

  const handleCreate = async () => {
    if (!newOrgName.trim()) return toast.error("El nombre es requerido")
    try {
      setCreating(true)
      const { data } = await axios.post<{ name: string }, AxiosResponse<Organization>>(
        '/api/organizations',
        { name: newOrgName },
        { headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') } }
      )
      toast.success("Organización creada")
      setNewOrgName("")
      setDialogOpen(false)
      setOrganizations([...organizations, data])
      setCurrentOrganization(data)
    } catch (e) {
      if (isAxiosError(e) && e.status === 409) {
        toast.error('El nombre de la organización ya fue usado')
        return
      }
      toast.error("Error al crear organización")
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (id: number) => {
    try {
      setOrgs(orgs.map(org => org.id === id ? { ...org, requested: true } : org))
      await axios.post(`/api/organizations/${id}/join`, { user_id: user?.id }, {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('access_token') }
      })
      toast.success("Solicitud enviada")
    } catch {
      toast.error("Error al solicitar unirse")
    } finally {
      fetchOrganizations()
    }
  }

  const closeMobileMenu = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen">
      {!isMobile && (
        <aside className="hidden md:flex w-64 border-r flex-col h-screen sticky top-0">
          <Navigation closeMobileMenu={closeMobileMenu} />
        </aside>
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <Header
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobile={isMobile}
          closeMobileMenu={closeMobileMenu}
        />

        <main className="w-full max-w-3xl mx-auto py-10 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Unite a una organización</h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Crear organización</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva organización</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Nombre de la organización"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                />
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={creating}>
                    {creating ? "Creando..." : "Crear"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500">Cargando organizaciones...</p>
            ) : orgs.length === 0 ? (
              <p className="text-center text-gray-500">No encontramos ninguna organización. Puedes ver tus organizaciones en la barra de navegación</p>
            ) : (
              orgs.map((org) => (
                <Card key={org.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>{org.name}</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => handleJoin(org.id)}
                      disabled={org.requested}
                    >
                      {org.requested ? "Solicitado" : "Solicitar unirse"}
                    </Button>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div >
  )
}