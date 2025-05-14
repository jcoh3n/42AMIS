'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAccessToken } from '@/lib/api42';
import { useAuth } from '@/contexts/AuthContext';

function CallbackContent() {
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setToken } = useAuth();
  
  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code received');
      return;
    }
    
    const exchangeCodeForToken = async () => {
      try {
        // NOTE: In a production environment, you would handle this exchange on the server-side
        // We're doing it client-side for simplicity, but this is not secure for a real application
        // This is where you would use a serverless function or API route
        const clientSecret = process.env.CLIENT_SECRET;
        
        if (!clientSecret) {
          throw new Error('Missing CLIENT_SECRET environment variable');
        }
        
        const tokenData = await getAccessToken(code, clientSecret);
        setToken(tokenData.access_token);
        
        // Redirect to the home page
        router.push('/');
      } catch (err) {
        console.error('Error exchanging code for token:', err);
        setError('Failed to complete authentication');
      }
    };
    
    exchangeCodeForToken();
  }, [searchParams, router, setToken]);
  
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="p-6 bg-white rounded-lg shadow-md">
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <div>
            <h1 className="text-xl font-bold mb-4">Authenticating...</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Callback() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <div>
            <h1 className="text-xl font-bold mb-4">Loading...</h1>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
} 