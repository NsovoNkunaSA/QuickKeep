# QuickKeep

QuickKeep stores each signed-in user's links and files in Supabase. Email/password accounts and Google sign-in are supported. Files are held in a private Storage bucket; database and Storage row-level security policies restrict access to the owning user.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` in the project root.
3. In Supabase, open **Project Settings → API** (or **Connect**) and copy the project URL and **publishable key** into `.env`:

	```env
	VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
	VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
	```

	The older `anon` key can also be used as the publishable key value. These are intended for browser use with RLS enabled. **Never put a `service_role` or secret key in a `VITE_` variable or commit it.**

4. In **SQL Editor**, run [`supabase/schema`](supabase/schema.sql) to create the table, policies, and private Storage bucket.
5. In **Authentication → URL Configuration**, set the Site URL to your local origin (usually `http://localhost:5173`) and add it to Redirect URLs.
6. In **Authentication → Providers**, enable Email. Configure whether email confirmation is required for new email/password accounts.
7. Enable Google under **Authentication → Providers → Google**. Create a Google OAuth client in Google Cloud Console, add the Supabase callback URL shown on that provider page as an authorized redirect URI, then paste the Google client ID and client secret into Supabase. Do not put the Google client secret in this repository.
8. Start the app with `npm run dev`.

## Production setup

1. Deploy the Vite app to your hosting provider and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as build environment variables there. Redeploy after changing them.
2. In Supabase **Authentication → URL Configuration**, set **Site URL** to the production origin and add both the production origin and any required preview origins to **Redirect URLs**. A common pair is `https://your-domain.example/**` and `http://localhost:5173/**`.
3. In Google Cloud Console, add your production domain under authorized JavaScript origins. Keep the Supabase callback URI as the authorized redirect URI. The callback normally looks like `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. Verify Email and Google sign-in, sign-out, file upload/download, and account isolation using two separate accounts.

The app uses only the Supabase publishable key in the browser. Authentication tokens identify the user; Postgres RLS and private Storage policies enforce the account boundary. Do not disable those policies in production.
