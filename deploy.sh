#!/usr/bin/env bash
# =============================================================
# deploy.sh — Certificate Review Deployment Script
# Jalankan dari root folder project:
#   chmod +x deploy.sh && ./deploy.sh
# =============================================================

set -e  # Exit on any error

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()     { echo -e "${BOLD}${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo -e "${BOLD}================================================${NC}"
echo -e "${BOLD}  Certificate Review — Deploy Script${NC}"
echo -e "${BOLD}================================================${NC}"
echo -e "${YELLOW}  Vercel Hobby Plan: Cron daily (00:00 UTC)${NC}"
echo -e "${YELLOW}  Worker triggered by frontend polling (15s)${NC}"
echo -e "${BOLD}================================================${NC}"
echo ""

# ─── Prerequisite Check ────────────────────────────────────────

log "Checking prerequisites..."

command -v supabase >/dev/null 2>&1 || error "supabase CLI not found. Install: https://supabase.com/docs/guides/cli/getting-started"
command -v vercel >/dev/null 2>&1   || error "vercel CLI not found. Install: npm i -g vercel"
command -v node >/dev/null 2>&1     || error "node not found."
command -v npx >/dev/null 2>&1      || error "npx not found."

success "All prerequisites OK"

SUPABASE_VER=$(supabase --version 2>&1 | head -1)
VERCEL_VER=$(vercel --version 2>&1 | head -1)
success "Supabase CLI: $SUPABASE_VER"
success "Vercel CLI:   $VERCEL_VER"

echo ""

# ─── Step 1: Generate CRON_SECRET ──────────────────────────────

log "Step 1: Generating CRON_SECRET..."

CRON_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
success "CRON_SECRET generated: ${CRON_SECRET:0:8}...${CRON_SECRET: -8} (hidden for security)"

# Update .env.local with generated secret
sed -i "s/CRON_SECRET=your-cron-secret-change-this-in-production/CRON_SECRET=$CRON_SECRET/" .env.local
success ".env.local updated with CRON_SECRET"

echo ""

# ─── Step 2: Supabase Login & Link ────────────────────────────

log "Step 2: Checking Supabase authentication..."

# Check if already logged in
SUPABASE_STATUS=$(supabase projects list 2>&1 || true)
if echo "$SUPABASE_STATUS" | grep -q "not logged in\|Login\|unauthorized"; then
  warn "Not logged in to Supabase. Please login:"
  supabase login
fi

# Get project ref from .env.local
PROJECT_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"')
PROJECT_REF=$(echo "$PROJECT_URL" | sed 's|https://||' | cut -d'.' -f1)

success "Supabase Project: $PROJECT_REF"

log "Linking Supabase project..."
supabase link --project-ref "$PROJECT_REF" 2>&1 || warn "Already linked or link failed — continuing"

echo ""

# ─── Step 3: Push Database Migration ──────────────────────────

log "Step 3: Pushing database migration (async queue)..."

echo ""
echo -e "${YELLOW}Migration will add:${NC}"
echo "  - table: review_batches"
echo "  - table: review_jobs"  
echo "  - column: certificates.batch_id"
echo "  - function: claim_next_job()"
echo "  - function: update_batch_progress() + trigger"
echo "  - replica identity full (for Realtime)"
echo ""

supabase db push 2>&1

success "Database migration pushed!"

echo ""

# ─── Step 4: Enable Realtime via Supabase API ─────────────────

log "Step 4: Enabling Realtime for review_jobs and review_batches..."

# Get service role key
SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d'=' -f2 | tr -d '"')

# Enable realtime for review_jobs
RESP_JOBS=$(curl -s -o /dev/null -w "%{http_code}" \
  --request POST \
  --url "$PROJECT_URL/rest/v1/rpc/does_not_exist_just_checking" \
  --header "apikey: $SERVICE_KEY" \
  --header "Authorization: Bearer $SERVICE_KEY" 2>/dev/null || echo "")

# Use Supabase management API to enable realtime
log "Enabling Realtime tables via SQL..."
supabase db execute --sql "
  DO \$\$
  BEGIN
    -- Enable realtime for review_jobs (if not already)
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'review_jobs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.review_jobs;
    END IF;

    -- Enable realtime for review_batches (if not already)
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'review_batches'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.review_batches;
    END IF;
    
    -- Also enable for certificates (for student dashboard realtime)
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'certificates'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.certificates;
    END IF;
  END \$\$;
" 2>&1

success "Realtime enabled for review_jobs, review_batches, certificates!"

echo ""

# ─── Step 5: Vercel Login & Project Link ──────────────────────

log "Step 5: Checking Vercel authentication..."

VERCEL_WHOAMI=$(vercel whoami 2>&1 || echo "not_logged_in")
if echo "$VERCEL_WHOAMI" | grep -q "not_logged_in\|Error\|not found"; then
  warn "Not logged in to Vercel. Please login:"
  vercel login
fi

success "Vercel user: $VERCEL_WHOAMI"

echo ""

# ─── Step 6: Set Vercel Environment Variables ─────────────────

log "Step 6: Setting Vercel environment variables..."

# Get values from .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2 | tr -d '"')
SUPABASE_ANON=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d'=' -f2 | tr -d '"')
SUPABASE_SERVICE=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d'=' -f2 | tr -d '"')
GEMINI_KEY=$(grep "GEMINI_API_KEY" .env.local | cut -d'=' -f2 | tr -d '"')
MAX_CONCURRENCY=$(grep "QUEUE_MAX_CONCURRENCY" .env.local | cut -d'=' -f2 | tr -d '"')

set_env() {
  local key="$1"
  local value="$2"
  local env="$3"  # production, preview, development
  
  echo "$value" | vercel env add "$key" "$env" --force 2>&1 | grep -v "^$" || true
  echo "$value" | vercel env add "$key" "preview" --force 2>&1 | grep -v "^$" || true
  echo "$value" | vercel env add "$key" "development" --force 2>&1 | grep -v "^$" || true
  success "  Set: $key"
}

log "Setting all environment variables for all environments..."

# Set each variable for production + preview + development
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force 2>/dev/null || true
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview --force 2>/dev/null || true
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL development --force 2>/dev/null || true
success "  Set: NEXT_PUBLIC_SUPABASE_URL"

echo "$SUPABASE_ANON" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force 2>/dev/null || true
echo "$SUPABASE_ANON" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview --force 2>/dev/null || true
echo "$SUPABASE_ANON" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development --force 2>/dev/null || true
success "  Set: NEXT_PUBLIC_SUPABASE_ANON_KEY"

echo "$SUPABASE_SERVICE" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force 2>/dev/null || true
echo "$SUPABASE_SERVICE" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview --force 2>/dev/null || true
echo "$SUPABASE_SERVICE" | vercel env add SUPABASE_SERVICE_ROLE_KEY development --force 2>/dev/null || true
success "  Set: SUPABASE_SERVICE_ROLE_KEY"

echo "$GEMINI_KEY" | vercel env add GEMINI_API_KEY production --force 2>/dev/null || true
echo "$GEMINI_KEY" | vercel env add GEMINI_API_KEY preview --force 2>/dev/null || true
echo "$GEMINI_KEY" | vercel env add GEMINI_API_KEY development --force 2>/dev/null || true
success "  Set: GEMINI_API_KEY"

echo "$MAX_CONCURRENCY" | vercel env add QUEUE_MAX_CONCURRENCY production --force 2>/dev/null || true
echo "$MAX_CONCURRENCY" | vercel env add QUEUE_MAX_CONCURRENCY preview --force 2>/dev/null || true
echo "$MAX_CONCURRENCY" | vercel env add QUEUE_MAX_CONCURRENCY development --force 2>/dev/null || true
success "  Set: QUEUE_MAX_CONCURRENCY"

echo "$CRON_SECRET" | vercel env add CRON_SECRET production --force 2>/dev/null || true
echo "$CRON_SECRET" | vercel env add CRON_SECRET preview --force 2>/dev/null || true
echo "$CRON_SECRET" | vercel env add CRON_SECRET development --force 2>/dev/null || true
success "  Set: CRON_SECRET"

echo ""
success "All Vercel environment variables set!"

echo ""

# ─── Step 7: Deploy to Vercel Production ──────────────────────

log "Step 7: Deploying to Vercel (production)..."

DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
echo "$DEPLOY_OUTPUT"

DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.vercel\.app' | tail -1)

if [ -n "$DEPLOY_URL" ]; then
  success "Deployed to: $DEPLOY_URL"
  
  # Update .env.local NEXT_PUBLIC_APP_URL
  sed -i "s|NEXT_PUBLIC_APP_URL=http://localhost:3000|NEXT_PUBLIC_APP_URL=$DEPLOY_URL|" .env.local
  
  # Also update in Vercel
  echo "$DEPLOY_URL" | vercel env add NEXT_PUBLIC_APP_URL production --force 2>/dev/null || true
  echo "$DEPLOY_URL" | vercel env add NEXT_PUBLIC_APP_URL preview --force 2>/dev/null || true
  success "NEXT_PUBLIC_APP_URL updated to production URL"
else
  warn "Could not detect deploy URL automatically"
fi

echo ""

# ─── Done! ─────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}${GREEN}================================================${NC}"
echo -e "${BOLD}${GREEN}  ✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${BOLD}${GREEN}================================================${NC}"
echo ""
echo -e "  ${BOLD}App URL:${NC}      ${DEPLOY_URL:-Check Vercel Dashboard}"
echo -e "  ${BOLD}Supabase:${NC}     $PROJECT_URL"
echo ""
echo -e "${YELLOW}Post-deployment verification:${NC}"
echo "  1. Buka ${DEPLOY_URL:-app URL}/api/worker  (harusnya return JSON queue stats)"
echo "  2. Login sebagai mahasiswa dan coba upload sertifikat"
echo "  3. Cek Vercel dashboard → Cron Jobs tab untuk melihat worker triggers"
echo "  4. Cek Supabase → Table Editor → review_batches untuk melihat data"
echo ""
