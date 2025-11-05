# 🔧 Environment Setup Quick Reference

## Frontend Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qtbnulraotlnlgxbtfoy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ym51bHJhb3RsbmxneGJ0Zm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDM4NDQsImV4cCI6MjA3Nzg3OTg0NH0.Rm6EzdkYJHMf_p5uYeotbxOMJJYf2_UDlMMTOxFPYUs
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

## Backend Environment Variables

Create `.env` in the `backend/` directory:

```bash
SUPABASE_PROJECT_URL=https://qtbnulraotlnlgxbtfoy.supabase.co
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ym51bHJhb3RsbmxneGJ0Zm95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzg0NCwiZXhwIjoyMDc3ODc5ODQ0fQ.YokXn1vQRLQZ936Zq5JtJchjN4Rb_iAaKU9L9Tj6Z94
DATABASE_URL=postgresql://user:password@localhost/dronedb
```

## Supabase Configuration

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add Redirect URL: `http://localhost:3000/auth/callback`
3. Set Site URL: `http://localhost:3000`
4. Ensure Email provider is enabled
5. For testing, you may want to disable email confirmation (Settings → Auth → Email Auth)

## Quick Commands

```bash
# Start frontend
npm run dev

# Start backend
cd backend && python3 app.py

# Run frontend tests
npm test

# Run backend tests
cd backend && pytest __tests__/backend-auth.test.py -v
```

