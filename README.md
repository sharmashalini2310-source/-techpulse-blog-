# TechPulse

TechPulse is a responsive full-stack blog that delivers clear, well-organised articles on modern Computer and IT technologies, including Artificial Intelligence, Machine Learning, Cloud Computing, Internet of Things, Blockchain, Cybersecurity, Big Data, Web 3.0, Quantum Computing and Generative AI.

Readers can browse and search articles by topic, save their favourites and join the discussion through moderated comments. Administrators can publish and manage articles, announcements and comments, and export records to Excel.

## Features

**Readers**
- Register, log in and edit profile
- Browse, search and filter articles by category
- Save articles and view them on a personal dashboard
- Post comments, shown after admin approval
- View the latest announcements

**Administrators**
- Dashboard with readers, articles, comments and views statistics
- Create, edit and delete articles and announcements
- Approve, reject or delete comments
- View and delete registered readers
- Export readers, articles, comments and announcements to Excel

**Interface**
- Header, footer, navigation bar and sidebar on every page
- Sidebar with search, categories, most-read and latest posts
- Fully responsive on desktop, tablet and mobile

## Tech Stack

| Layer | Technologies |
|---|---|
| Front end | HTML5, CSS3, Bootstrap 5, JavaScript |
| Back end | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Security | bcryptjs, JSON Web Token |
| Reports | ExcelJS |

## Run Locally

**Prerequisites:** Node.js 18 or later, and MongoDB (local installation or a MongoDB Atlas connection string).

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# 2. Install dependencies
npm install

# 3. Create the environment file
copy .env.example .env        # Windows
# cp .env.example .env        # macOS / Linux

# 4. Load sample articles and demo accounts
npm run seed

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser. If you changed `PORT` in `.env`, use that port instead.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/techpulse` |
| `JWT_SECRET` | Secret key for signing tokens | `use_a_long_random_string` |

> `npm run seed` clears existing data before inserting the sample data.

## Demo Accounts

| Role | Email | Password | Login page |
|---|---|---|---|
| Admin | admin@techpulse.com | Admin@123 | Admin Login |
| Reader | reader@techpulse.com | Reader@123 | Reader Login |

Admin accounts cannot be created from the registration page. Change these demo credentials before any public deployment.
