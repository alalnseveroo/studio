'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { OtpVerificationForm } from '@/components/otp-verification-form'

function VerifyOtpPageContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <main>
        <OtpVerificationForm email={email || ''} />
      </main>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpPageContent />
    </Suspense>
  )
}
