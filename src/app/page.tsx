import { AuthForm } from '@/components/auth-form';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background">
       <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-8 px-4 md:grid-cols-2 md:px-8">
            <div className="flex flex-col items-start">
                <AuthForm />
            </div>
            <div className="hidden md:flex items-center justify-center">
                 <Image 
                    src="https://pouynmrblzvwlhrfyins.supabase.co/storage/v1/object/public/icons/imags/Office%20Working%201.png" 
                    alt="Assistei Login" 
                    width={400} 
                    height={400}
                    className="size-[400px]"
                    priority
                />
            </div>
       </div>
    </div>
  );
}
