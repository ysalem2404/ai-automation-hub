# 🚀 Deployment Guide

## Prerequisites Checklist
- [ ] Git installed
- [ ] Node.js 18+ installed
- [ ] GitHub account created
- [ ] Repository created on GitHub

## Step-by-Step Deployment

### 1. Prepare Your Local Environment

```bash
# Navigate to your project folder
cd data-matcher-react

# Install dependencies
npm install

# Test locally (optional but recommended)
npm run dev
# Open http://localhost:5173 to verify everything works
```

### 2. Initialize Git Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Data Matcher with all features"
```

### 3. Connect to GitHub

```bash
# Add your GitHub repository as remote
# Replace YOUR_USERNAME and REPO_NAME with your values
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
5. Click **Save**

### 5. Trigger Deployment

The GitHub Action will automatically run when you push to main. To manually trigger:

1. Go to **Actions** tab in your repository
2. Click on the latest workflow run
3. Watch the deployment progress

### 6. Access Your Live App

Once deployed (takes 2-5 minutes), your app will be available at:

```
https://YOUR_USERNAME.github.io/REPO_NAME/
```

## Important: Update Base URL

Before deploying, make sure to update `vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/YOUR-REPO-NAME/'  // ⚠️ Must match your GitHub repo name!
})
```

## Troubleshooting

### Page shows blank or 404
**Solution**: Check that `base` in `vite.config.js` matches your repository name exactly.

### GitHub Actions fails
**Solution**: 
1. Check the Actions tab for error details
2. Ensure Node.js version is compatible (18+)
3. Verify all dependencies are in package.json

### Changes don't appear
**Solution**:
1. Clear your browser cache
2. Wait 5 minutes for GitHub Pages to update
3. Check that your commit was pushed successfully

## Making Updates

After initial deployment, to push updates:

```bash
# Make your changes to the code
# Then:

git add .
git commit -m "Description of your changes"
git push origin main

# GitHub Actions will automatically rebuild and deploy
```

## Alternative: Deploy to Other Platforms

### Vercel
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Your Own Server
```bash
npm run build
# Upload the dist/ folder to your web server
```

## Quick Reference Commands

```bash
# Local development
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Push updates
git add .
git commit -m "Your message"
git push origin main
```

---

## Need Help?

- Check the main README.md for detailed usage instructions
- Review GitHub Actions logs for deployment issues
- Open an issue on GitHub if you're stuck
