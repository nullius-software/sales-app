import { create } from 'zustand';
import Cookies from 'js-cookie';

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

const getInitialOrganization = (): Organization | null => {
    if (typeof window === 'undefined') {
        return null;
    }
    const orgCookie = Cookies.get('currentOrganization');
    if (orgCookie) {
        try {
            return JSON.parse(orgCookie);
        } catch (e) {
            console.error("Failed to parse organization cookie:", e);
            return null;
        }
    }
    return null;
};

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  currentOrganization: getInitialOrganization(),
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setCurrentOrganization: (org: Organization | null) => {
    set({ currentOrganization: org });
    if (org) {
      Cookies.set('currentOrganization', JSON.stringify(org), { expires: 7 }); // Expires in 7 days
    } else {
      Cookies.remove('currentOrganization');
    }
  },
}));