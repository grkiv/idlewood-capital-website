# Vercel Analytics Setup Documentation

## Overview
Vercel Analytics and Speed Insights have been configured for the Idlewood Capital website to track visitor behavior and monitor site performance.

## Implementation Details

### 1. Analytics Scripts Added
The following scripts have been added to all HTML pages:
```html
<!-- Vercel Analytics -->
<script defer src="https://va.vercel-scripts.com/v1/analytics.js"></script>
<script defer src="https://va.vercel-scripts.com/v1/speed-insights.js"></script>
```

### 2. Files Modified
- ✅ `index.html` - Main landing page
- ✅ `investor-portal.html` - Investor login page  
- ✅ `login-failed.html` - Access restricted page

### 3. Configuration Updated
The `vercel.json` file has been updated to enable analytics:
```json
{
  "functions": {
    "api/contact.js": {
      "maxDuration": 10
    }
  },
  "analytics": {
    "enable": true
  },
  "speedInsights": {
    "enable": true
  }
}
```

## Features Enabled

### Vercel Analytics
- **Page Views**: Tracks visitor count and page views
- **Referrers**: Shows where traffic comes from
- **Devices**: Browser, OS, and device type breakdown
- **Geography**: Visitor location data
- **Real-time**: Live visitor monitoring

### Speed Insights
- **Core Web Vitals**: LCP, FID, CLS metrics
- **Performance Scores**: Page load performance
- **User Experience**: Real user monitoring (RUM)
- **Device Breakdown**: Performance by device type

## Deployment Steps

1. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add Vercel Analytics and Speed Insights"
   git push origin main
   ```

2. **Vercel Dashboard**
   - Analytics will automatically activate on next deployment
   - No additional configuration needed in Vercel dashboard
   - Data starts collecting immediately after deployment

## Accessing Analytics

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the Idlewood Capital project
3. Navigate to the **Analytics** tab for visitor data
4. Navigate to **Speed Insights** tab for performance metrics

## Privacy Considerations

- Vercel Analytics is privacy-focused and GDPR compliant
- No cookies are used
- No personal information is collected
- IP addresses are anonymized

## Cost

- **Free Tier**: 2,500 data points per month
- **Pro Plan**: Unlimited data points (if needed)
- Current usage should stay well within free tier limits

## Monitoring

After deployment, monitor:
1. **Initial Load**: Check that scripts load correctly
2. **Console**: No errors in browser console
3. **Network Tab**: Verify analytics requests are successful
4. **Dashboard**: Data appears in Vercel dashboard within minutes

## Troubleshooting

If analytics don't appear:
1. Ensure deployment completed successfully
2. Clear browser cache and reload
3. Check browser console for errors
4. Verify scripts are loading in Network tab
5. Wait 5-10 minutes for initial data to appear

## Support

For issues or questions:
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Speed Insights Docs](https://vercel.com/docs/speed-insights)

---
*Last Updated: 2025-09-02*