# ✅ Naxtap Deployment Checklist

## 🖥️ Server Setup (Run on Ubuntu Server)

### Initial Server Setup
- [ ] Connect to server: `ssh -i "%USERPROFILE%\.ssh\hassan" root@31.97.113.219`
- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Run server setup script: `./server-setup.sh`
- [ ] Verify Node.js 18.x installed: `node --version`
- [ ] Verify npm installed: `npm --version`
- [ ] Verify PM2 installed: `pm2 --version`
- [ ] Verify Nginx installed: `nginx --version`
- [ ] Verify PostgreSQL installed: `sudo systemctl status postgresql`
- [ ] Verify Redis installed: `sudo systemctl status redis-server`

## 📦 Code Deployment

### Repository Setup
- [ ] Clone repository to `/var/www/naxtap`
- [ ] Install dependencies: `npm install`
- [ ] Copy environment file: `cp env.example .env`
- [ ] Configure `.env` with production values
- [ ] Build web app: `npm run build:web`
- [ ] Verify build success: `ls -la dist/`

### Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL=https://naxtap.az`
- [ ] Configure database URL
- [ ] Set JWT secret (generate strong secret)
- [ ] Add Payriff credentials (if available)
- [ ] Set API rate limits

## 🌐 Web Server Configuration

### Nginx Setup
- [ ] Create Nginx config: `/etc/nginx/sites-available/naxtap.az`
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/naxtap.az /etc/nginx/sites-enabled/`
- [ ] Remove default site: `sudo rm -f /etc/nginx/sites-enabled/default`
- [ ] Test config: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`

### SSL Certificate
- [ ] Install SSL certificate: `sudo certbot --nginx -d naxtap.az -d www.naxtap.az`
- [ ] Verify SSL works: `curl -I https://naxtap.az`
- [ ] Setup auto-renewal: Add cron job for certbot
- [ ] Test auto-renewal: `sudo certbot renew --dry-run`

## 🚀 Application Startup

### PM2 Configuration
- [ ] Start API server: `pm2 start ecosystem.config.js --env production`
- [ ] Verify API running: `pm2 status`
- [ ] Check API logs: `pm2 logs naxtap-api`
- [ ] Check web server: `pm2 logs naxtap-web`
- [ ] Save PM2 config: `pm2 save`
- [ ] Setup PM2 startup: `pm2 startup`

## 🔍 Verification Tests

### Basic Functionality
- [ ] Website loads: `https://naxtap.az`
- [ ] SSL certificate valid (green lock in browser)
- [ ] API responds: `https://naxtap.az/api/`
- [ ] No console errors in browser
- [ ] Mobile responsive design works
- [ ] All navigation links work

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] No memory leaks (check `pm2 monit`)
- [ ] CPU usage normal (< 50% average)
- [ ] Memory usage stable

### Security Tests
- [ ] HTTPS redirect works
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] No sensitive data in logs

## 🛠️ Troubleshooting

### If website doesn't load:
- [ ] Check PM2 status: `pm2 status`
- [ ] Check Nginx status: `sudo systemctl status nginx`
- [ ] Check logs: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`
- [ ] Check firewall: `sudo ufw status`
- [ ] Check DNS: `nslookup naxtap.az`

### If API doesn't respond:
- [ ] Check if port 3000 is open: `sudo netstat -tlnp | grep :3000`
- [ ] Check API logs: `pm2 logs naxtap-api`
- [ ] Test API directly: `curl http://localhost:3000/api/`
- [ ] Check environment variables in `.env`

### If SSL issues:
- [ ] Check certificate: `sudo certbot certificates`
- [ ] Renew certificate: `sudo certbot renew`
- [ ] Check Nginx config: `sudo nginx -t`
- [ ] Restart Nginx: `sudo systemctl restart nginx`

## 📊 Post-Deployment

### Monitoring Setup
- [ ] Setup log rotation
- [ ] Monitor disk space: `df -h`
- [ ] Monitor memory: `free -h`
- [ ] Setup backup strategy
- [ ] Document server credentials

### Performance Optimization
- [ ] Enable Gzip compression (already in Nginx config)
- [ ] Setup Redis caching
- [ ] Optimize images
- [ ] Setup CDN (optional)

### Security Hardening
- [ ] Update system packages regularly
- [ ] Setup fail2ban (optional)
- [ ] Regular security updates
- [ ] Monitor access logs

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Website loads at https://naxtap.az
- ✅ SSL certificate is valid and auto-renewing
- ✅ API endpoints respond correctly
- ✅ PM2 processes are stable
- ✅ Nginx serves content efficiently
- ✅ No critical errors in logs
- ✅ Performance metrics are good

## 📞 Emergency Contacts

If deployment fails:
1. Check logs first
2. Restart services: `pm2 restart all && sudo systemctl restart nginx`
3. Rollback if needed: `git checkout previous-commit`
4. Contact system administrator

---

**🎯 Ready to deploy? Follow the steps in order and check each item!**