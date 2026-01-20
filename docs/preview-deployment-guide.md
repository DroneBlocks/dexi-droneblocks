# Preview Deployment Implementation Guide

## Overview
This guide explains how to set up automatic preview deployments for branches before merging to main.

## Current State
- ✅ CI workflow already builds on push to `main` and `feature/*` branches
- ✅ Docker image building is configured
- ✅ Manual preview deployment exists using Cloudflare tunnels
- ❌ Preview deployments are not automatic for PRs

## Recommended Approaches

### Option 1: Automatic PR Preview with Cloudflare Tunnel (Simplest)

**Pros:**
- No additional infrastructure needed
- Free (uses Cloudflare's free tunnel service)
- Quick to implement
- Already partially implemented in your CI workflow

**Cons:**
- Temporary URLs that change each time
- Runs during the workflow duration only
- Not persistent across multiple reviews

**Implementation:**

Modify `.github/workflows/ci.yml` to add this job:

```yaml
  preview:
    runs-on: ubuntu-latest
    # Only run on PRs, not direct pushes to main
    if: github.event_name == 'pull_request'
    needs: build

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: nuxt-build
          path: .output/

      - name: Start preview server
        timeout-minutes: 60
        run: |
          # Install cloudflared
          curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
          chmod +x cloudflared

          # Start Nuxt server in background
          node .output/server/index.mjs &
          sleep 3

          # Verify server is running
          curl -sf http://localhost:3000 > /dev/null && echo "✅ Server started successfully"

          echo "## 🚀 Preview Deployment" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Your preview is starting up! The public URL will appear below:" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY

          # Create tunnel - this will print the URL
          ./cloudflared tunnel --url http://localhost:3000 | tee tunnel.log &
          TUNNEL_PID=$!

          # Wait for URL to be generated
          sleep 10

          # Extract URL from logs
          PREVIEW_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' tunnel.log | head -1)

          if [ -n "$PREVIEW_URL" ]; then
            echo "**Preview URL:** $PREVIEW_URL" >> $GITHUB_STEP_SUMMARY
            echo "" >> $GITHUB_STEP_SUMMARY
            echo "This preview will remain active for 60 minutes." >> $GITHUB_STEP_SUMMARY
          fi

          # Keep tunnel alive
          wait $TUNNEL_PID
```

**Usage:**
- Creates a preview URL for every PR automatically
- URL appears in the workflow job summary
- Preview stays active for 60 minutes
- Comment on PR with the URL for reviewers

---

### Option 2: Deploy to Cloud Provider (Vercel/Netlify) (Recommended for Production)

**Pros:**
- Persistent preview URLs (e.g., `pr-123.your-app.vercel.app`)
- Professional deployment infrastructure
- Automatic comments on PRs with preview links
- Better for team collaboration
- Free tier available on both platforms

**Cons:**
- Requires external service account setup
- Need to configure deployment secrets

#### Option 2A: Vercel

**Setup:**
1. Install Vercel CLI and generate a token
2. Add secrets to GitHub:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

**Workflow modification:**

```yaml
  preview-vercel:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: build

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: nuxt-build
          path: .output/

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true
          working-directory: ./
```

#### Option 2B: Netlify

**Setup:**
1. Create Netlify account and site
2. Generate personal access token
3. Add secrets to GitHub:
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`

**Workflow modification:**

```yaml
  preview-netlify:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    needs: build

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: nuxt-build
          path: .output/

      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './.output/public'
          production-deploy: false
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from PR #${{ github.event.number }}"
          enable-pull-request-comment: true
          enable-commit-comment: false
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

### Option 3: Docker-based Preview on Your Infrastructure

**Pros:**
- Full control over infrastructure
- Can use existing Docker Hub integration
- Custom domain configuration possible

**Cons:**
- Requires a server/VM to deploy to
- More complex setup
- Need to manage cleanup of old previews
- Requires additional secrets and infrastructure

**Implementation outline:**
1. Set up a preview server (e.g., AWS EC2, DigitalOcean Droplet)
2. Configure Docker and a reverse proxy (Traefik/Nginx)
3. Add workflow to:
   - Build Docker image with PR tag
   - Push to Docker Hub
   - Deploy to preview server via SSH
   - Comment on PR with preview URL

---

## Recommended Immediate Action

**I recommend Option 1 (Cloudflare Tunnel) as a starting point** because:
- ✅ Zero cost
- ✅ No external accounts needed
- ✅ Minimal setup (just modify the workflow file)
- ✅ Works immediately
- ✅ You already have most of the code in place

**Then migrate to Option 2 (Vercel/Netlify) when you need:**
- Persistent preview URLs
- Better team collaboration
- Production-grade infrastructure

---

## Next Steps

1. **Choose your preferred option** from above
2. **Modify `.github/workflows/ci.yml`** to add the preview job
3. **Test with a new PR** to verify the preview deployment works
4. **Document the preview URL location** for your team (e.g., in PR template)

Would you like me to create a complete, ready-to-use workflow file for any of these options? I can prepare it for you to copy into your workflows directory.
