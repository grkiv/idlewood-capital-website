# Preview Deployment Setup Guide

## Overview
This guide explains how to use preview deployments to test changes before going live on the main website.

## Branch Structure

### Production Branch: `main`
- **Live Site**: https://idlewoodcapital.com
- **Purpose**: Production-ready code only
- **Deployment**: Automatic on push to main
- **Protection**: Should be protected from direct pushes

### Development Branch: `development`
- **Preview Site**: https://idlewood-capital-website-[hash]-development.vercel.app
- **Purpose**: Testing and development work
- **Deployment**: Automatic preview on push to development
- **Protection**: Open for development work

## Workflow for Making Changes

### 1. Switch to Development Branch
```bash
git checkout development
git pull origin development  # Get latest changes
```

### 2. Make Your Changes
- Edit files as needed
- Test locally when possible

### 3. Commit and Push to Development
```bash
git add .
git commit -m "Description of changes"
git push origin development
```

### 4. Review Preview Deployment
- Vercel automatically creates a preview deployment
- Check the Vercel dashboard for the preview URL
- Test the changes on the preview site
- Share preview URL with stakeholders for review

### 5. Deploy to Production (when ready)
```bash
git checkout main
git merge development
git push origin main
```

## Vercel Configuration

The `vercel.json` file is configured to:
- Deploy both `main` and `development` branches
- Disable automatic aliases for preview deployments
- Maintain the same function configurations

```json
{
  "git": {
    "deploymentEnabled": {
      "main": true,
      "development": true
    }
  },
  "github": {
    "autoAlias": false
  }
}
```

## GitHub Branch Protection (Recommended)

To prevent accidental direct pushes to main:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Branches**
3. Click **Add rule** for the `main` branch
4. Configure protection:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

## Finding Preview URLs

### Option 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. View deployments for each branch

### Option 2: GitHub Integration
- Vercel automatically comments on commits/PRs with preview URLs
- Look for Vercel bot comments with deployment links

### Option 3: Git Commit Message
- Preview URLs follow pattern: `https://idlewood-capital-website-[hash]-development.vercel.app`

## Common Commands

### Start Development Work
```bash
git checkout development
git pull origin development
```

### Create Feature Branch (Optional)
```bash
git checkout development
git checkout -b feature/new-feature
# Work on feature
git push origin feature/new-feature
# Create PR to merge into development
```

### Deploy to Production
```bash
git checkout main
git merge development
git push origin main
```

### Emergency Hotfix to Production
```bash
git checkout main
# Make quick fix
git add .
git commit -m "Emergency fix: description"
git push origin main
# Then update development branch
git checkout development
git merge main
git push origin development
```

## Benefits of This Setup

1. **Safe Testing**: Test all changes before they go live
2. **Stakeholder Review**: Share preview links for approval
3. **Rollback Safety**: Main branch stays stable
4. **Parallel Development**: Multiple features can be worked on
5. **Automatic Deployments**: No manual deployment steps

## Environment Variables

Both production and preview deployments will use the same environment variables:
- `BREVO_API_KEY` for contact form functionality
- Any other environment variables are shared

## Monitoring

### Analytics
- Production analytics track main site visitors
- Preview deployments can also be tracked separately
- Use different environments in analytics if needed

### Performance
- Both production and preview get Vercel Speed Insights
- Compare performance between versions

## Troubleshooting

### Preview Not Deploying
1. Check Vercel dashboard for build logs
2. Verify branch is pushed to GitHub
3. Check vercel.json syntax

### Merge Conflicts
```bash
git checkout development
git pull origin main  # Get latest main changes
# Resolve conflicts
git add .
git commit -m "Resolve merge conflicts"
git push origin development
```

### Need to Reset Development Branch
```bash
git checkout development
git reset --hard origin/main
git push --force origin development
```

---
*Last Updated: 2025-09-02*
*Contact: george@idlewoodcapital.com*