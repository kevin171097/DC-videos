import { createClient } from '@supabase/supabase-js';
import { auth } from './firebaseClient';

// Firebase ID tokens are validated by Supabase Third-Party Auth.
// Keep the bucket private; Storage policies decide who can upload/read.
export const supabase = createClient(
  'https://hfkudvlvecnuflfvttoj.supabase.co',
  'sb_publishable_d3-4ckOwkBFjpp_kNMR8PQ_rnw67jwY',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    accessToken: async () => {
      const user = auth.currentUser;
      return user ? await user.getIdToken() : '';
    },
  }
);
