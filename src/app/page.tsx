import { AuthForm } from '@/components/auth-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <main className="w-full max-w-sm">
        <AuthForm />
      </main>
    </div>
  );
}
