import { create } from 'zustand';

export type Organization = {
  id: number;
  name: string;
};

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setOrganizations: (orgs: Organization[]) => void;
  setCurrentOrganization: (org: Organization) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  currentOrganization: null,
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setCurrentOrganization: (org) => set({ currentOrganization: org }),
}));