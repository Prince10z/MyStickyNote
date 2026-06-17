# Ubuntu Server Setup Guide for MyStickyNote

This guide walks you through setting up a clean Ubuntu Server to host your Next.js landing page and web application, reverse-proxied with **Nginx** and secured with a free **Let's Encrypt SSL certificate**.

---

## Step 1: Update System Packages

SSH into your Ubuntu server and run the following command to update your system's package list:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2: Install Node.js (v20) and Git

Install Node.js v20 (recommended for Next.js 16) and necessary build dependencies:

```bash
# Add NodeSource repository for Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js, npm, and Git
sudo apt install -y nodejs git build-essential
```

Verify the installation:
```bash
node -v  # Should output v20.x.x
npm -v   # Should output v10.x.x
```

---

## Step 3: Install and Configure PM2

PM2 is a production process manager that keeps your Next.js application running 24/7 and restarts it automatically if it crashes.

1. **Install PM2 globally:**
   ```bash
   sudo npm install pm2 -g
   ```

2. **Configure PM2 to start on boot:**
   ```bash
   pm2 startup systemd
   ```
   *Note: This command will output a configuration line that you must copy, paste, and run in your terminal to complete the configuration.*

3. **Save the current PM2 process list (run after your app is started):**
   ```bash
   pm2 save
   ```

---

## Step 4: Prepare the Deployment Directory

Create the directory where GitHub Actions will copy your application files, and change ownership to your deployment user (replace `ubuntu` with your SSH username):

```bash
sudo mkdir -p /var/www/mystickynote/landing-page
sudo chown -R ubuntu:ubuntu /var/www/mystickynote
```

---

## Step 5: Install and Configure Nginx

Nginx will act as a reverse proxy, receiving public traffic on ports 80 (HTTP) and 443 (HTTPS) and forwarding it to Next.js running locally on port 3000.

1. **Install Nginx:**
   ```bash
   sudo apt install -y nginx
   ```

2. **Create a new site configuration file:**
   ```bash
   sudo nano /etc/nginx/sites-available/mystickynote
   ```

3. **Paste the following configuration** (replace `your-domain.com` with your actual domain name):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       gzip on;
       gzip_types text/plain application/xml text/css text/javascript application/javascript application/json;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. **Enable the site by creating a symbolic link:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/mystickynote /etc/nginx/sites-enabled/
   ```

5. **Test and reload Nginx configuration:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## Step 6: Secure with Let's Encrypt SSL (HTTPS)

Secure your landing page using Certbot to fetch and install a free SSL certificate.

1. **Install Certbot and the Nginx plugin:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Run Certbot to fetch and configure the SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```
   *Follow the interactive prompt to complete setup. Certbot will automatically rewrite the Nginx configuration to enforce HTTPS.*

---

## Step 7: Configure GitHub Actions Secrets

To allow GitHub Actions to securely build and deploy your project, you will need to add your SSH connection password and server details to GitHub Secrets:

1. **Add the connection details to GitHub Secrets:**
   Go to your GitHub repository, click **Settings > Secrets and variables > Actions > New repository secret**, and create these secrets:
   - `SSH_PASSWORD`: The login password for your SSH user on the Ubuntu server.
   - `SSH_HOST`: The IP address or domain name of your Ubuntu server.
   - `SSH_USER`: The SSH username (e.g., `ubuntu` or `root`).
   - `SSH_PORT`: The SSH port (default is `22`).
   - `NEXT_PUBLIC_GA_ID`: (Optional) Your Google Analytics 4 Measurement ID for the landing page (e.g., `G-0Q00VRF530`).

---

## Step 8: Triggering the First Deployment

Once you push these configuration files to your main branch, GitHub Actions will trigger, build, and deploy the application. 

For the very first deploy, you may need to save the PM2 startup configuration:
```bash
# Verify it runs on the server after the first deploy succeeds:
pm2 list
# If it hasn't registered, manually run:
cd /var/www/mystickynote/landing-page
pm2 start ecosystem.config.js --env production
pm2 save
```
Now, any subsequent git pushes to `main` will compile the landing page, sync the desktop renderer frontend to `/app`, and perform a zero-downtime reload automatically!
