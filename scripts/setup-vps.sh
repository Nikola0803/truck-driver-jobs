#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# TruckDriverJobs.co — VPS Setup Script
# Ubuntu 24.x  |  Run as root
#
# What this does:
#   1. Updates Ubuntu
#   2. Installs Node.js 20, PM2, Nginx, Certbot
#   3. Clones your GitHub repo
#   4. Installs dependencies + builds the app
#   5. Starts the app with PM2 (auto-restarts on crash/reboot)
#   6. Configures Nginx as reverse proxy
#   7. Generates a deploy SSH key for GitHub Actions auto-deploy
#
# Run with:
#   bash setup-vps.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── CONFIG — edit these ───────────────────────────────────────────────────────
GITHUB_REPO="https://github.com/Nikola0803/truck-driver-jobs.git"
DOMAIN="truckdriverjobs.co"
APP_DIR="/var/www/truck-driver-jobs"
APP_USER="root"   # change to a non-root user if you prefer
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅  $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
error()   { echo -e "${RED}❌  $1${NC}"; exit 1; }

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "   🚛  TruckDriverJobs.co — VPS Setup"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Safety checks
[[ $EUID -ne 0 ]] && error "Run as root: sudo bash setup-vps.sh"
[[ "$GITHUB_REPO" == *"YOUR_USERNAME"* ]] && error "Edit GITHUB_REPO in this script first (line 27)"

# ── 1. System update ─────────────────────────────────────────────────────────
info "Updating Ubuntu packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git unzip ufw
success "System updated"

# ── 2. Node.js 20 ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  info "Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - -qq
  apt-get install -y -qq nodejs
  success "Node.js $(node -v) installed"
else
  success "Node.js $(node -v) already installed"
fi

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2..."
  npm install -g pm2 --silent
  success "PM2 installed"
else
  success "PM2 $(pm2 -v) already installed"
fi

mkdir -p /var/log/pm2

# ── 4. Nginx ─────────────────────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  info "Installing Nginx..."
  apt-get install -y -qq nginx
  success "Nginx installed"
else
  success "Nginx already installed"
fi

# ── 5. Certbot ───────────────────────────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  info "Installing Certbot (Let's Encrypt SSL)..."
  apt-get install -y -qq certbot python3-certbot-nginx
  success "Certbot installed"
fi

# ── 6. Firewall ──────────────────────────────────────────────────────────────
info "Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall configured (SSH + HTTP/HTTPS open)"

# ── 7. Clone repo ────────────────────────────────────────────────────────────
info "Setting up app directory at $APP_DIR..."
mkdir -p "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
  warn "Repo already exists — pulling latest..."
  cd "$APP_DIR"
  git pull origin main || warn "Pull failed — continuing with existing files"
elif git ls-remote "$GITHUB_REPO" &>/dev/null 2>&1; then
  git clone "$GITHUB_REPO" "$APP_DIR"
  cd "$APP_DIR"
  success "Repo cloned from GitHub"
else
  warn "GitHub repo not accessible yet — you'll push code after this script."
  warn "Files will be deployed automatically on your first git push."
  cd "$APP_DIR"
  # Init empty git repo so PM2 config exists
  git init
  git remote add origin "$GITHUB_REPO" 2>/dev/null || true
fi

# ── 8. .env file ─────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  warn ".env file missing — creating template..."
  cat > "$APP_DIR/.env" << 'ENVEOF'
# Fill in your values — see .env in your local project
JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
ANTHROPIC_API_KEY=
ADMIN_EMAIL=admin@truckdriverjobs.co
ADMIN_PASSWORD=CHANGE_THIS
PORT=3001
DATA_DIR=/var/www/truck-driver-jobs/server/data
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
CAREERJET_AFFID=
USAJOBS_API_KEY=
USAJOBS_USER_AGENT=
RESEND_API_KEY=
RESEND_FROM=TruckDriverJobs.co <noreply@truckdriverjobs.co>
ENVEOF
  echo ""
  warn "You MUST edit .env before starting the app:"
  warn "  nano $APP_DIR/.env"
  echo ""
fi

# ── 9. Install deps + build (only if package.json exists) ───────────────────
cd "$APP_DIR"
if [ -f "package.json" ]; then
  info "Installing npm dependencies..."
  npm ci
  success "Dependencies installed"

  info "Building frontend..."
  npm run build
  success "Frontend built"

  # ── 10. Start with PM2 ───────────────────────────────────────────────────
  info "Starting app with PM2..."
  pm2 delete truck-driver-jobs 2>/dev/null || true
  pm2 start ecosystem.config.cjs
  pm2 save
else
  warn "No package.json yet — app will start automatically on first git push deploy."
fi

# Enable PM2 on reboot
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
pm2 save
success "App running with PM2 (auto-starts on reboot)"

# ── 11. Nginx config ─────────────────────────────────────────────────────────
info "Configuring Nginx..."
cp "$APP_DIR/nginx.conf" "/etc/nginx/sites-available/$DOMAIN"

# Enable site
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"

# Remove default site
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
success "Nginx configured and reloaded"

# ── 12. Deploy SSH key for GitHub Actions ─────────────────────────────────────
info "Generating deploy SSH key for GitHub Actions..."
KEY_PATH="/root/.ssh/github_deploy_key"

if [ ! -f "$KEY_PATH" ]; then
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY_PATH" -N ""
fi

# Add public key to authorized_keys so GitHub Actions can SSH in
cat "$KEY_PATH.pub" >> /root/.ssh/authorized_keys
sort -u /root/.ssh/authorized_keys -o /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys

# ── 13. Done — print summary ──────────────────────────────────────────────────
VPS_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}🚀  Setup complete!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "  ${BLUE}App URL:${NC}     http://$VPS_IP  (or http://$DOMAIN once DNS points here)"
echo -e "  ${BLUE}PM2 status:${NC}  pm2 status"
echo -e "  ${BLUE}App logs:${NC}    pm2 logs truck-driver-jobs"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📋  GITHUB ACTIONS AUTO-DEPLOY SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Go to your GitHub repo → Settings → Secrets → Actions"
echo "  Add these 3 secrets:"
echo ""
echo -e "  ${YELLOW}VPS_HOST${NC}     = $VPS_IP"
echo -e "  ${YELLOW}VPS_USER${NC}     = root"
echo -e "  ${YELLOW}VPS_SSH_KEY${NC}  = (copy everything below, including the BEGIN/END lines)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$KEY_PATH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  After adding secrets — push any commit to main to trigger deploy."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔒  ENABLE SSL (run after DNS is pointed to this VPS):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""

if [ -f "$APP_DIR/.env" ] && grep -q "CHANGE_THIS" "$APP_DIR/.env"; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "  ${RED}⚠️  Don't forget to fill in your .env file:${NC}"
  echo "  nano $APP_DIR/.env"
  echo "  Then restart: pm2 restart truck-driver-jobs"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
echo ""
