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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import axios from 'axios';
import { useOrganizationStore } from '@/store/organizationStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Product {
  name: string;
  total_sold: number;
}

export default function TopProductsChart() {
  const [products, setProducts] = useState<Product[]>([]);
  const { currentOrganization } = useOrganizationStore();

  useEffect(() => {
    async function fetchTopProducts() {
      if (!currentOrganization) return;

      try {
        const res = await axios.get<Product[]>(
          `/api/products/top?organizationId=${currentOrganization.id}`
        );
        setProducts(res.data);
      } catch (err) {
        console.error('Error fetching top products:', err);
      }
    }

    fetchTopProducts();
  }, [currentOrganization]);

  const data = {
    labels: products.map((p) => p.name),
    datasets: [
      {
        label: 'Unidades Vendidas',
        data: products.map((p) => p.total_sold),
        backgroundColor: '#10b981',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Top Productos Vendidos</CardTitle>
      </CardHeader>
      <CardContent className="w-full h-full">
        <Bar className="w-full h-full" data={data} options={options} />
      </CardContent>
    </Card>
  );
}
