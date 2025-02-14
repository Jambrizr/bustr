import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Adjust these imports to match your project structure:
import { supabase } from '@/lib/auth';       // your Supabase client
import { Button } from '@/components/ui/button'; 
import { AlertCircle, CheckCircle2, Mail } from 'lucide-react';

type VerifyStatus = 'verifying' | 'success' | 'error';

export default function VerifyEmail() {
  const [status, setStatus] = useState<VerifyStatus>('verifying');
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        // 1. Parse the URL hash. 
        // Example: #access_token=abc123&refresh_token=xyz123&type=signup&expires_in=3600
        const rawHash = window.location.hash.substring(1); // remove leading '#'
        const hashParams = new URLSearchParams(rawHash);

        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type'); // e.g. 'signup' or 'recovery'
        const refreshToken = hashParams.get('refresh_token');

        if (!type || !accessToken) {
          // If we don't have both, we can't verify
          throw new Error('Invalid or missing token. Please use the link from your email.');
        }

        // 2. Many times, Supabase automatically verifies + logs the user in 
        //    using this hash token. Let's see if there's already a session:
        //    If so, they might be good to go. 
        const { data: sessionCheck, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // 3. If we do have a session, user is presumably verified
        if (sessionCheck?.session) {
          setStatus('success');
          // Optionally redirect after a delay
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // 4. If we *don't* have a session, let's try calling `verifyOtp` manually.
        //    This is especially needed if the auto-verification didn't happen for some reason.
        //    If your link also has the user's email, you can pass it here. 
        //    E.g. if the link has `&email=user@example.com` in the hash, parse it out:
        // const email = hashParams.get('email');

        // If you do have the email from the hash, pass it in. Otherwise, you can skip or 
        // call setSession(...) manually. For now, let's just do a direct verify call:
        const { error: verifyError } = await supabase.auth.verifyOtp({
          // email,   // If you have the user’s email from the hash
          token: accessToken,
          type: type as 'signup' | 'recovery', 
        });
        if (verifyError) {
          throw new Error(verifyError.message);
        }

        // 5. Check session again after verifying
        const { data: finalCheck } = await supabase.auth.getSession();
        if (finalCheck?.session) {
          setStatus('success');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          throw new Error('Unable to confirm session after verification.');
        }

      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
      }
    };

    verify();
  }, [navigate]);

  // Basic UI states
  return (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        {status === 'verifying' && (
          <>
            <Mail className="w-16 h-16 mx-auto text-coral-500 animate-pulse" />
            <h1 className="text-2xl font-bold">Verifying Your Email...</h1>
            <p className="text-text-light/60 dark:text-text-dark/60">
              Please wait while we process your email verification.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-status-success" />
            <h1 className="text-2xl font-bold">Email Verified!</h1>
            <p className="text-text-light/60 dark:text-text-dark/60">
              Your account has been successfully verified. You will be redirected to the login page shortly.
            </p>
            <Button 
              onClick={() => navigate('/login')}
              className="mt-4 bg-coral-500 hover:bg-coral-hover text-white"
            >
              Go to Login
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 mx-auto text-status-error" />
            <h1 className="text-2xl font-bold">Verification Failed</h1>
            <p className="text-status-error">{error}</p>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="mt-4"
            >
              Return Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
