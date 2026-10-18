require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'techpulse_secret';
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Models ----------
const User = mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  enrollment: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: String, department: String, semester: String,
  password: { type: String, required: true },
  role: { type: String, enum: ['reader', 'admin'], default: 'reader' },
  saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true }));

const Post = mongoose.model('Post', new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String], author: { type: String, default: 'TechPulse Team' },
  readMinutes: { type: Number, default: 4 },
  views: { type: Number, default: 0 }
}, { timestamps: true }));

const Comment = mongoose.model('Comment', new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String, text: { type: String, required: true, maxlength: 600 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true }));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true },
  audience: { type: String, default: 'All Readers' }
}, { timestamps: true }));

// ---------- Auth helpers ----------
const sign = u => jwt.sign({ id: u._id, role: u.role }, SECRET, { expiresIn: '7d' });
const auth = (req, res, next) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    req.auth = jwt.verify(t, SECRET); next();
  } catch { res.status(401).json({ message: 'Please log in to continue.' }); }
};
const admin = (req, res, next) => req.auth.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access only.' });
const wrap = fn => (req, res) => fn(req, res).catch(e => res.status(400).json({ message: e.message }));
const clean = u => ({ id: u._id, name: u.name, enrollment: u.enrollment, email: u.email, mobile: u.mobile, department: u.department, semester: u.semester, role: u.role });

// ---------- Auth routes ----------
app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, enrollment, email, mobile, department, semester, password } = req.body;
  if (!name || !email || !password) throw new Error('Name, email and password are required.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  if (await User.findOne({ email: email.toLowerCase() })) throw new Error('This email is already registered.');
  await User.create({ name, enrollment, email, mobile, department, semester, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ message: 'Registration successful!' });
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password, role } = req.body;
  const u = await User.findOne({ email: (email || '').toLowerCase() });
  if (!u || !(await bcrypt.compare(password || '', u.password))) throw new Error('Invalid email or password.');
  if (role === 'admin' && u.role !== 'admin') throw new Error('This account is not an administrator.');
  if (role !== 'admin' && u.role === 'admin') throw new Error('Administrators must use the Admin Login.');
  res.json({ token: sign(u), user: clean(u) });
}));

// ---------- Profile ----------
app.get('/api/me', auth, wrap(async (req, res) => res.json(clean(await User.findById(req.auth.id)))));
app.put('/api/me', auth, wrap(async (req, res) => {
  const { name, email, mobile, department, semester } = req.body;
  const u = await User.findByIdAndUpdate(req.auth.id, { name, email, mobile, department, semester }, { new: true, runValidators: true });
  res.json({ message: 'Profile updated successfully!', user: clean(u) });
}));
app.get('/api/me/dashboard', auth, wrap(async (req, res) => {
  const u = await User.findById(req.auth.id).populate('saved', 'title category');
  const comments = await Comment.find({ user: u._id }).populate('post', 'title').sort('-createdAt');
  res.json({ saved: u.saved, comments });
}));

// ---------- Public blog routes ----------
app.get('/api/posts', wrap(async (req, res) => {
  const { q, category } = req.query; const f = {};
  if (category) f.category = category;
  if (q) { const r = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); f.$or = [{ title: r }, { excerpt: r }, { tags: r }]; }
  res.json(await Post.find(f).select('-content').sort('-createdAt'));
}));
app.get('/api/meta', wrap(async (req, res) => {
  const categories = await Post.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  const recent = await Post.find().select('title category createdAt').sort('-createdAt').limit(4);
  const popular = await Post.find().select('title views').sort('-views').limit(4);
  res.json({ categories, recent, popular });
}));
app.get('/api/posts/:id', wrap(async (req, res) => {
  const p = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
  if (!p) throw new Error('Article not found.');
  res.json(p);
}));
app.get('/api/posts/:id/comments', wrap(async (req, res) =>
  res.json(await Comment.find({ post: req.params.id, status: 'approved' }).sort('-createdAt'))));
app.post('/api/posts/:id/comments', auth, wrap(async (req, res) => {
  const u = await User.findById(req.auth.id);
  await Comment.create({ post: req.params.id, user: u._id, userName: u.name, text: req.body.text });
  res.status(201).json({ message: 'Comment submitted. It will appear after admin approval.' });
}));
app.post('/api/posts/:id/save', auth, wrap(async (req, res) => {
  const u = await User.findById(req.auth.id); const id = req.params.id;
  const has = u.saved.some(s => String(s) === id);
  u.saved = has ? u.saved.filter(s => String(s) !== id) : [...u.saved, id];
  await u.save(); res.json({ saved: !has, message: has ? 'Removed from saved articles.' : 'Article saved.' });
}));

app.get('/api/announcements', wrap(async (req, res) => res.json(await Announcement.find().sort('-createdAt'))));

// ---------- Admin routes ----------
const A = [auth, admin];
app.get('/api/admin/stats', ...A, wrap(async (req, res) => res.json({
  readers: await User.countDocuments({ role: 'reader' }), posts: await Post.countDocuments(),
  comments: await Comment.countDocuments(), pending: await Comment.countDocuments({ status: 'pending' }),
  views: (await Post.aggregate([{ $group: { _id: null, v: { $sum: '$views' } } }]))[0]?.v || 0
})));
app.post('/api/admin/posts', ...A, wrap(async (req, res) => {
  const b = req.body; b.tags = (b.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean);
  res.status(201).json(await Post.create(b));
}));
app.put('/api/admin/posts/:id', ...A, wrap(async (req, res) => {
  const b = req.body; b.tags = (b.tags || '').toString().split(',').map(t => t.trim()).filter(Boolean);
  res.json(await Post.findByIdAndUpdate(req.params.id, b, { new: true, runValidators: true }));
}));
app.delete('/api/admin/posts/:id', ...A, wrap(async (req, res) => {
  await Post.findByIdAndDelete(req.params.id); await Comment.deleteMany({ post: req.params.id }); res.json({ message: 'Deleted' });
}));
app.get('/api/admin/comments', ...A, wrap(async (req, res) => res.json(await Comment.find().populate('post', 'title').sort('-createdAt'))));
app.put('/api/admin/comments/:id', ...A, wrap(async (req, res) =>
  res.json(await Comment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }))));
app.delete('/api/admin/comments/:id', ...A, wrap(async (req, res) => { await Comment.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }));
app.get('/api/admin/readers', ...A, wrap(async (req, res) => res.json(await User.find({ role: 'reader' }).select('-password -saved').sort('-createdAt'))));

app.post('/api/admin/announcements', ...A, wrap(async (req, res) => res.status(201).json(await Announcement.create(req.body))));
app.put('/api/admin/announcements/:id', ...A, wrap(async (req, res) =>
  res.json(await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }))));
app.delete('/api/admin/announcements/:id', ...A, wrap(async (req, res) => { await Announcement.findByIdAndDelete(req.params.id); res.json({ message: 'Deleted' }); }));

app.delete('/api/admin/readers/:id', ...A, wrap(async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u || u.role !== 'reader') throw new Error('Reader not found.');
  await Comment.deleteMany({ user: u._id }); await u.deleteOne(); res.json({ message: 'Reader deleted.' });
}));

// Excel export: /api/admin/export/:type?token=...
app.get('/api/admin/export/:type', wrap(async (req, res) => {
  const t = jwt.verify(req.query.token || '', SECRET); if (t.role !== 'admin') throw new Error('Admin only');
  const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet(req.params.type);
  const defs = {
    readers: [User.find({ role: 'reader' }), [['Name', 'name'], ['Enrollment', 'enrollment'], ['Email', 'email'], ['Mobile', 'mobile'], ['Department', 'department'], ['Semester', 'semester'], ['Registered On', r => r.createdAt.toLocaleString()]]],
    posts: [Post.find(), [['Title', 'title'], ['Category', 'category'], ['Author', 'author'], ['Views', 'views'], ['Published On', r => r.createdAt.toLocaleDateString()]]],
    announcements: [Announcement.find().sort('-createdAt'), [['Title', 'title'], ['Message', 'message'], ['Audience', 'audience'], ['Date', r => r.createdAt.toLocaleString()]]],
    comments: [Comment.find().populate('post', 'title'), [['Article', r => r.post?.title], ['Reader', 'userName'], ['Comment', 'text'], ['Status', 'status'], ['Date', r => r.createdAt.toLocaleString()]]]
  };
  const d = defs[req.params.type]; if (!d) throw new Error('Unknown export type');
  ws.columns = [{ header: 'Sr. No.', width: 8 }, ...d[1].map(c => ({ header: c[0], width: 28 }))];
  ws.getRow(1).font = { bold: true };
  (await d[0]).forEach((r, i) => ws.addRow([i + 1, ...d[1].map(c => typeof c[1] === 'function' ? c[1](r) : r[c[1]])]));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=TechPulse_${req.params.type}.xlsx`);
  await wb.xlsx.write(res); res.end();
}));

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/techpulse')
    .then(() => app.listen(PORT, () => console.log(`TechPulse running at http://localhost:${PORT}`)))
    .catch(e => console.error('MongoDB connection failed:', e.message));
}
module.exports = { User, Post, Comment, Announcement };
