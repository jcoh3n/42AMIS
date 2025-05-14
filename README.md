# 42 Seating Map

A web application to display and track student seating at 42 campuses.

## Setup for Vercel Deployment

### 1. Prerequisites

- A Vercel account
- The Vercel CLI installed (`npm install -g vercel`)
- Your 42 API credentials (CLIENT_ID and CLIENT_SECRET)

### 2. Deploy to Vercel

1. Fork or clone this repository
2. Log in to Vercel CLI:
   ```
   vercel login
   ```
3. Deploy the project:
   ```
   vercel
   ```
4. Set up environment variables in the Vercel dashboard:
   - Go to your project settings
   - Add the following environment variables:
     - `CLIENT_ID`: Your 42 API client ID
     - `CLIENT_SECRET`: Your 42 API client secret

### 3. Set Up Database Updates

Since Vercel uses serverless functions, we need to set up a way to update the database periodically:

1. Use a cron job service like cron-job.org to call the `/api/update_locations` endpoint every few minutes
2. Set up the cron job to hit: `https://your-vercel-domain.vercel.app/api/update_locations`

### 4. Local Development

For local development:
```
pip install -r requirements.txt
python app.py
```

The application should be accessible at http://localhost:5000

### 5. Database Considerations

The Vercel deployment uses SQLite in the `/tmp` directory, which has some limitations:
- Data may be cleared periodically by Vercel
- The database is not shared between function invocations

For a more persistent solution, consider migrating to a managed database service like:
- Vercel Postgres
- MongoDB Atlas
- Supabase

## Features

- Real-time seating map for 42 campuses
- Multiple floor support
- Integration with 42 API

