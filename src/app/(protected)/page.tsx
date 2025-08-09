export const dynamic = 'force-dynamic';

import { ProductList } from '../components/home/ProductList';
import { SelectedProducts } from '../components/home/SelectedProducts';
import { cookies } from 'next/headers';
import { Organization } from '@/store/organizationStore';
import { Product } from '@/interfaces/product';
import { PaginationData } from '@/interfaces/pagination';
import { redirect } from 'next/navigation'

async function getProducts(organizationId: number, page = 1): Promise<{ products: Product[], pagination: PaginationData }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/products?organization_id=${organizationId}&page=${page}&limit=5`, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return { products: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } };
  }
}


export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const cookieStore = cookies();
  const orgCookie = cookieStore.get('currentOrganization');

  let currentOrganization: Organization | null = null;
  if (orgCookie) {
    try {
      currentOrganization = JSON.parse(orgCookie.value);
    } catch (e) {
      console.error("Failed to parse organization cookie:", e);
    }
  }

  // Redirect if the cookie org is different from the search param org
  if (
    searchParams.org_id &&
    currentOrganization &&
    String(currentOrganization.id) !== searchParams.org_id
  ) {
    redirect(`/?org_id=${currentOrganization.id}`);
  }

  const pageValue = searchParams.page;
  const page = typeof pageValue === 'string' ? Number(pageValue) : 1;

  let initialProducts: Product[] = [];
  let initialPagination: PaginationData = { total: 0, page: 1, limit: 5, totalPages: 0 };

  if (currentOrganization) {
    const { products, pagination } = await getProducts(currentOrganization.id, page);
    initialProducts = products;
    initialPagination = pagination;
  }

  return (
    <div className="lg:p-6 flex-1 flex flex-col">
      <div className='flex flex-col xl:flex-row xl:gap-4'>
        <div className='xl:flex-7/12'>
          <ProductList initialProducts={initialProducts} initialPagination={initialPagination} />
        </div>
        <div className='sticky bottom-2 left-0 right-0 mx-auto my-2  w-11/12 xl:w-full xl:flex-5/12 min-w-80 z-20 h-min'>
          <SelectedProducts />
        </div>
      </div>
    </div>
  );
}
