# 42AMIS Seating Map

A real-time seating map application for 42 campuses that shows occupancy status of workstations using the 42 API.

## Project Structure

This project has been migrated to a modern architecture with:

- **Frontend**: React/Vite application with Tailwind CSS
- **Backend**: Python Flask API with SQLite database
- **Real-time updates**: Socket.IO integration

### Directory Structure

```
├── frontend/                # React frontend
│   ├── src/                 # React source code
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   └── config/          # Configuration files
│   └── public/              # Static assets
├── backend/                 # Python Flask backend
│   ├── api/                 # API endpoints
│   └── templates/           # Backend templates (if any)
└── shared/                  # Shared configuration
```

## Setup & Development

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- 42 API credentials

### Environment Variables

Create a `.env` file in the project root with:

```
CLIENT_ID=your_42_api_client_id
CLIENT_SECRET=your_42_api_client_secret
REDIRECT_URL=http://localhost:5000/callback
CRON_SECRET=your_secret_for_cron_jobs
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend will start on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on http://localhost:5173

## Deployment

This project is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add the environment variables on Vercel
3. Deploy the project

## Features

- Real-time seating map with Socket.IO (disabled on Vercel)
- Campus floor selection
- User images from 42 API
- Automatic data refresh
- Cron endpoint for scheduled updates

## API Endpoints

- `/api/locations` - Get current locations data
- `/api/cron/update` - Trigger data update (secured with CRON_SECRET)
- `/api/status` - Check API status
- `/api/health` - Detailed health check

## Cron Jobs

For Vercel deployment, set up an external cron service (like cron-job.org) to hit:

```
https://your-domain.vercel.app/api/cron/update?secret=your_cron_secret
```

## License

This project is proprietary and confidential.

