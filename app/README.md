# 42 Seating Map

A real-time seating map for 42 campus that shows which workstations are currently occupied and by whom. This application uses Supabase for real-time updates and integrates with the 42 API.

## Features

- OAuth authentication with 42 API
- Real-time updates of occupied workstations using Supabase Realtime
- Interactive floor maps with multiple floors
- User tooltips showing who is at each workstation

## Technology Stack

- **Frontend**: React, TypeScript, Next.js, Tailwind CSS
- **Authentication**: 42 OAuth API
- **Real-time updates**: Supabase Realtime
- **Deployment**: Vercel

## Environment Variables

The following environment variables are required:

```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
REDIRECT_URI=your-oauth-redirect-url
CLIENT_ID=your-42-client-id
CLIENT_SECRET=your-42-client-secret
```

## Local Development

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env.local` file with the required environment variables
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This project is configured for deployment on Vercel. Simply connect your GitHub repository to Vercel and ensure the environment variables are set in the Vercel project settings.

## Notes for Supabase

In order for real-time updates to work, you need to:

1. Create a "locations" table in your Supabase database with appropriate columns
2. Enable realtime for the "locations" table in the Supabase dashboard
3. Ensure the updater script is running regularly to keep the database in sync with the 42 API
