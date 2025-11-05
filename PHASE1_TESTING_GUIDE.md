# 🧪 Phase 1 Testing Guide

This guide provides step-by-step instructions to test all Phase 1: Authentication & Core Infrastructure features.

## 📋 Prerequisites

1. **Environment Setup**
   - Create `.env.local` in project root with:
     ```bash
     NEXT_PUBLIC_SUPABASE_URL=https://qtbnulraotlnlgxbtfoy.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ym51bHJhb3RsbmxneGJ0Zm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMDM4NDQsImV4cCI6MjA3Nzg3OTg0NH0.Rm6EzdkYJHMf_p5uYeotbxOMJJYf2_UDlMMTOxFPYUs
     NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
     ```

   - Create `backend/.env` with:
     ```bash
     SUPABASE_PROJECT_URL=https://qtbnulraotlnlgxbtfoy.supabase.co
     SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Ym51bHJhb3RsbmxneGJ0Zm95Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjMwMzg0NCwiZXhwIjoyMDc3ODc5ODQ0fQ.YokXn1vQRLQZ936Zq5JtJchjN4Rb_iAaKU9L9Tj6Z94
     DATABASE_URL=postgresql://user:password@localhost/dronedb
     ```

2. **Supabase Configuration**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add redirect URL: `http://localhost:3000/auth/callback`
   - Ensure Email provider is enabled
   - Disable email confirmation for testing (or handle confirmation)

3. **Start Servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend
   python3 app.py
   ```

---

## ✅ Manual Testing Checklist

### 1. User Registration

**Test Steps:**
1. Navigate to `http://localhost:3000/auth/register`
2. Fill in registration form:
   - Email: `test@example.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Register"

**Expected Results:**
- ✅ Form validates password matching
- ✅ Form validates minimum password length (6 chars)
- ✅ User is created in Supabase
- ✅ Redirects to `/dashboard` on success
- ✅ Error message displayed if email already exists
- ✅ Error message displayed if passwords don't match

**Verify in Supabase:**
- Go to Authentication → Users
- Confirm new user appears with `role: user` in metadata

---

### 2. User Login

**Test Steps:**
1. Navigate to `http://localhost:3000/auth/login`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Login"

**Expected Results:**
- ✅ Successful login redirects to `/dashboard`
- ✅ Session is stored (check browser localStorage/sessionStorage)
- ✅ Error message for invalid credentials
- ✅ Error message for missing fields

**Verify Session:**
- Open browser DevTools → Application → Local Storage
- Look for `sb-qtbnulraotlnlgxbtfoy-auth-token`

---

### 3. Protected Routes (Dashboard)

**Test Steps:**
1. While logged in, navigate to `http://localhost:3000/dashboard`
2. Logout (click logout button in sidebar)
3. Try to access `http://localhost:3000/dashboard` directly

**Expected Results:**
- ✅ Authenticated users can access dashboard
- ✅ Unauthenticated users are redirected to `/auth/login`
- ✅ Loading state shows while checking auth
- ✅ Dashboard renders after auth check

---

### 4. Admin Route Protection

**Test Steps:**
1. As a regular user, try to access `http://localhost:3000/admin`
2. In Supabase Dashboard, manually set a user's role to `admin`:
   - Go to Authentication → Users
   - Click on user
   - Edit user metadata: `{ "role": "admin" }`
3. Logout and login again
4. Try to access `http://localhost:3000/admin`

**Expected Results:**
- ✅ Regular users are redirected to `/dashboard` when accessing `/admin`
- ✅ Admin users can access `/admin` page
- ✅ Loading state shows during role check

---

### 5. Logout Functionality

**Test Steps:**
1. While logged in, click "Logout" button in sidebar
2. Try to access protected routes

**Expected Results:**
- ✅ Session is cleared
- ✅ User is redirected to `/auth/login`
- ✅ Protected routes are no longer accessible

---

### 6. API Authentication (Backend)

**Test Steps:**
1. Get access token from browser localStorage or Supabase session
2. Test API endpoint with token:
   ```bash
   curl -X GET http://localhost:5000/api/drones \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
   ```
3. Test without token:
   ```bash
   curl -X GET http://localhost:5000/api/drones
   ```
4. Test with invalid token:
   ```bash
   curl -X GET http://localhost:5000/api/drones \
     -H "Authorization: Bearer invalid-token"
   ```

**Expected Results:**
- ✅ Request with valid token returns 200
- ✅ Request without token returns 401
- ✅ Request with invalid token returns 401
- ✅ Admin-only endpoints return 403 for non-admin users

---

### 7. Auth Callback Handler

**Test Steps:**
1. Navigate to `http://localhost:3000/auth/callback?code=test`
2. Check browser redirects

**Expected Results:**
- ✅ Callback handler processes auth code
- ✅ Redirects to `/dashboard` on success
- ✅ Redirects to `/auth/login?error=auth_failed` on failure

---

## 🧪 Automated Testing

### Run Frontend Tests

```bash
# Install test dependencies (if not already installed)
npm install

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Run Backend Tests

```bash
cd backend

# Install pytest if needed
pip install pytest pytest-flask

# Run tests
pytest __tests__/backend-auth.test.py -v
```

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid API key" error
**Solution:** Check `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: Redirect loop on login
**Solution:** Check Supabase redirect URL configuration matches `http://localhost:3000/auth/callback`

### Issue: "401 Unauthorized" on API calls
**Solution:** 
- Verify token is being sent in Authorization header
- Check backend `auth.py` is correctly verifying tokens
- Ensure Supabase project URL is correct

### Issue: Admin role not working
**Solution:**
- Verify user metadata in Supabase Dashboard has `{"role": "admin"}`
- Logout and login again to refresh session
- Check `getUserRole()` function returns correct role

### Issue: Tests failing
**Solution:**
- Ensure all dependencies are installed
- Check test mocks are properly configured
- Verify environment variables are set

---

## 📊 Test Coverage Goals

- ✅ User registration flow
- ✅ User login flow
- ✅ Session management
- ✅ Role-based access control
- ✅ Protected route guards
- ✅ API authentication
- ✅ Logout functionality
- ✅ Error handling

---

## ✨ Success Criteria

Phase 1 is complete when:
1. ✅ Users can register new accounts
2. ✅ Users can login with email/password
3. ✅ Sessions persist across page refreshes
4. ✅ Protected routes require authentication
5. ✅ Admin routes require admin role
6. ✅ API endpoints verify JWT tokens
7. ✅ Logout clears session
8. ✅ All unit tests pass

---

## 🎯 Next Steps

After Phase 1 is verified:
- Proceed to Phase 2: Database & Backend API
- Set up PostgreSQL database
- Implement CRUD endpoints
- Test database operations

---

**Need Help?** Check the main `README.md` or refer to `Technical_Spec_Guide.md` for implementation details.

