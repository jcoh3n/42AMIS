'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
        // Utiliser notre propre API route pour éviter les problèmes CORS
        const response = await fetch(`/api/auth/callback?code=${code}`);
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to get access token: ${errorData}`);
        }
        
        const tokenData = await response.json();
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