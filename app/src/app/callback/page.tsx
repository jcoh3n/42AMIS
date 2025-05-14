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
    console.log("Callback page mounted");
    const code = searchParams.get('code');
    console.log("Authorization code present:", code ? "Yes" : "No");
    
    if (!code) {
      console.error("No code found in URL parameters");
      setError('No authorization code received');
      return;
    }
    
    const exchangeCodeForToken = async () => {
      try {
        console.log("Exchanging code for token...");
        // Utiliser notre propre API route pour éviter les problèmes CORS
        const response = await fetch(`/api/auth/callback?code=${code}`);
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Token exchange failed with status ${response.status}:`, errorData);
          throw new Error(`Failed to get access token: ${errorData}`);
        }
        
        const tokenData = await response.json();
        console.log("Token received successfully");
        setToken(tokenData.access_token);
        console.log("Token set in auth context, redirecting to home page");
        
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