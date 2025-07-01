import { create } from 'zustand';

export enum BusinessType {
  ALMACEN = 'almacen',
  TEXTIL = 'textil'
}

export type Organization = {
  id: number;
  name: string;
  creator: string;
  business_type: BusinessType;
};

export type OrganizationUnjoined = Organization & {
  requested: boolean;
};

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setOrganizations: (orgs: Organization[]) => void;
  setCurrentOrganization: (org: Organization | null) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  currentOrganization: null,
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setCurrentOrganization: (org) => set({ currentOrganization: org }),
}));