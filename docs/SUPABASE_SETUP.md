# Supabase Migration Setup Guide

This guide will help you migrate your Trello clone from local PostgreSQL to Supabase for Vercel deployment.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `trello-clone`
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
4. Wait for the project to be created (2-3 minutes)

## 2. Set Up Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase-setup.sql` and paste it into the SQL editor
3. Click "Run" to execute the script
4. This will create all necessary tables, indexes, and Row Level Security policies

## 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## 4. Get Database Connection String

1. In your Supabase dashboard, go to Settings > Database
2. Under "Connection string", select "URI"
3. Copy the connection string and replace `[YOUR-PASSWORD]` with your database password
4. This will be your `DATABASE_URL` and `DIRECT_URL`

## 5. Set Up Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URLs (for Prisma)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret_key_here
```

## 6. Update Prisma Client

Run the following commands to update your Prisma client:

```bash
npx prisma generate
npx prisma db push
```

## 7. Test the Migration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the following:
   - User registration
   - User login
   - Creating boards
   - Creating lists
   - Creating cards

## 8. Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. In Vercel dashboard, go to your project settings
4. Add all the environment variables from your `.env.local` file
5. Deploy your project

## 9. Post-Deployment

After deployment, test all functionality to ensure everything works correctly with Supabase.

## Troubleshooting

### Common Issues:

1. **Connection Issues**: Make sure your DATABASE_URL is correct and includes the password
2. **RLS Policies**: If you get permission errors, check that the RLS policies are correctly set up
3. **CORS Issues**: Supabase handles CORS automatically, but make sure your domain is allowed

### Useful Supabase Dashboard Sections:

- **Table Editor**: View and edit your data
- **SQL Editor**: Run custom queries
- **API Docs**: Auto-generated API documentation
- **Logs**: Monitor your application logs
- **Settings**: Manage your project configuration

## Security Notes

- Never commit your `.env.local` file to version control
- Use the service role key only on the server side
- The anon key is safe to use on the client side
- Row Level Security (RLS) is enabled by default for data protection

## Next Steps

After successful migration, you can:
- Set up Supabase Auth for better authentication
- Use Supabase Realtime for live updates
- Implement file storage with Supabase Storage
- Add more advanced features using Supabase Edge Functions
