'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { useOrganizationStore } from '@/store/organizationStore';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function DailySalesChart() {
  const [salesData, setSalesData] = useState<{ date: string; total: number }[]>(
    []
  );
  const { currentOrganization } = useOrganizationStore();

  useEffect(() => {
    async function fetchData() {
      if (!currentOrganization) return;
      const { data } = await axios.get<{ date: string; total: number }[]>(
        '/api/sales/week?organizationId=' + currentOrganization.id
      );
      setSalesData(data);
    }

    fetchData();
  }, [currentOrganization]);

  const chartData = {
    labels: salesData.map((d) => d.date),
    datasets: [
      {
        label: 'Ventas ($)',
        data: salesData.map((d) => d.total),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    indexAxis: 'x' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        min: 0,
      },
    },
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Ventas Diarias</CardTitle>
      </CardHeader>
      <CardContent className="w-full h-full">
        <Line className="w-full h-full" data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}
