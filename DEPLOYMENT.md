# Deployment Guide

## Quick Start

### Development Mode
```bash
npm install
npm run dev
```

Visit:
- Dashboard: http://localhost:5173
- Questionnaire: http://localhost:5173/euda-questionnaire.html

### Production Build
```bash
npm run build
```

The build creates a `dist/` folder with all files ready for deployment.

## Deployment Options

### 1. Netlify (Recommended)

**Option A: Drag & Drop**
1. Run `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist/` folder onto the page
4. Done! Your site is live

**Option B: Git Integration**
1. Push your code to GitHub
2. Connect your repository to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

### 2. Vercel

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel will auto-detect Vite and configure everything.

### 3. GitHub Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Install gh-pages:
   ```bash
   npm install -g gh-pages
   ```

3. Deploy:
   ```bash
   gh-pages -d dist
   ```

4. Enable GitHub Pages in your repository settings

### 4. Traditional Web Hosting (cPanel, FTP, etc.)

1. Build the project:
   ```bash
   npm run build
   ```

2. Upload the entire `dist/` folder contents to your web server's public directory (usually `public_html` or `www`)

3. Ensure your server supports:
   - Static file serving
   - HTML5 History API (for SPA routing)

## Post-Deployment Checklist

- [ ] Test the questionnaire form submission
- [ ] Verify data appears in the dashboard
- [ ] Test downloading JSON and CSV exports
- [ ] Check mobile responsiveness
- [ ] Verify both URLs work:
  - `yourdomain.com` (dashboard)
  - `yourdomain.com/euda-questionnaire.html` (form)

## Important: Same-Origin Requirement

⚠️ **Critical**: The questionnaire and dashboard MUST be hosted on the **same domain** because they share localStorage data.

**✅ Correct:**
- Form: `yourdomain.com/euda-questionnaire.html`
- Dashboard: `yourdomain.com`

**❌ Incorrect:**
- Form: `subdomain1.yourdomain.com/euda-questionnaire.html`
- Dashboard: `subdomain2.yourdomain.com`

## Environment-Specific Notes

### Netlify
- Automatic HTTPS
- Global CDN
- Automatic deployments on Git push
- Free tier available

### Vercel
- Automatic HTTPS
- Edge network
- Zero configuration
- Free tier available

### GitHub Pages
- Free hosting
- HTTPS included
- Custom domain support
- Requires public repository (or GitHub Pro for private)

### Traditional Hosting
- May need to configure URL rewriting
- Ensure HTTPS is enabled
- Check PHP/server-side requirements (none needed for this project)

## Troubleshooting

### Dashboard shows "No Responses Yet"
- Verify you submitted the form on the same domain
- Check browser console for localStorage errors
- Ensure JavaScript is enabled

### Form doesn't submit
- Check browser console for errors
- Verify localStorage is not disabled
- Ensure JavaScript is enabled

### Build fails
- Run `npm install` again
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version (requires Node 16+)

## Custom Domain Setup

After deploying to Netlify or Vercel:

1. Go to domain settings in your hosting dashboard
2. Add your custom domain
3. Update your DNS records as instructed
4. Wait for DNS propagation (5 minutes to 48 hours)
5. HTTPS will be automatically configured

## Data Backup

Since data is stored in localStorage:

1. Regularly download all responses as JSON from the dashboard
2. Store backups in a secure location
3. Consider implementing a backend solution for production use if data persistence is critical

## Scaling Considerations

This implementation uses localStorage which:
- ✅ Works great for demos and small-scale use
- ✅ No server costs
- ✅ Simple deployment
- ❌ Data is browser-specific
- ❌ No cross-device sync
- ❌ Limited to ~5-10MB per domain

For production at scale, consider:
- Backend API (Node.js, Python, etc.)
- Database (PostgreSQL, MongoDB, etc.)
- Authentication system
- Data backup and recovery

## Support

For deployment issues, refer to the hosting provider's documentation:
- Netlify: https://docs.netlify.com
- Vercel: https://vercel.com/docs
- GitHub Pages: https://docs.github.com/pages
