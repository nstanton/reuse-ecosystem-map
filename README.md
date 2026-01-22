# BPE - Deconstruction and Reuse Ecosystem Map 1

## Setup

1. Make sure you have Node.js 22.x installed (use nvm if needed):
   ```bash
   nvm use
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Start the development server:
```bash
npm run start
```

This will start Vite dev server on `http://localhost:3000` (or the next available port). The browser should open automatically.

## Build

Build for production:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## Deploy

### Automatic Deployment (Recommended)

The project uses GitHub Actions to automatically deploy to GitHub Pages on every push to `main`. 

**Setup Steps:**
1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following repository secrets:
   - `VITE_AIRTABLE_API_KEY`
   - `VITE_AIRTABLE_BASE_ID`
   - `VITE_MAPBOX_ACCESS_TOKEN`
   - `VITE_MAPBOX_STYLE_ID`
3. Go to Settings → Pages
4. Under "Source", select "GitHub Actions"
5. Push to `main` branch to trigger deployment

### Manual Deployment

Deploy to GitHub Pages manually:
```bash
npm run deploy
```

Note: Manual deployment requires environment variables to be set in your local environment.
