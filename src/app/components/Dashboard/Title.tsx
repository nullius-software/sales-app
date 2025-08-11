'use client';

import { useOrganizationStore } from '@/store/organizationStore';

export default function DashboardTitle() {
  const { currentOrganization } = useOrganizationStore();

  return (
    <h1 className="text-3xl font-bold mb-8">{currentOrganization?.name}</h1>
  );
}
