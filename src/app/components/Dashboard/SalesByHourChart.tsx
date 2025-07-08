'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { useOrganizationStore } from '@/store/organizationStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function SalesByHourChart() {
  const [hourlyData, setHourlyData] = useState<{ label: string; total: number }[]>([]);
  const { currentOrganization } = useOrganizationStore();

  useEffect(() => {
    async function fetchData() {
      if (!currentOrganization) return;

      const res = await axios.get('/api/sales/by-hour?organizationId=' + currentOrganization.id);
      setHourlyData(res.data);
    }

    fetchData();
  }, [currentOrganization]);

  const data = {
    labels: hourlyData.map(d => d.label),
    datasets: [
      {
        label: 'Ventas ($)',
        data: hourlyData.map(d => d.total),
        backgroundColor: '#6366f1',
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        min: 0,
      },
    },
  };

  return (
    <Card className='w-full h-full'>
      <CardHeader>
        <CardTitle>Ventas por Hora</CardTitle>
      </CardHeader>
      <CardContent className='h-full'>
        <Bar className='h-full' data={data} options={options} />
      </CardContent>
    </Card>
  );
}
