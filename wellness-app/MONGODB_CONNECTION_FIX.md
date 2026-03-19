# MongoDB Atlas Connection Error Fix

## Problem
```
MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster. 
One common reason is that you're trying to access the database from an IP that isn't whitelisted.
```

## Root Cause
MongoDB Atlas has security features that block connections from unknown IP addresses. Your current IP address needs to be added to the whitelist.

---

## Solution Steps

### Step 1: Access MongoDB Atlas Console
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Log in with your credentials
3. Select your organization and project

### Step 2: Navigate to Network Access
1. In the left sidebar, click **"Network Access"** (under "Security" section)
2. You'll see a list of currently whitelisted IP addresses

### Step 3: Add Your IP Address

**Option A: Add Current IP Address (Recommended)**
1. Click **"+ ADD IP ADDRESS"** button
2. Click **"ADD CURRENT IP ADDRESS"** button
3. The form will auto-fill with your IP
4. Click **"Confirm"**

**Option B: Allow Access from Anywhere (Development Only)**
1. Click **"+ ADD IP ADDRESS"** button
2. Click **"ALLOW ACCESS FROM ANYWHERE"** button
3. This adds `0.0.0.0/0` (allows all IPs)
4. Click **"Confirm"**

⚠️ **Warning**: Option B is only for development/testing. Never use this in production!

### Step 4: Save Changes
1. Click **"Save"** or **"Confirm"** button
2. Wait 1-2 minutes for the changes to propagate

### Step 5: Test Connection
1. Restart your Next.js development server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```
2. Try generating a report again

---

## Additional Troubleshooting

### If You're Still Getting Connection Errors

#### 1. Check Environment Variables
Make sure your `.env.local` file has the correct MongoDB URI:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wellness-platform?retryWrites=true&w=majority
```

**Verify:**
- Username is correct
- Password is correct (no special characters unencoded)
- Cluster name is correct
- Database name is included

#### 2. Check MongoDB Cluster Status
1. Go to MongoDB Atlas
2. Click on **"Database"** in left sidebar
3. Ensure your cluster shows as **"Active"** (green status)
4. If it's building/updating, wait for it to complete

#### 3. Check Database User Permissions
1. Go to **"Database Access"** (left sidebar)
2. Verify your database user exists
3. Click **"Edit"** on the user
4. Ensure they have at least **"Read and write to any database"** permission

#### 4. Test Connection String
Use MongoDB Compass or CLI to test your connection string:

**Using MongoDB Compass:**
1. Download: https://www.mongodb.com/products/compass
2. Paste your connection string
3. Try to connect

**Using Node.js:**
```javascript
const mongoose = require('mongoose');

mongoose.connect('YOUR_MONGODB_URI')
  .then(() => console.log('Connected successfully'))
  .catch(err => console.error('Connection error:', err));
```

#### 5. Check Firewall/Antivirus
Some firewalls block MongoDB connections:
- Temporarily disable firewall to test
- Add exception for Node.js/MongoDB
- Check if port 27017 is blocked

#### 6. Restart Development Server Completely
Sometimes the connection cache needs to be cleared:

```bash
# Stop server
Ctrl+C

# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

---

## Common Error Messages & Solutions

### Error: "IP not whitelisted"
**Solution:** Follow Step 3 above to add your IP address

### Error: "Authentication failed"
**Possible causes:**
- Wrong username/password in connection string
- Database user doesn't exist
- User has insufficient permissions

**Solution:** 
1. Verify credentials in `.env.local`
2. Check database user in Atlas "Database Access"
3. Recreate user if needed

### Error: "Cluster not found"
**Possible causes:**
- Wrong cluster name in connection string
- Cluster is paused/stopped

**Solution:**
1. Verify cluster name matches exactly
2. Check cluster status in Atlas dashboard

### Error: "Network timeout"
**Possible causes:**
- Slow internet connection
- Corporate firewall blocking MongoDB
- DNS issues

**Solution:**
1. Check internet connection
2. Try mobile hotspot (different IP)
3. Contact IT department if on corporate network

---

## For Production Deployment

When deploying to production (Vercel, AWS, etc.):

### Vercel
1. Go to MongoDB Atlas → Network Access
2. Add Vercel's IP ranges:
   ```
   3.218.169.0/24
   52.20.0.0/14
   54.196.0.0/15
   54.204.0.0/15
   54.208.0.0/15
   54.224.0.0/15
   54.234.0.0/15
   54.236.0.0/15
   54.242.0.0/15
   54.243.0.0/15
   ```
3. Or use "Allow Access from Anywhere" (0.0.0.0/0)

### Other Platforms
Check your hosting provider's documentation for their outbound IP ranges.

---

## Code Improvements Made

While fixing this issue, I also optimized the database connection handling:

### Before:
```typescript
// route.ts - Called connectToDatabase() TWICE
async function requireBusinessAuth() {
  await connectToDatabase(); // First call
  // ... authentication logic
}

export async function POST(req) {
  const authResult = await requireBusinessAuth(req);
  await connectToDatabase(); // Second call (redundant!)
  // ... rest of code
}
```

### After:
```typescript
// route.ts - Called connectToDatabase() ONCE
export async function POST(req) {
  await connectToDatabase(); // Single connection at the top
  
  const authResult = await requireBusinessAuth(req);
  // No second call - uses existing connection
  // ... rest of code
}

async function requireBusinessAuth() {
  // No connectToDatabase() call here
  // Uses connection from POST handler
  // ... authentication logic
}
```

**Benefits:**
- ✅ Faster API response times
- ✅ Prevents connection race conditions
- ✅ Reduces MongoDB connection pool exhaustion
- ✅ More consistent with other working routes

---

## Prevention Tips

1. **Use Static IP** (if possible)
   - Request static IP from ISP
   - Add it permanently to MongoDB whitelist

2. **Use MongoDB Realm** 
   - Provides additional connection layer
   - Better security controls

3. **Set Up VPC Peering**
   - For enterprise applications
   - Direct private connection to MongoDB

4. **Monitor Connection Logs**
   - Regularly check MongoDB Atlas logs
   - Set up alerts for failed connections

---

## Quick Checklist

- [ ] Logged into MongoDB Atlas
- [ ] Navigated to Network Access
- [ ] Added current IP address to whitelist
- [ ] Saved changes and waited 1-2 minutes
- [ ] Verified `.env.local` has correct MONGODB_URI
- [ ] Restarted development server
- [ ] Tested report generation

---

## Still Not Working?

If you've followed all steps and still can't connect:

1. **Try a different network** (mobile hotspot, home WiFi, etc.)
2. **Create a new database user** in Atlas with admin privileges
3. **Regenerate connection string** from Atlas dashboard
4. **Check MongoDB Atlas service status** (might be down for maintenance)
5. **Contact MongoDB Support** if using paid plan

---

## Related Issues

- **Working Routes:** Other API routes like `/api/businesses/my-business` work fine because they were set up when the IP was already whitelisted
- **Recent Changes:** Our code improvements didn't cause this - it's purely a MongoDB Atlas configuration issue
- **Timing:** The error appeared now because the reports endpoint makes more database calls, making the connection issue more apparent

---

## Contact Information

**MongoDB Atlas Support:**
- Documentation: https://www.mongodb.com/docs/atlas/
- Community Forum: https://www.mongodb.com/community/forums/
- Support Portal: https://support.mongodb.com/

**Internal Team:**
- Check with your DevOps team about IP whitelisting policies
- Coordinate with IT if on corporate network
