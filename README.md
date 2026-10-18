# TechPulse - Responsive Blog on Modern Web/IT Technologies
PBL Activity - 02 | Web Application Development | S. N. Patel Institute of Technology, Bardoli

Stack: HTML5, CSS3, Bootstrap 5, JavaScript, Node.js, Express.js, MongoDB (Mongoose), bcryptjs, JWT, ExcelJS.

## Run locally
1. Install Node.js 18+ and MongoDB (or use a free MongoDB Atlas URI).
2. `npm install`
3. Edit `.env` if needed (MONGO_URI, JWT_SECRET).
4. `npm run seed`  (creates 10 articles + demo accounts)
5. `npm start`  -> open http://localhost:3000

## Demo accounts
- Admin: admin@techpulse.com / Admin@123  (use "Admin Login")
- Reader: reader@techpulse.com / Reader@123

## Required sections (per assignment)
Header, Footer, Navigation bar, Sidebar (search, categories, most read, latest) and main blog content area on every page.

## Features
Reader: register, login, profile edit, browse/search/filter articles, save articles, comment (admin approval).
Admin: dashboard stats, article CRUD, announcements CRUD, comment approve/reject/delete, readers list, Excel export (readers, articles, comments).

## Pages
index, blog, post, register, login, dashboard, profile, admin (in /public). API in server.js. Deploy on Render like the reference project (set MONGO_URI and JWT_SECRET env vars; start command `npm start`).
