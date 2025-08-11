import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Chat from './chat';
import { getCurrentUser } from '@/lib/auth/getCurrentUser';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <div className="flex flex-col flex-1 p-4 bg-gray-50">
      <Card className="m-4 h-full">
        <CardHeader>
          <CardTitle>Asistente Nullius</CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          <Chat userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
