'use server'

import { redirect } from 'next/navigation';
import { introspectToken } from '@/lib/auth/introspect';
import Navigation from '../components/Navigation/Navigation';
import Header from '../components/Header/Header';

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    try {
        await introspectToken();
    } catch {
        redirect("/login");
    }

    return <div className="flex h-screen w-screen">
        <aside className="hidden md:flex w-64 border-r flex-col h-screen sticky top-0">
            <Navigation />
        </aside>
        <div className="flex flex-col h-screen w-full overflow-auto">
            <Header />
            <main className="flex-1 flex flex-col h-[calc(100vh-69px)]">
                <>{children}</>
            </main>
        </div>
    </div>
}
