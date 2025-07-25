# Vercel Deployment Guide

## Deploy Flight Monitoring Application to Vercel

### Prerequisites
1. Vercel account (sign up at [vercel.com](https://vercel.com))
2. GitHub repository (already set up: `mrt-naver-benchmark`)
3. Supabase database (already configured)

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Environment Variables
Set these in your Vercel dashboard:

**Required:**
- `SUPABASE_KEY` - Your Supabase anonymous key
- `NODE_ENV` - Set to "production"

**Optional (will use defaults if not set):**
- `FLIGHT_API_BASE_URL` - Default: `https://naverflights.myrealtrip.com`
- `LOG_LEVEL` - Default: `info`

**Note:** `PORT` is automatically provided by Vercel

### Step 3: Deploy via GitHub Integration (Recommended)

1. **Connect Repository:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `youngkwangkim-mrt/mrt-naver-benchmark`

2. **Configure Project:**
   - Framework Preset: `Other`
   - Root Directory: `./` (leave as default)
   - Build Command: Leave empty (no build required)
   - Output Directory: Leave empty
   - Install Command: `npm install`

3. **Environment Variables:**
   - Add `SUPABASE_KEY` with your Supabase anonymous key
   - Add `NODE_ENV` set to `production`

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically deploy from your `main` branch

### Step 4: Deploy via CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Deploy (run from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name: mrt-naver-benchmark
# - Directory: ./
```

### Step 5: Configure Environment Variables via CLI

```bash
# Add Supabase key
vercel env add SUPABASE_KEY production

# Add Node environment
vercel env add NODE_ENV production
```

### Step 6: Custom Domain (Optional)

1. Go to your project dashboard in Vercel
2. Navigate to "Settings" → "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### Expected Deployment URLs

After deployment, your application will be available at:
- **Main Dashboard:** `https://your-project-name.vercel.app`
- **Performance Analysis:** `https://your-project-name.vercel.app/performance-analysis`
- **API Endpoints:** `https://your-project-name.vercel.app/api/*`

### Troubleshooting

**Common Issues:**

1. **Database Connection Failed:**
   - Verify `SUPABASE_KEY` is correctly set in Vercel environment variables
   - Check Supabase project is active and accessible

2. **Static Assets Not Loading:**
   - Ensure `public/` directory files are properly committed to git
   - Check Content Security Policy settings in `src/server.js`

3. **API Timeouts:**
   - Vercel functions have a 30-second timeout (configured in `vercel.json`)
   - External API calls should complete within this timeframe

4. **Charts Not Loading:**
   - Chart.js is loaded from CDN and local backup
   - Check browser console for any CSP violations

### Features Available After Deployment

✅ **Dashboards:**
- Recent API Calls monitoring
- Route Performance Analysis
- Real-time data visualization

✅ **API Endpoints:**
- Flight monitoring (random/custom)
- Performance metrics
- Recent calls data

✅ **Technical Features:**
- Auto-refresh functionality
- Mobile-responsive design
- Chart.js with fallback strategies
- Comprehensive error handling

### Performance Optimization

Vercel automatically provides:
- Global CDN distribution
- Automatic HTTPS
- Function optimization
- Static asset caching
- Gzip compression

Your flight monitoring application is optimized for production deployment on Vercel! 🚀 