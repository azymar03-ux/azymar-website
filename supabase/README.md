# Supabase Setup Guide for AZYMAR

To set up the backend database and storage for the AZYMAR gaming platform, follow these steps in your Supabase dashboard:

## 1. Database Schema & Initial Data Seeding

1. Open your project on the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** from the left sidebar.
3. Click **New query** and name it `1_schema.sql`.
4. Copy and paste the contents of [supabase/schema.sql](./schema.sql) and run it to create tables (`games`, `subscribers`, `favorites`, `play_history`) and their Row Level Security (RLS) policies.
5. Create another new query named `2_seed.sql`.
6. Copy and paste the contents of [supabase/seed.sql](./seed.sql) and run it to seed the 9 default games.

## 2. Storage Setup for Game Uploads

The admin panel allows uploading custom games in ZIP formats. To handle this, we need a Supabase Storage Bucket:

1. In the Supabase Dashboard, navigate to **Storage** from the left sidebar.
2. Click **New bucket**.
3. Set the Bucket Name to: **`game-files`**.
4. Make the bucket **Public** (check the "Public bucket" toggle) so the client can generate direct download/play URLs.
5. Go to the **Policies** tab under Storage settings.
6. Under `game-files` policies, click **New Policy** to allow uploads and deletions:
   - Select **Allowed Operations**: Choose `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
   - Under target, you can set the policy to allow access to everyone (public/anon) for testing or authenticated users. For instant testing, select **All users / Anon** and click **Save**.

## 3. Environment Variables Configuration

1. Create a `.env` file at the root of the project (copying [.env.example](../.env.example)).
2. Retrieve your connection credentials from your Supabase Dashboard under **Project Settings -> API**:
   - `VITE_SUPABASE_URL`: Find your Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Find your anon public key.
3. Populate these values in your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
4. Start your local development server with `npm run dev`. The app will automatically connect to your database!
