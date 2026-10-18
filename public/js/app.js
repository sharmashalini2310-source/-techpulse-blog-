const CAT = {
 'Artificial Intelligence':['bi-cpu','#14606b,#0d2b33'],'Machine Learning':['bi-graph-up-arrow','#2f6f4f,#0d2b33'],
 'Cloud Computing':['bi-cloud','#2b6cb0,#0d2b33'],'Internet of Things':['bi-router','#b7791f,#0d2b33'],
 'Blockchain':['bi-link-45deg','#6b46c1,#0d2b33'],'Cybersecurity':['bi-shield-lock','#9b2c2c,#0d2b33'],
 'Big Data':['bi-database','#0f766e,#0d2b33'],'Web 3.0':['bi-globe2','#c05621,#0d2b33'],
 'Quantum Computing':['bi-bullseye','#553c9a,#0d2b33'],'Generative AI':['bi-stars','#b83280,#0d2b33']
};
const catIcon = c => (CAT[c] || ['bi-code-slash'])[0];
const catBg = c => `linear-gradient(135deg,${(CAT[c] || ['', '#14606b,#0d2b33'])[1]})`;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const getUser = () => { try { return JSON.parse(localStorage.getItem('tp_user')); } catch { return null; } };
const token = () => localStorage.getItem('tp_token');
const logout = () => { localStorage.removeItem('tp_token'); localStorage.removeItem('tp_user'); location.href = 'index.html'; };

async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: 'Bearer ' + token() } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Something went wrong.');
  return d;
}
const alertBox = (el, msg, type = 'success') => { el.innerHTML = `<div class="alert alert-${type} py-2" role="alert">${esc(msg)}</div>`; };
function guard(role) { const u = getUser(); if (!u || !token() || (role && u.role !== role)) { location.href = 'login.html' + (role === 'admin' ? '?role=admin' : ''); return null; } return u; }

function renderNav(active) {
  const u = getUser(); const L = (h, t, k) => `<li class="nav-item"><a class="nav-link ${active === k ? 'active' : ''}" href="${h}">${t}</a></li>`;
  const auth = u ? `${L(u.role === 'admin' ? 'admin.html' : 'dashboard.html', 'Dashboard', 'dash')}<li class="nav-item"><button class="btn btn-sm btn-outline-light ms-lg-2 mt-2 mt-lg-0" onclick="logout()">Logout</button></li>`
    : `${L('login.html', 'Reader Login', 'login')}${L('login.html?role=admin', 'Admin Login', 'alogin')}<li class="nav-item"><a class="btn btn-sm btn-amber ms-lg-2 mt-2 mt-lg-0" href="register.html">Register</a></li>`;
  document.getElementById('nav').innerHTML = `<nav class="navbar navbar-expand-lg navbar-dark sticky-top"><div class="container">
   <a class="navbar-brand brand" href="index.html"><i class="bi bi-lightning-charge-fill"></i> TechPulse</a>
   <button class="navbar-toggler" data-bs-toggle="collapse" data-bs-target="#mn" aria-label="Toggle navigation"><span class="navbar-toggler-icon"></span></button>
   <div class="collapse navbar-collapse" id="mn"><ul class="navbar-nav ms-auto align-items-lg-center">${L('index.html', 'Home', 'home')}${L('blog.html', 'Articles', 'blog')}${auth}</ul></div></div></nav>`;
}
function renderFooter() {
  document.getElementById('foot').innerHTML = `<footer><div class="container"><div class="row g-4">
   <div class="col-md-5"><h5 class="text-white"><i class="bi bi-lightning-charge-fill text-warning"></i> TechPulse</h5><p class="small">A responsive blog on modern Computer and IT technologies, built for PBL Activity - 02 (Web Application Development).</p></div>
   <div class="col-6 col-md-3"><h6 class="text-white">Explore</h6><ul class="list-unstyled small"><li><a href="index.html">Home</a></li><li><a href="blog.html">All articles</a></li><li><a href="register.html">Create account</a></li></ul></div>
   <div class="col-6 col-md-4"><h6 class="text-white">Built with</h6><p class="small mb-0">HTML5, CSS3, Bootstrap 5, JavaScript, Node.js, Express.js, MongoDB</p></div></div>
   <hr style="border-color:#1d4650"><p class="small text-center mb-0">&copy; 2026 TechPulse. All Rights Reserved. | S. N. Patel Institute of Technology, Bardoli</p></div></footer>`;
}
async function renderSidebar() {
  const el = document.getElementById('sidebar'); if (!el) return;
  el.innerHTML = `<div class="widget"><h6>Search</h6><form onsubmit="event.preventDefault();location.href='blog.html?q='+encodeURIComponent(this.q.value)"><div class="input-group"><input name="q" class="form-control" placeholder="Search articles" aria-label="Search articles"><button class="btn btn-teal" aria-label="Search"><i class="bi bi-search"></i></button></div></form></div><div id="sbd"></div>`;
  try {
    const m = await api('/meta');
    const li = (p, x) => `<li><a href="post.html?id=${p._id}">${esc(p.title)}</a><div class="meta">${x}</div></li>`;
    document.getElementById('sbd').innerHTML =
     `<div class="widget"><h6>Categories</h6><ul class="list-unstyled mb-0">${m.categories.map(c => `<li class="d-flex justify-content-between"><a href="blog.html?category=${encodeURIComponent(c._id)}"><i class="bi ${catIcon(c._id)} me-2"></i>${esc(c._id)}</a><span class="badge text-bg-light">${c.count}</span></li>`).join('')}</ul></div>
      <div class="widget"><h6>Most read</h6><ul class="list-unstyled mb-0">${m.popular.map(p => li(p, p.views + ' views')).join('')}</ul></div>
      <div class="widget"><h6>Latest posts</h6><ul class="list-unstyled mb-0">${m.recent.map(p => li(p, fmt(p.createdAt))).join('')}</ul></div>`;
  } catch { document.getElementById('sbd').innerHTML = '<div class="widget small text-muted">Sidebar could not load. Check that the server and MongoDB are running.</div>'; }
}
const postCard = p => `<div class="col-md-6"><article class="post-card"><div class="thumb" style="background:${catBg(p.category)}"><i class="bi ${catIcon(p.category)}"></i></div><div class="body">
 <div><span class="badge-cat">${esc(p.category)}</span></div><h5 class="mt-2"><a href="post.html?id=${p._id}">${esc(p.title)}</a></h5><p>${esc(p.excerpt)}</p>
 <div class="meta mt-auto"><i class="bi bi-calendar3"></i> ${fmt(p.createdAt)} &nbsp; <i class="bi bi-clock"></i> ${p.readMinutes} min &nbsp; <i class="bi bi-eye"></i> ${p.views}</div></div></article></div>`;
const renderContent = t => esc(t).split('\n').map(l => l.startsWith('## ') ? `<h5>${l.slice(3)}</h5>` : (l.trim() ? `<p>${l}</p>` : '')).join('');
function layout(active) { renderNav(active); renderFooter(); renderSidebar(); }
