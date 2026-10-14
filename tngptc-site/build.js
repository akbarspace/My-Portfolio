// Static site builder. Reads data/site.json and writes all HTML pages.
// Run: node tools/gen-art.js   (illustrations, optional)
//      node build.js           (pages)
const fs = require('fs'), path = require('path');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/site.json'), 'utf8'));
const C = D.college, L = D.officialLinks;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const deptPath = (d) => `departments/${d.slug}.html`;
const w = (file, html) => { fs.mkdirSync(path.dirname(path.join(__dirname, file)), { recursive: true }); fs.writeFileSync(path.join(__dirname, file), html); };
const ext = (u, t) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`;

const NAV = [['index.html', 'Home'], ['about.html', 'About'], ['departments.html', 'Departments'], ['notices.html', 'Notices'], ['gallery.html', 'Gallery'], ['admissions.html', 'Admissions'], ['contact.html', 'Contact']];

function layout({ file, title, desc, body, active }) {
  const r = file.includes('/') ? '../' : '';
  const nav = NAV.map(([h, t]) => `<li><a href="${r}${h}"${active === h ? ' aria-current="page"' : ''}>${t}</a></li>`).join('');
  return `<!doctype html>
<html lang="en" class="no-js"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} | TNGPTC Madurai</title><meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0b1f4b"><link rel="icon" href="${r}assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${r}assets/css/style.css"></head><body>
<a class="skip" href="#main">Skip to content</a>
<div class="topbar"><div class="wrap"><span>${esc(C.name)}</span><span><a href="${C.phoneHref}">${C.phone}</a> · <a href="mailto:${C.email}">${C.email}</a></span></div></div>
<header class="site-header"><div class="wrap">
<a class="brand" href="${r}index.html"><span class="brand-mark" aria-hidden="true">TN</span><span><b>TNGPTC, Madurai-11</b><small>Government Polytechnic College (Autonomous)</small></span></a>
<button class="menu-btn" aria-expanded="false" aria-controls="site-nav"><span aria-hidden="true">☰</span> Menu</button>
<nav class="nav" id="site-nav" aria-label="Main"><ul>${nav}</ul></nav></div></header>
<main id="main">${body}</main>
<footer class="site-footer"><div class="wrap"><div class="grid g3">
<div><h3>${esc(C.short)}</h3><p>${C.addressLines.join('<br>')}<br><a href="${C.phoneHref}">${C.phone}</a><br><a href="mailto:${C.email}">${C.email}</a></p></div>
<div><h3>Explore</h3><ul>${NAV.map(([h, t]) => `<li><a href="${r}${h}">${t}</a></li>`).join('')}</ul></div>
<div><h3>Official links</h3><ul><li>${ext(C.officialSite, 'Official website')}</li><li>${ext(L.courses, 'Courses')}</li><li>${ext(L.mandatory, 'Mandatory disclosure')}</li><li>${ext(L.eoa, 'EOA report')}</li><li>${ext(L.grievance, 'Online grievance')}</li></ul></div>
</div><p class="legal">Content verified against ${ext(C.officialSite, 'tngptcmadurai.com')} on ${D.verifiedOn}. Images labelled “Illustration” are artwork, not photographs of college facilities. This redesign is a separate presentation of public information; the official website remains the authority.</p></div></footer>
<script src="${r}assets/js/main.js"></script></body></html>`;
}

const modeChips = (d) => d.modes.length ? d.modes.map((m) => `<span class="chip gold">${esc(m)}</span>`).join('') : '<span class="chip">Foundation (first year)</span>';
function deptCard(d, r = '') {
  return `<article class="card dept-card reveal"><div class="img"><img src="${r}assets/img/art-${d.art}.svg" alt="${esc(d.artCaption)}" loading="lazy" width="800" height="500"></div>
<div class="body"><h3><a href="${r}${deptPath(d)}">${esc(d.name)}</a></h3><div class="chips">${modeChips(d)}</div><span class="more">View department →</span></div></article>`;
}

// ---------- HOME ----------
const news = D.notices.map((n) => `<li>${n.isNew ? '<span class="badge-new">NEW</span>' : ''}<div><strong>${esc(n.title)}</strong>${n.titleTa ? `<br><span lang="ta">${esc(n.titleTa)}</span>` : ''}<br><small>${esc(n.period)}</small></div></li>`).join('');
w('index.html', layout({
  file: 'index.html', title: 'Home', active: 'index.html',
  desc: 'Tamil Nadu Government Polytechnic College (Autonomous), Madurai-11 – diploma courses, departments, notices and admissions information.',
  body: `<section class="hero"><img class="bg" src="${C.heroPhoto}" alt="" onerror="this.onerror=null;this.src='assets/img/art-campus.svg'"><div class="wrap">
<span class="eyebrow" style="color:var(--gold-2)">Educating since ${C.established}</span>
<h1>Tamil Nadu Government Polytechnic College, Madurai</h1>
<p>An autonomous government polytechnic in Madurai offering diploma programmes across ${D.departments.length} departments, with Shift I, Shift II, Tamil-medium, Sandwich and Part-Time options.</p>
<div class="actions"><a class="btn primary" href="departments.html">Explore departments</a><a class="btn ghost" href="admissions.html">Admissions information</a></div></div>
<span class="photo-tag">Photo: official college website carousel (fallback: illustration)</span></section>
<section class="section"><div class="wrap"><span class="eyebrow">Departments</span><h2>Find your discipline</h2><p class="lead">Every card opens its department page with the official syllabus links.</p>
<div class="grid g3" style="margin-top:1.5rem">${D.departments.map((d) => deptCard(d)).join('')}</div></div></section>
<section class="section dark"><div class="wrap"><div class="grid g3">
<div><span class="eyebrow">Our mission</span><h2>Skills for society</h2><p class="lead">The college states that it empowers youth through industry-aligned diploma and skill programmes, with flexible, inclusive education, career guidance and industry partnerships.</p></div>
<div class="stat"><b>${C.established}</b><span>Year established</span></div><div class="stat"><b>${D.departments.length}</b><span>Departments (official count)</span></div></div>
<p class="sourcebox" style="color:#cbd5ee;border-color:rgba(255,255,255,.2)">Source: ${ext(C.officialSite, 'official homepage')}. Student and placement statistics shown on the official homepage are not repeated here until they carry a stated year.</p></div></section>
<section class="section alt"><div class="wrap"><span class="eyebrow">Centres of Excellence</span><h2>Future-ready labs</h2><div class="grid g4" style="margin-top:1.2rem">
${D.centresOfExcellence.map((c) => `<a class="card pad reveal" style="text-decoration:none" href="${deptPath(D.departments.find((d) => d.slug === c.slug))}"><h3>${esc(c.name)}</h3><p>${esc(c.dept)}</p></a>`).join('')}</div></div></section>
<section class="section"><div class="wrap"><div class="two"><div><span class="eyebrow">Latest notices</span><h2>News and events</h2><ul class="notice-list">${news}</ul><p style="margin-top:1rem"><a class="btn dark sm" href="notices.html">All notices</a></p></div>
<div><span class="eyebrow">Services</span><h2>Beyond the classroom</h2><ul class="notice-list">${D.services.map((s) => `<li><div><strong>${esc(s.name)}</strong><br>${esc(s.text)}</div></li>`).join('')}</ul></div></div></div></section>`
}));

// ---------- ABOUT ----------
w('about.html', layout({
  file: 'about.html', title: 'About', active: 'about.html', desc: 'History and mission of Tamil Nadu Government Polytechnic College, Madurai.',
  body: `<section class="hero small"><img class="bg" src="assets/img/art-campus.svg" alt=""><div class="wrap"><h1>About the college</h1><p>A premier technical institute in Southern India, as described on the official website.</p></div><span class="photo-tag">Illustration</span></section>
<section class="section"><div class="wrap"><div class="two"><div><h2>Mission</h2><p>Tamil Nadu Polytechnic College, Madurai empowers youth through industry-aligned diploma and skill programmes, fostering employability in urban and rural sectors, with flexible and inclusive education, career guidance and strong industry partnerships.</p>
<h2>History</h2><div class="tablewrap"><table><thead><tr><th>Year</th><th>Milestone</th></tr></thead><tbody>${D.timeline.map(([y, t]) => `<tr><td><strong>${y}</strong></td><td>${esc(t)}</td></tr>`).join('')}</tbody></table></div>
<p class="sourcebox">Source: ${ext(C.officialSite, 'Institute Profile, official homepage')}, checked ${D.verifiedOn}.</p></div>
<aside><div class="card pad"><h3>Official disclosures</h3><ul><li>${ext(L.mandatory, 'Mandatory disclosure')}</li><li>${ext(L.eoa, 'EOA report')}</li><li>${ext(L.aicte, 'AICTE feedback')}</li><li>${ext(L.alumni, 'Alumni')}</li><li>${ext(L.library, 'Library')}</li><li>${ext(L.hostel, 'Hostel')}</li><li>${ext(L.nss, 'NSS')} · ${ext(L.ncc, 'NCC')}</li></ul></div></aside></div></div></section>`
}));

// ---------- DEPARTMENTS INDEX ----------
const catRows = D.catalogue.map((c) => `<tr><td>${esc(c.course)}</td><td>${esc(c.mode)}</td></tr>`).join('');
w('departments.html', layout({
  file: 'departments.html', title: 'Departments', active: 'departments.html', desc: 'All nine departments and the official course catalogue with study modes.',
  body: `<section class="hero small"><img class="bg" src="assets/img/art-basic.svg" alt=""><div class="wrap"><h1>Departments</h1><p>Nine departments. Study modes below are copied from the official course catalogue.</p></div><span class="photo-tag">Illustration</span></section>
<section class="section"><div class="wrap"><div class="grid g3">${D.departments.map((d) => deptCard(d)).join('')}</div></div></section>
<section class="section alt"><div class="wrap"><span class="eyebrow">Official course catalogue</span><h2>Courses and study modes</h2>
<div class="tablewrap"><table><thead><tr><th>Course</th><th>Mode</th></tr></thead><tbody>${catRows}</tbody><caption>Source: ${ext(L.courses, 'tngptcmadurai.com/courses.php')}, checked ${D.verifiedOn}. Basic Engineering, Plastic and Polymer pages carry no separate Shift I / II listing; Plastic and Polymer are listed as Sandwich only.</caption></table></div></div></section>`
}));

// ---------- DEPARTMENT PAGES ----------
D.departments.forEach((d) => {
  const f = deptPath(d);
  const side = D.departments.map((x) => `<li><a href="${x.slug}.html"${x.slug === d.slug ? ' aria-current="page"' : ''}>${esc(x.short || x.name)}</a></li>`).join('');
  const modes = d.modeDetail ? `<ul>${d.modeDetail.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : `<p>${esc(d.modeNote)}</p>`;
  const syl = `<ul class="syl">${d.syllabus.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer"><span>${esc(s.label)}</span><span class="scheme">${s.scheme}</span></a></li>`).join('')}</ul>`;
  const dist = ['Civil', 'Mechanical', 'EEE', 'Computer'].length; // keep linter quiet
  const fac = `<details class="fac"><summary>Faculty and staff as listed on the official page (${d.faculty.length})</summary><ul class="faculty">${d.faculty.map(([n, r]) => `<li>${esc(n)}<small>${esc(r)}</small></li>`).join('')}</ul></details>`;
  w(f, layout({
    file: f, title: d.name, active: 'departments.html', desc: `${d.name} at TNGPTC Madurai – study modes, official syllabus links and faculty.`,
    body: `<section class="hero small"><img class="bg" src="../assets/img/art-${d.art}.svg" alt="${esc(d.artCaption)}"><div class="wrap"><p class="crumbs"><a href="../index.html">Home</a> / <a href="../departments.html">Departments</a> / ${esc(d.name)}</p><h1>${esc(d.name)}</h1><div class="chips">${modeChips(d)}</div></div><span class="photo-tag">${esc(d.artCaption)} (not a photo of the college)</span></section>
<section class="section"><div class="wrap"><ul class="side-nav" aria-label="Departments">${side}</ul></div></section>
<section class="section" style="padding-top:0"><div class="wrap"><div class="two"><div>
<h2>Course overview</h2><h3>Study modes (official catalogue)</h3>${modes}
${d.highlight ? `<h3>Highlights</h3><ul>${d.highlight.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>` : ''}
<div class="placeholder"><b>Placeholder:</b> a verified course description, intake and duration were not published on the official department page. Add them to <code>data/site.json</code> when the college provides them.</div>
<h2 style="margin-top:2rem">Syllabus</h2>${d.syllabusNote ? `<p>${esc(d.syllabusNote)}</p>` : ''}<p>Official PDFs. Where only a combined C23 document is published, semester-wise files are not separately available.</p>${syl}
<h2 style="margin-top:2rem">Faculty</h2>${fac}
</div><aside>
<div class="card pad"><h3>Facilities and laboratories</h3><div class="placeholder"><b>Placeholder:</b> the official department page lists no laboratories or facilities. Nothing has been invented here.</div></div>
<div class="card pad" style="margin-top:1.2rem"><h3>Student projects</h3><div class="placeholder"><b>Placeholder:</b> no student project photos are published by the college yet. Real work can be added to the <code>projects</code> list in <code>data/site.json</code>.</div></div>
<p style="margin-top:1.2rem"><a class="btn dark" href="../departments.html">← Back to Departments</a></p></aside></div>
<p class="sourcebox">Source: ${ext(`https://tngptcmadurai.com/dept.php?deptid=${d.officialId}`, 'official department page')}, checked ${D.verifiedOn}. Syllabus schemes: N-20 and C23 as labelled by the college.</p></div></section>`
  }));
});

// ---------- NOTICES ----------
w('notices.html', layout({
  file: 'notices.html', title: 'Notices', active: 'notices.html', desc: 'Latest official notices of TNGPTC Madurai.',
  body: `<section class="section"><div class="wrap"><span class="eyebrow">Notices</span><h1>News and events</h1><ul class="notice-list">${news}</ul>
<div class="placeholder" style="margin-top:1.2rem"><b>Note:</b> the official notices page shows titles only; no document links or dates were published at the time of checking. Open the official page for any attachment.</div>
<p style="margin-top:1rem">${ext(L.news, 'Official news page')} · ${ext(L.exams, 'Examinations')} · ${ext(L.results, 'Results')}</p></div></section>`
}));

// ---------- GALLERY ----------
const gal = D.departments.map((d) => `<button type="button" data-lightbox data-src="assets/img/art-${d.art}.svg" data-alt="${esc(d.artCaption)}" data-caption="${esc(d.artCaption)} – illustration, not a college photo"><img src="assets/img/art-${d.art}.svg" alt="${esc(d.artCaption)}" loading="lazy" width="800" height="500"><span class="cap">${esc(d.name)} · Illustration</span></button>`).join('');
w('gallery.html', layout({
  file: 'gallery.html', title: 'Gallery', active: 'gallery.html', desc: 'Gallery of departments (illustrations) with links to official college photographs.',
  body: `<section class="section"><div class="wrap"><span class="eyebrow">Gallery</span><h1>Gallery</h1>
<div class="placeholder"><b>Illustrations only.</b> These images are artwork created for this redesign. They are not photographs of the college. Real photographs are on the official site: ${ext(L.nss, 'NSS gallery')} · ${ext(L.ncc, 'NCC gallery')}.</div>
<div class="gal" style="margin-top:1.5rem">${gal}</div></div></section>`
}));

// ---------- ADMISSIONS ----------
const fees = D.firstYearFees;
w('admissions.html', layout({
  file: 'admissions.html', title: 'Admissions', active: 'admissions.html', desc: 'Course catalogue, study modes and published first-year fees at TNGPTC Madurai.',
  body: `<section class="section"><div class="wrap"><span class="eyebrow">Admissions</span><h1>Admissions information</h1>
<p class="lead">This page shows published information only. It has no application or payment forms. For admission dates, eligibility, seats and procedure, contact the college or use the official site.</p>
<h2>Study modes offered</h2><div class="chips" style="margin-bottom:1rem">${D.studyModes.map((m) => `<span class="chip gold">${m}</span>`).join('')}</div>
<div class="tablewrap"><table><thead><tr><th>Course</th><th>Mode</th></tr></thead><tbody>${catRows}</tbody></table></div>
<h2 style="margin-top:2rem">First-year fees (as published)</h2>
<div class="tablewrap"><table><thead><tr><th>Item</th><th>Amount (Rs)</th></tr></thead><tbody>${fees.rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody><caption>${esc(fees.caption)} ${esc(fees.genuineness)} Source: ${ext(L.fees, 'official fee page')}. Confirm with the college before paying anything.</caption></table></div>
<div class="placeholder" style="margin-top:1.5rem"><b>Placeholders:</b> admission dates, eligibility, seat matrix and application procedure are not published on the pages checked. Contact <a href="mailto:${C.email}">${C.email}</a> or <a href="${C.phoneHref}">${C.phone}</a>.</div></div></section>`
}));

// ---------- CONTACT ----------
w('contact.html', layout({
  file: 'contact.html', title: 'Contact', active: 'contact.html', desc: 'Address, phone, email and map for TNGPTC Madurai.',
  body: `<section class="section"><div class="wrap"><span class="eyebrow">Contact</span><h1>Contact us</h1><div class="grid g2"><div class="card pad"><h3>Office</h3><p>${C.addressLines.join('<br>')}</p><p><a class="btn dark sm" href="${C.phoneHref}">Call ${C.phone}</a> <a class="btn primary sm" href="mailto:${C.email}">Email</a></p><p><a class="btn dark sm" href="${C.mapLink}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p><p class="sourcebox">Source: ${ext(L.contact, 'official contact page')}, checked ${D.verifiedOn}. The official site also shows a different placeholder phone number on some pages; the number above is the one on the contact page.</p></div>
<iframe class="map" title="Map of the college" src="${C.mapEmbed}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div></div></section>`
}));

w('assets/img/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0b1f4b"/><text x="32" y="42" text-anchor="middle" font-family="Georgia" font-size="28" font-weight="700" fill="#f0d36b">TN</text></svg>`);
console.log('Built', 7 + D.departments.length, 'pages');
