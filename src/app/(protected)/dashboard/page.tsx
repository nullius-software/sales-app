'use server';

import AverageTicketChart from '@/app/components/Dashboard/AverageTicketChart';
import DailySalesChart from '@/app/components/Dashboard/DailySalesChart';
import MembersList from '@/app/components/Dashboard/MembersList';
import MetricsSummary from '@/app/components/Dashboard/MetricsSummary';
import SalesByHourChart from '@/app/components/Dashboard/SalesByHourChart';
import DashboardTitle from '@/app/components/Dashboard/Title';
import TopProductsChart from '@/app/components/Dashboard/TopProductsChart';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

export default async function OrganizationDashboardPage() {
  const currentUser = await getCurrentUser()

  return (
    <div className="w-full mx-auto p-4 md:p-8 relative">
      <DashboardTitle />
      <MetricsSummary />
      <div className="grid gap-8 m-8 grid-cols-1 xl:grid-cols-5 auto-rows-[minmax(100px,auto)]">
        <div className="col-span-1 xl:col-span-2 xl:row-span-2">
          {currentUser && <MembersList currentUser={currentUser} />}
        </div>
        <div className="col-span-1 xl:col-span-3 xl:row-span-3">
          <DailySalesChart />
        </div>
        <div className="col-span-1 xl:col-span-2 xl:row-span-3">
          <SalesByHourChart />
        </div>
        <div className="col-span-1 xl:col-span-3 xl:row-span-2">
          <AverageTicketChart />
        </div>
        <div className="col-span-1 xl:col-span-5 xl:row-span-3">
          <TopProductsChart />
        </div>
      </div>
    </div>
  );
}