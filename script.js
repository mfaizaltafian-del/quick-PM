

// ---- DIVISIONS CONFIG ----
const DIVISIONS = {
  rd:    { name: 'Research & Development', icon: '🔬', color: '#4f7aff' },
  sales: { name: 'Sales Division',         icon: '📈', color: '#2dd4a7' },
};












// ---- DATA ----
let projects = JSON.parse(localStorage.getItem('pm_projects') || '[]');
let tasks    = JSON.parse(localStorage.getItem('pm_tasks')    || '[]');
let editingProjectId = null;
let editingTaskId    = null;

function save() {
  localStorage.setItem('pm_projects', JSON.stringify(projects));
  localStorage.setItem('pm_tasks',    JSON.stringify(tasks));
}












// ---- SIDEBAR ----
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}











// ---- NAV ----
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.dataset.page === name) n.classList.add('active');
  });
  if (name === 'dashboard') renderDashboard();
  if (name === 'divisions') renderDivisions();
  if (name === 'projects')  renderProjects();
  if (name === 'tasks')     renderTasks();
}















// ---- HELPERS ----
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}


function statusBadge(s) {
  const map = {
    'on-track':  ['On Track',  'status-on-track'],
    'delayed':   ['Delayed',   'status-delayed'],
    'critical':  ['Critical',  'status-critical'],
    'completed': ['Completed', 'status-completed'],
  };
  const [label, cls] = map[s] || ['—', ''];
  return `<span class="status-badge ${cls}">${label}</span>`;
}


function progressClass(s) {
  if (s === 'on-track')  return 'fill-success';
  if (s === 'delayed')   return 'fill-warning';
  if (s === 'critical')  return 'fill-danger';
  return 'fill-accent';
}


function divTag(divId) {
  if (!divId || !DIVISIONS[divId]) return '<span class="div-tag div-tag-none">No Division</span>';
  const cls = divId === 'rd' ? 'div-tag-rd' : 'div-tag-sales';
  return `<span class="div-tag ${cls}">${DIVISIONS[divId].icon} ${DIVISIONS[divId].name}</span>`;
}













// ---- PROJECT CARD ----
function projectCard(p, showActions = true) {
  const progress = Math.min(100, Number(p.progress) || 0);
  const actions = showActions ? `
    <div class="card-actions">
      <button class="icon-btn edit" onclick="event.stopPropagation(); openEditProject('${p.id}')">✎</button>
      <button class="icon-btn" onclick="event.stopPropagation(); deleteProject('${p.id}')">✕</button>
    </div>` : '';

  return `<div class="project-card" onclick="${showActions ? "openEditProject('" + p.id + "')" : ''}">
    <div class="project-card-top">
      <div>
        <div class="project-name">${p.name}</div>
        <div class="project-desc">${p.desc || 'No description'}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        ${statusBadge(p.status)}
        ${actions}
      </div>
    </div>
    <div class="progress-section">
      <div class="progress-top"><span>Progress</span><span>${progress}%</span></div>
      <div class="progress-bar"><div class="progress-fill ${progressClass(p.status)}" style="width:${progress}%"></div></div>
    </div>
    <div class="project-meta">
      <div class="meta-item">👤 ${p.owner || '—'}</div>
      <div class="meta-item">📅 ${fmtDate(p.due)}</div>
    </div>
    <div style="margin-top:10px;">
      ${divTag(p.division)}
    </div>
  </div>`;
}














// ---- DIVISION CARD ----
function divisionCard(divId, isDetail = false) {
  const div = DIVISIONS[divId];
  const divProjects = projects.filter(p => p.division === divId);
  const total = divProjects.length;
  const onTrack  = divProjects.filter(p => p.status === 'on-track').length;
  const completed = divProjects.filter(p => p.status === 'completed').length;
  const avgProgress = total === 0 ? 0 : Math.round(divProjects.reduce((a, p) => a + (Number(p.progress) || 0), 0) / total);

  return `<div class="division-card" style="--div-color:${div.color}" onclick="openDivDetail('${divId}')">
    <div class="div-card-top">
      <div>
        <div class="div-name">${div.name}</div>
        <div class="div-meta">${total} project${total !== 1 ? 's' : ''}</div>
      </div>
      <div class="div-icon" style="--div-color:${div.color}">${div.icon}</div>
    </div>
    <div class="div-stats">
      <div class="div-stat">
        <div class="div-stat-val" style="color:${div.color}">${total}</div>
        <div class="div-stat-lbl">Total</div>
      </div>
      <div class="div-stat">
        <div class="div-stat-val" style="color:var(--success)">${onTrack}</div>
        <div class="div-stat-lbl">On Track</div>
      </div>
      <div class="div-stat">
        <div class="div-stat-val" style="color:var(--accent)">${completed}</div>
        <div class="div-stat-lbl">Done</div>
      </div>
    </div>
    <div class="div-progress-label">
      <span>Overall Progress</span><span>${avgProgress}%</span>
    </div>
    <div class="div-progress-bar">
      <div class="div-progress-fill" style="width:${avgProgress}%; background:${div.color}"></div>
    </div>
    <div class="div-click-hint">↗ Click to view projects</div>
  </div>`;
}




















// ---- DIVISION DETAIL ----
function openDivDetail(divId) {
  const div = DIVISIONS[divId];
  const divProjects = projects.filter(p => p.division === divId);
  const total     = divProjects.length;
  const onTrack   = divProjects.filter(p => p.status === 'on-track').length;
  const delayed   = divProjects.filter(p => p.status === 'delayed').length;
  const critical  = divProjects.filter(p => p.status === 'critical').length;
  const completed = divProjects.filter(p => p.status === 'completed').length;
  const avgProgress = total === 0 ? 0 : Math.round(divProjects.reduce((a, p) => a + (Number(p.progress) || 0), 0) / total);

  document.getElementById('div-detail-panel').style.setProperty('--div-color', div.color);
  document.getElementById('div-detail-title').textContent = div.name;
  document.getElementById('div-detail-sub').textContent = `${div.icon}  ${total} project${total !== 1 ? 's' : ''} in this division`;
  document.getElementById('div-detail-pct').textContent = avgProgress + '%';
  document.getElementById('div-detail-bar').style.width = avgProgress + '%';
  document.getElementById('div-detail-bar').style.background = div.color;

  document.getElementById('div-detail-stats').innerHTML = `
    <div class="div-detail-stat"><div class="div-detail-stat-val" style="color:${div.color}">${total}</div><div class="div-detail-stat-lbl">Total</div></div>
    <div class="div-detail-stat"><div class="div-detail-stat-val" style="color:var(--success)">${onTrack}</div><div class="div-detail-stat-lbl">On Track</div></div>
    <div class="div-detail-stat"><div class="div-detail-stat-val" style="color:var(--warning)">${delayed}</div><div class="div-detail-stat-lbl">Delayed</div></div>
    <div class="div-detail-stat"><div class="div-detail-stat-val" style="color:var(--danger)">${critical}</div><div class="div-detail-stat-lbl">Critical</div></div>
    <div class="div-detail-stat"><div class="div-detail-stat-val" style="color:var(--accent)">${completed}</div><div class="div-detail-stat-lbl">Completed</div></div>
  `;

  const projEl = document.getElementById('div-detail-projects');
  projEl.innerHTML = divProjects.length === 0
    ? `<div class="empty-state" style="padding:30px 0;"><div class="empty-icon">📂</div><div class="empty-text">No projects in this division yet.</div></div>`
    : divProjects.map(p => projectCard(p, false)).join('');

  document.getElementById('div-detail-overlay').classList.add('open');
}
function closeDivDetail() {
  document.getElementById('div-detail-overlay').classList.remove('open');
}

















// ---- DASHBOARD ----
function renderDashboard() {
  const total    = projects.length;
  const onTrack  = projects.filter(p => p.status === 'on-track').length;
  const delayed  = projects.filter(p => p.status === 'delayed').length;
  const critical = projects.filter(p => p.status === 'critical').length;

  document.getElementById('stats-row').innerHTML = `
    <div class="stat-card" style="--accent-color:var(--accent)">
      <div class="stat-label">Total Projects</div>
      <div class="stat-value">${total}</div>
      <div class="stat-change">All time</div>
    </div>
    <div class="stat-card" style="--accent-color:var(--success)">
      <div class="stat-label">On Track</div>
      <div class="stat-value" style="color:var(--success)">${onTrack}</div>
      <div class="stat-change">Running smooth</div>
    </div>
    <div class="stat-card" style="--accent-color:var(--warning)">
      <div class="stat-label">Delayed</div>
      <div class="stat-value" style="color:var(--warning)">${delayed}</div>
      <div class="stat-change">Needs attention</div>
    </div>
    <div class="stat-card" style="--accent-color:var(--danger)">
      <div class="stat-label">Critical</div>
      <div class="stat-value" style="color:var(--danger)">${critical}</div>
      <div class="stat-change">Action required</div>
    </div>`;














  // Division cards on dashboard
  document.getElementById('dashboard-divisions').innerHTML =
    Object.keys(DIVISIONS).map(id => divisionCard(id)).join('');
















  // Recent projects
  const recent = [...projects].slice(-6).reverse();
  const el = document.getElementById('dashboard-projects');
  el.innerHTML = recent.length === 0
    ? `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">No projects yet. Go to Projects to add one!</div></div>`
    : recent.map(p => projectCard(p, false)).join('');
}















// ---- DIVISIONS PAGE ----
function renderDivisions() {
  document.getElementById('divisions-list').innerHTML =
    Object.keys(DIVISIONS).map(id => divisionCard(id)).join('');
}






















// ---- PROJECTS ----
function renderProjects() {
  const el = document.getElementById('projects-list');
  el.innerHTML = projects.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🗂️</div><div class="empty-text">No projects yet. Click "+ New Project" to get started!</div></div>`
    : projects.map(p => projectCard(p)).join('');
}



function openProjectModal() {
  editingProjectId = null;
  document.getElementById('proj-modal-title').textContent = 'New Project';
  ['proj-name','proj-desc','proj-owner'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('proj-progress').value = 0;
  document.getElementById('proj-progress-val').textContent = '0%';
  document.getElementById('proj-due').value = '';
  document.getElementById('proj-status').value = 'on-track';
  document.getElementById('proj-division').value = '';
  document.getElementById('project-modal').classList.add('open');
}



function openEditProject(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;
  editingProjectId = id;
  document.getElementById('proj-modal-title').textContent = 'Edit Project';
  document.getElementById('proj-name').value = p.name || '';
  document.getElementById('proj-desc').value = p.desc || '';
  document.getElementById('proj-status').value = p.status || 'on-track';
  const prog = p.progress || 0;
  document.getElementById('proj-progress').value = prog;
  document.getElementById('proj-progress-val').textContent = prog + '%';
  document.getElementById('proj-owner').value = p.owner || '';
  document.getElementById('proj-due').value = p.due || '';
  document.getElementById('proj-division').value = p.division || '';
  document.getElementById('project-modal').classList.add('open');
}



function closeProjectModal() { document.getElementById('project-modal').classList.remove('open'); }



function saveProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { alert('Project name is required!'); return; }
  const data = {
    name,
    desc: document.getElementById('proj-desc').value.trim(),
    status: document.getElementById('proj-status').value,
    progress: document.getElementById('proj-progress').value,
    owner: document.getElementById('proj-owner').value.trim(),
    due: document.getElementById('proj-due').value,
    division: document.getElementById('proj-division').value,
  };
  if (editingProjectId) {
    const i = projects.findIndex(x => x.id === editingProjectId);
    projects[i] = { ...projects[i], ...data };
  } else {
    projects.push({ id: Date.now().toString(), ...data });
  }
  save(); closeProjectModal(); renderProjects(); renderDashboard();
  showToast('Project saved!');
}



function deleteProject(id) {
  if (!confirm('Delete this project?')) return;
  projects = projects.filter(p => p.id !== id);
  tasks    = tasks.filter(t => t.projectId !== id);
  save(); renderProjects(); renderDashboard();
  showToast('Project deleted.');
}




















// ---- TASKS ----
function renderTasks() {
  const cols = { todo: [], inprog: [], done: [], blocked: [] };
  tasks.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });



  ['todo','inprog','done','blocked'].forEach(status => {
    const el    = document.getElementById('tasks-' + status);
    const items = cols[status];
    document.getElementById(status + '-count').textContent = items.length;
    if (items.length === 0) {
      el.innerHTML = `<div style="color:var(--muted);font-size:12px;text-align:center;padding:20px 0;">No tasks here</div>`;
      return;
    }
    el.innerHTML = items.map(t => {
      const proj = projects.find(p => p.id === t.projectId);
      return `<div class="task-item">
        <div class="task-item-top">
          <div>
            <div class="task-title-text">${t.title}</div>
            <div class="task-proj">📁 ${proj ? proj.name : 'No project'} · 📅 ${fmtDate(t.due)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            <span class="task-priority priority-${t.priority}">${t.priority}</span>
            <div style="display:flex;gap:4px;">
              <button class="icon-btn edit" onclick="openEditTask('${t.id}')">✎</button>
              <button class="icon-btn" onclick="deleteTask('${t.id}')">✕</button>
            </div>
          </div>
        </div>
      </div>`;
    }).join('');
  });
}



function openTaskModal() {
  editingTaskId = null;
  document.getElementById('task-modal-title').textContent = 'New Task';
  document.getElementById('task-title').value = '';
  document.getElementById('task-priority').value = 'medium';
  document.getElementById('task-status').value = 'todo';
  document.getElementById('task-due').value = '';
  populateTaskProjects();
  document.getElementById('task-modal').classList.add('open');
}



function openEditTask(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editingTaskId = id;
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-title').value = t.title || '';
  document.getElementById('task-priority').value = t.priority || 'medium';
  document.getElementById('task-status').value = t.status || 'todo';
  document.getElementById('task-due').value = t.due || '';
  populateTaskProjects(t.projectId);
  document.getElementById('task-modal').classList.add('open');
}



function populateTaskProjects(selectedId) {
  document.getElementById('task-project').innerHTML =
    '<option value="">— No project —</option>' +
    projects.map(p => `<option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>${p.name}</option>`).join('');
}



function closeTaskModal() { document.getElementById('task-modal').classList.remove('open'); }



function saveTask() {
  const title = document.getElementById('task-title').value.trim();
  if (!title) { alert('Task title is required!'); return; }
  const data = {
    title,
    projectId: document.getElementById('task-project').value,
    priority: document.getElementById('task-priority').value,
    status: document.getElementById('task-status').value,
    due: document.getElementById('task-due').value,
  };
  if (editingTaskId) {
    const i = tasks.findIndex(x => x.id === editingTaskId);
    tasks[i] = { ...tasks[i], ...data };
  } else {
    tasks.push({ id: Date.now().toString(), ...data });
  }
  save(); closeTaskModal(); renderTasks();
  showToast('Task saved!');
}



function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save(); renderTasks();
  showToast('Task deleted.');
}












// ---- TOAST ----
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = '✓ ' + msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}












// ---- CLOSE ON OVERLAY CLICK ----
document.getElementById('project-modal').addEventListener('click', function(e) { if (e.target === this) closeProjectModal(); });
document.getElementById('task-modal').addEventListener('click',   function(e) { if (e.target === this) closeTaskModal(); });
document.getElementById('div-detail-overlay').addEventListener('click', function(e) { if (e.target === this) closeDivDetail(); });








// ---- INIT ----
renderDashboard();
