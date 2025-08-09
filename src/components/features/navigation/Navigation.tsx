'use server';

import { decodeAccessToken } from '@/lib/auth/decodeAccessToken';
import NavigationLogOutButton from './NavigationLogOutButton';
import OrganizationsDropdown from './OrganizationsDropdown';
import NavigationLinks from './NavigationLinks';

export default async function Navigation() {
    const { email } = await decodeAccessToken();

    return (
        <div className="flex flex-col h-full py-6 px-2">
            <div className="px-4 mb-6">
                <p className="text-sm text-gray-500">Sesión iniciada como</p>
                <p className="font-medium w-full truncate">{email}</p>
            </div>
            <div className="flex-grow flex flex-col justify-center">
                <div className="mb-12">
                    <h2 className="text-lg font-semibold px-4 mb-2">Organizaciones</h2>
                    <div className="px-4">
                        <OrganizationsDropdown />
                    </div>
                </div>
                <div className="mb-12">
                    <h2 className="text-lg font-semibold px-4 mb-2">Navegación</h2>
                    <NavigationLinks />
                </div>
            </div>

            <div className="mt-auto px-4">
                <NavigationLogOutButton />
            </div>
        </div>
    );
}
