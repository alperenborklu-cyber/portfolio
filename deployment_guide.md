# Deploying Your Portfolio to a Domain

Your portfolio is a **Static Website** (HTML, CSS, JS). This makes it very easy and free to host!

> **IMPORTANT:** The "Edit" and "Delete" buttons I created for you will **ONLY** work on your local computer (`localhost`). They will automatically disappear when you publish the site to the internet. This is a safety feature so visitors cannot delete your work.

## Option 1: Netlify (Recommended - Easiest)
1. Go to [Netlify.com](https://www.netlify.com/) and sign up (free).
2. Once logged in, you will see a text saying **"Drag and drop your site folder here"**.
3. Drag your entire `portfolio-v1` folder onto that area.
4. **Done!** Netlify will give you a link (e.g., `alp-portfolio.netlify.app`).
5. **Custom Domain:** Click "Domain Settings" > "Add custom domain" to use your own `.com` domain.

## Option 2: Vercel (Also specific for developers)
1. Go to [Vercel.com](https://vercel.com/) and sign up.
2. Install Vercel CLI or link your GitHub account.
3. Import your project directory.
4. It will deploy instantly.

## Option 3: GitHub Pages (Free)
1. Create a GitHub repository.
2. Push your code to the repository.
3. Go to Settings > Pages and select the `main` branch.
4. Your site will be live at `yourusername.github.io/repo-name`.

---

## Technical Note
Since your site is static, the `server.py` file is **NOT needed** for the public website. You only need to upload:
- `index.html`
- `styles.css`
- `script.js`
- `assets/` folder
