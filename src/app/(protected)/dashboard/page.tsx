'use server';

import MembersList from '@/app/components/Dashboard/MembersList';
import DashboardTitle from '@/app/components/Dashboard/Title';

export default async function OrganizationDashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <DashboardTitle />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <MembersList />
      </div>
    </div>
  );
}