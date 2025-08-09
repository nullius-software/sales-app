'use server';

import { cookies } from 'next/headers';

export async function getOrganizationId() {
  const cookieStore = await cookies();
  return cookieStore.get('organizationId')?.value;
}

export async function setOrganizationId(organizationId: number) {
  const cookieStore = await cookies();
  cookieStore.set('organizationId', `${organizationId}`);
}
