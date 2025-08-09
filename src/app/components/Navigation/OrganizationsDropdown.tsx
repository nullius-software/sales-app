'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building, ChevronDown, Search } from 'lucide-react';
import { NavigationOrganizationItem } from './NavigationOrganizationItem';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Organization, useOrganizationStore } from '@/store/organizationStore';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axios, { AxiosResponse } from 'axios';
import { useHeaderMenuStore } from '@/store/headerMenuStore';
import { setOrganizationId } from '@/lib/organization';

export default function OrganizationsDropdown() {
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] =
    useState<Organization>();
  const [confirmInput, setConfirmInput] = useState('');
  const { setSidebarOpen } = useHeaderMenuStore();

  const {
    organizations,
    currentOrganization,
    setOrganizations,
    setCurrentOrganization,
  } = useOrganizationStore();

  const fetchOrganizations = useCallback(async () => {
    try {
      const { data } = await axios.get<null, AxiosResponse<Organization[]>>(
        '/api/organizations/joined',
        { withCredentials: true }
      );

      if (data.length > 0) {
        setOrganizations(data);
      }
    } catch {}
  }, [setOrganizations]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    const updateCurrentOrganization = async () => {
      setCurrentOrganization(organizations[0]);
      await setOrganizationId(organizations[0].id);
    };

    if (!currentOrganization && organizations.length > 0)
      updateCurrentOrganization();
  }, [currentOrganization, organizations, setCurrentOrganization]);

  const switchOrganization = async (orgId: number) => {
    const org = organizations.find((o) => o.id === orgId);
    if (!org) return;

    setCurrentOrganization(org);
    await setOrganizationId(org.id);

    toast(`Cambiado a ${org.name}`);
  };

  const handleDelete = async () => {
    if (!organizationToDelete) return;
    setDialogOpen(false);
    setConfirmInput('');
    setOrganizations(
      organizations.filter((org) => org.id !== organizationToDelete.id)
    );
    setCurrentOrganization(null);

    try {
      await axios.delete(`/api/organizations/${organizationToDelete.id}`);
    } catch {
      toast.error('Algo salió mal al eliminar la organización');
    } finally {
      setOrganizationToDelete(undefined);
      await fetchOrganizations();
    }
  };

  const isMatch =
    organizationToDelete && confirmInput.trim() === organizationToDelete.name;

  return (
    <div>
      <DropdownMenu
        open={dropdownOpen}
        onOpenChange={() => setDropdownOpen(!dropdownOpen)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center w-full justify-between"
          >
            <div className="flex items-center truncate mr-2">
              <Building className="min-w-4 h-4 w-4 mr-2" />
              <span className="truncate">
                {currentOrganization?.name || 'Seleccionar organización'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {organizations.length === 0 ? (
            <DropdownMenuItem disabled>
              No hay organizaciones disponibles
            </DropdownMenuItem>
          ) : (
            organizations.map((org) => (
              <NavigationOrganizationItem
                key={org.id}
                organization={org}
                isCurrent={currentOrganization?.id === org.id}
                onSelect={switchOrganization}
                onDelete={() => {
                  setDropdownOpen(false);
                  setOrganizationToDelete(org);
                  setDialogOpen(true);
                }}
              />
            ))
          )}
          <Separator className="mt-2 mb-1" />
          <DropdownMenuItem
            key={organizations.length}
            onClick={() => {
              router.push('/organizations');
              setSidebarOpen(false);
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            Crear o Buscar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar organización?</AlertDialogTitle>
            <AlertDialogDescription>
              Para eliminar la organización, escribí el nombre{' '}
              <strong>
                {organizationToDelete && organizationToDelete.name}
              </strong>{' '}
              exacto a continuación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Nombre exacto de la organización"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
          />

          <AlertDialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isMatch}
            >
              Confirmar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
