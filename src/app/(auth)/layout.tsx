'use server';

import { redirect } from 'next/navigation';
import { introspectToken } from '@/lib/auth/introspect';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await introspectToken();
  } catch {
    return <main className="h-screen w-screen overflow-auto">{children}</main>;
  }

  redirect('/');
}
