# Neon Database Setup Guide for Verifixia

## Overview
This project now integrates with **Neon Database** (PostgreSQL serverless) for production data storage. The setup allows you to use Netlify's built-in Neon integration.

## Setup Steps

### 1. Connect Neon to Netlify
1. Go to your Netlify site dashboard
2. Navigate to **Integrations** → Search for "Neon"
3. Click **Connect** and authorize
4. Select or create a Neon project
5. Netlify will automatically set the `NETLIFY_DATABASE_URL` environment variable

### 2. Initialize Database Schema
The database schema is automatically created when you call `db.create_tables()` in your application.

Add this to `Backend/app.py` startup:
```python
from neon_db import db

# Initialize tables on startup
with app.app_context():
    db.create_tables()
```

### 3. Local Development with Neon
For local development with Neon (optional):

1. Create a `.env` file in the Backend directory:
```
DATABASE_URL=postgresql://username:password@ep-xxx.neon.tech/database_name
```

2. Install dependencies:
```bash
pip install -r Backend/requirements.txt
```

3. Run the Flask app:
```bash
cd Backend
python app.py
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Detection Logs Table
```sql
CREATE TABLE detection_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    prediction VARCHAR(10) NOT NULL,
    confidence FLOAT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id)
);
```

## Using the Database in Code

### Example: Save Detection Log
```python
from neon_db import db

log = db.save_detection_log(
    filename="image.jpg",
    prediction="FAKE",
    confidence=0.95,
    user_id=1
)
```

### Example: Retrieve Logs
```python
logs = db.get_detection_logs(limit=50, offset=0)
```

### Example: Execute Custom Query
```python
result = db.execute_query(
    "SELECT * FROM detection_logs WHERE prediction = %s",
    ("FAKE",)
)
```

## Environment Variables

Required environment variables (set in Netlify Dashboard):

- `NETLIFY_DATABASE_URL` - Automatically set by Netlify Neon integration
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `SECRET_KEY` - Flask secret key for sessions
- `FIREBASE_*` - Firebase credentials (if using Firebase)

## Troubleshooting

### Connection Issues
- Ensure `NETLIFY_DATABASE_URL` is set in Netlify environment
- Check Neon dashboard for connection limits
- Verify IP whitelist in Neon settings

### Migration from SQLite to Neon
If you were using SQLite, the data migration needs to be done manually:
1. Export data from SQLite
2. Transform for PostgreSQL compatibility
3. Import to Neon database

## References
- [Neon Documentation](https://neon.tech/docs)
- [Netlify Integrations](https://docs.netlify.com/integrations/overview/)
- [psycopg2 Documentation](https://www.psycopg.org/psycopg2/docs/)
