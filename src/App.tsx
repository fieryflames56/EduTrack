// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';

// ─── Initial Data ────────────────────────────────────────────────────────────
const INITIAL_USERS = [
  {
    id: 'admin',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
    department: 'Administration',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't1',
    username: 'adarsh.sudeep',
    password: 'adarsh123',
    role: 'teacher',
    name: 'Adarsh Sudeep',
    department: 'Other',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_TASKS = [
  {
    id: 'task1',
    title: 'Create App',
    description: 'make an app which maintains a checklist for teachers',
    category: 'Administrative',
    dueDate: '2026-06-10',
    priority: 'high',
    createdAt: new Date().toISOString(),
    assignedTo: ['t1'],
  },
];

const INITIAL_COMPLETIONS = {
  t1: { task1: true},
};

const CATEGORIES = [
  'Administrative',
  'Academic',
  'Communication',
  'Training',
  'Other',
];
const PRIORITIES = ['low', 'medium', 'high'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString().split('T')[0];

function priorityColor(p) {
  if (p === 'high') return '#ef4444';
  if (p === 'medium') return '#f59e0b';
  return '#22c55e';
}

function isOverdue(date) {
  return date && date < today();
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [completions, setCompletions] = useState(INITIAL_COMPLETIONS);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('login');
  const [modal, setModal] = useState(null); // { type, data }
  const [toast, setToast] = useState(null);
  const [loginError, setLoginError] = useState('');

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Auth ──
  function handleLogin(username, password) {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
    if (!user) {
      setLoginError('Invalid username or password.');
      return;
    }
    setCurrentUser(user);
    setLoginError('');
    setView(user.role === 'admin' ? 'admin_dashboard' : 'teacher_dashboard');
  }

  function handleLogout() {
    setCurrentUser(null);
    setView('login');
  }

  // ── User Management (Admin) ──
  function createUser(data) {
    if (users.find((u) => u.username === data.username)) {
      showToast('Username already exists', 'error');
      return;
    }
    const newUser = {
      ...data,
      id: uid(),
      role: 'teacher',
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    showToast(`Account created for ${data.name}`);
    setModal(null);
  }

  function deleteUser(id) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setTasks((prev) =>
      prev.map((t) => ({
        ...t,
        assignedTo: t.assignedTo.filter((x) => x !== id),
      }))
    );
    showToast('Account deleted');
    setModal(null);
  }

  function changePassword(userId, newPass) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    if (currentUser?.id === userId)
      setCurrentUser((prev) => ({ ...prev, password: newPass }));
    showToast('Password updated');
    setModal(null);
  }

  // ── Task Management ──
  function createTask(data) {
    const newTask = { ...data, id: uid(), createdAt: new Date().toISOString() };
    setTasks((prev) => [...prev, newTask]);
    showToast('Task created');
    setModal(null);
  }

  function updateTask(id, data) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    showToast('Task updated');
    setModal(null);
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task deleted');
    setModal(null);
  }

  function toggleCompletion(userId, taskId) {
    setCompletions((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [taskId]: !prev[userId]?.[taskId] },
    }));
  }

  const teachers = users.filter((u) => u.role === 'teacher');

  return (
    <div style={styles.app}>
      <style>{globalCSS}</style>
      {toast && <Toast toast={toast} />}
      {modal && (
        <Modal
          modal={modal}
          onClose={() => setModal(null)}
          users={users}
          teachers={teachers}
          tasks={tasks}
          completions={completions}
          onCreate={createUser}
          onDelete={deleteUser}
          onChangePassword={changePassword}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          currentUser={currentUser}
        />
      )}

      {view === 'login' && (
        <LoginScreen onLogin={handleLogin} error={loginError} />
      )}

      {view === 'admin_dashboard' && currentUser?.role === 'admin' && (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          teachers={teachers}
          tasks={tasks}
          completions={completions}
          onLogout={handleLogout}
          onModal={setModal}
        />
      )}

      {view === 'teacher_dashboard' && currentUser?.role === 'teacher' && (
        <TeacherDashboard
          currentUser={currentUser}
          tasks={tasks.filter((t) => t.assignedTo.includes(currentUser.id))}
          completions={completions[currentUser.id] || {}}
          onToggle={(taskId) => toggleCompletion(currentUser.id, taskId)}
          onLogout={handleLogout}
          onModal={setModal}
        />
      )}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginCard}>
        <div style={styles.loginLogoWrap}>
          <div style={styles.loginLogo}>🏫</div>
          <div style={styles.loginSchool}>EduTrack</div>
          <div style={styles.loginSubtitle}>School Task Management System</div>
        </div>

        <div style={styles.loginForm}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              onKeyDown={(e) =>
                e.key === 'Enter' && onLogin(username, password)
              }
            />
          </div>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                style={styles.input}
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) =>
                  e.key === 'Enter' && onLogin(username, password)
                }
              />
              <button
                style={styles.eyeBtn}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div style={styles.errorMsg}>{error}</div>}
          <button
            style={styles.btnPrimary}
            onClick={() => onLogin(username, password)}
          >
            Sign In →
          </button>
          <div style={styles.loginHint}>
            <span>
              Demo — Admin: <b>admin / admin123</b> &nbsp;|&nbsp; Teacher:{' '}
              <b>adarsh.sudeep / adarsh123</b>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({
  currentUser,
  users,
  teachers,
  tasks,
  completions,
  onLogout,
  onModal,
}) {
  const [tab, setTab] = useState('overview');

  const totalDone = teachers.reduce((sum, t) => {
    const assigned = tasks.filter((tk) => tk.assignedTo.includes(t.id));
    return sum + assigned.filter((tk) => completions[t.id]?.[tk.id]).length;
  }, 0);
  const totalAssigned = teachers.reduce(
    (sum, t) => sum + tasks.filter((tk) => tk.assignedTo.includes(t.id)).length,
    0
  );

  return (
    <div style={styles.shell}>
      <Sidebar
        role="admin"
        currentUser={currentUser}
        tab={tab}
        setTab={setTab}
        onLogout={onLogout}
        onModal={onModal}
      />
      <main style={styles.main}>
        <Header
          title={
            tab === 'overview'
              ? 'Dashboard Overview'
              : tab === 'teachers'
              ? 'Teacher Accounts'
              : tab === 'tasks'
              ? 'Task Management'
              : 'Reports'
          }
          user={currentUser}
        />

        {tab === 'overview' && (
          <div className="fade-in">
            <div style={styles.statsRow}>
              <StatCard
                icon="👨‍🏫"
                label="Teachers"
                value={teachers.length}
                color="#6366f1"
              />
              <StatCard
                icon="📋"
                label="Total Tasks"
                value={tasks.length}
                color="#0ea5e9"
              />
              <StatCard
                icon="✅"
                label="Completed"
                value={totalDone}
                color="#22c55e"
              />
              <StatCard
                icon="📊"
                label="Completion Rate"
                value={
                  totalAssigned
                    ? `${Math.round((totalDone / totalAssigned) * 100)}%`
                    : '0%'
                }
                color="#f59e0b"
              />
            </div>
            <div style={styles.twoCol}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Teacher Progress</h3>
                {teachers.map((t) => {
                  const assigned = tasks.filter((tk) =>
                    tk.assignedTo.includes(t.id)
                  );
                  const done = assigned.filter(
                    (tk) => completions[t.id]?.[tk.id]
                  ).length;
                  const pct = assigned.length
                    ? Math.round((done / assigned.length) * 100)
                    : 0;
                  return (
                    <div key={t.id} style={styles.progressRow}>
                      <div style={styles.progressMeta}>
                        <span style={styles.avatar}>{t.name[0]}</span>
                        <div>
                          <div style={styles.progressName}>{t.name}</div>
                          <div style={styles.progressDept}>{t.department}</div>
                        </div>
                      </div>
                      <div style={styles.progressBarWrap}>
                        <div style={styles.progressBarBg}>
                          <div
                            style={{
                              ...styles.progressBarFill,
                              width: `${pct}%`,
                            }}
                          />
                        </div>
                        <span style={styles.progressPct}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
                {teachers.length === 0 && (
                  <div style={styles.empty}>No teachers yet.</div>
                )}
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Recent Tasks</h3>
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} style={styles.miniTaskRow}>
                    <div
                      style={{
                        ...styles.priorityDot,
                        background: priorityColor(task.priority),
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={styles.miniTaskTitle}>{task.title}</div>
                      <div style={styles.miniTaskMeta}>
                        {task.category} · Due {task.dueDate}
                      </div>
                    </div>
                    {isOverdue(task.dueDate) && (
                      <span style={styles.overdueBadge}>Overdue</span>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div style={styles.empty}>No tasks yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'teachers' && (
          <div className="fade-in">
            <div style={styles.actionBar}>
              <span style={styles.resultCount}>
                {teachers.length} teacher{teachers.length !== 1 ? 's' : ''}
              </span>
              <button
                style={styles.btnPrimary}
                onClick={() => onModal({ type: 'create_user' })}
              >
                + Add Teacher
              </button>
            </div>
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {[
                      'Name',
                      'Username',
                      'Department',
                      'Tasks Assigned',
                      'Progress',
                      'Actions',
                    ].map((h) => (
                      <th key={h} style={styles.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => {
                    const assigned = tasks.filter((tk) =>
                      tk.assignedTo.includes(t.id)
                    );
                    const done = assigned.filter(
                      (tk) => completions[t.id]?.[tk.id]
                    ).length;
                    const pct = assigned.length
                      ? Math.round((done / assigned.length) * 100)
                      : 0;
                    return (
                      <tr key={t.id} style={styles.tr} className="table-row">
                        <td style={styles.td}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                            }}
                          >
                            <span style={styles.avatar}>{t.name[0]}</span>
                            {t.name}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <code style={styles.code}>{t.username}</code>
                        </td>
                        <td style={styles.td}>{t.department}</td>
                        <td style={styles.td}>{assigned.length}</td>
                        <td style={styles.td}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <div style={{ ...styles.progressBarBg, width: 80 }}>
                              <div
                                style={{
                                  ...styles.progressBarFill,
                                  width: `${pct}%`,
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              style={styles.btnSm}
                              onClick={() =>
                                onModal({ type: 'change_password', data: t })
                              }
                            >
                              🔑 Password
                            </button>
                            <button
                              style={{ ...styles.btnSm, ...styles.btnDanger }}
                              onClick={() =>
                                onModal({
                                  type: 'confirm_delete_user',
                                  data: t,
                                })
                              }
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {teachers.length === 0 && (
                <div style={styles.empty}>No teachers yet. Add one above.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'tasks' && (
          <div className="fade-in">
            <div style={styles.actionBar}>
              <span style={styles.resultCount}>
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
              <button
                style={styles.btnPrimary}
                onClick={() => onModal({ type: 'create_task' })}
              >
                + New Task
              </button>
            </div>
            <div style={styles.taskGrid}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  teachers={teachers.filter((t) =>
                    task.assignedTo.includes(t.id)
                  )}
                  completions={completions}
                  isAdmin
                  onEdit={() => onModal({ type: 'edit_task', data: task })}
                  onDelete={() =>
                    onModal({ type: 'confirm_delete_task', data: task })
                  }
                />
              ))}
              {tasks.length === 0 && (
                <div style={styles.empty}>No tasks yet.</div>
              )}
            </div>
          </div>
        )}

        {tab === 'reports' && (
          <div className="fade-in">
            <ReportsView
              teachers={teachers}
              tasks={tasks}
              completions={completions}
            />
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Teacher Dashboard ────────────────────────────────────────────────────────
function TeacherDashboard({
  currentUser,
  tasks,
  completions,
  onToggle,
  onLogout,
  onModal,
}) {
  const done = tasks.filter((t) => completions[t.id]).length;
  const pending = tasks.filter(
    (t) => !completions[t.id] && !isOverdue(t.dueDate)
  ).length;
  const overdue = tasks.filter(
    (t) => !completions[t.id] && isOverdue(t.dueDate)
  ).length;
  const [filter, setFilter] = useState('all');

  const filtered = tasks.filter((t) => {
    if (filter === 'pending')
      return !completions[t.id] && !isOverdue(t.dueDate);
    if (filter === 'done') return completions[t.id];
    if (filter === 'overdue') return !completions[t.id] && isOverdue(t.dueDate);
    return true;
  });

  return (
    <div style={styles.shell}>
      <Sidebar
        role="teacher"
        currentUser={currentUser}
        tab="tasks"
        setTab={() => {}}
        onLogout={onLogout}
        onModal={onModal}
      />
      <main style={styles.main}>
        <Header
          title={`Welcome, ${currentUser.name.split(' ')[0]}!`}
          user={currentUser}
        />
        <div style={styles.statsRow}>
          <StatCard
            icon="📋"
            label="Total Tasks"
            value={tasks.length}
            color="#6366f1"
          />
          <StatCard icon="⏳" label="Pending" value={pending} color="#0ea5e9" />
          <StatCard icon="✅" label="Completed" value={done} color="#22c55e" />
          <StatCard icon="🔴" label="Overdue" value={overdue} color="#ef4444" />
        </div>

        <div style={styles.card}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3 style={styles.cardTitle}>My Tasks</h3>
            <div style={styles.filterTabs}>
              {['all', 'pending', 'done', 'overdue'].map((f) => (
                <button
                  key={f}
                  style={{
                    ...styles.filterTab,
                    ...(filter === f ? styles.filterTabActive : {}),
                  }}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 && (
            <div style={styles.empty}>No tasks in this category.</div>
          )}
          {filtered.map((task) => (
            <TeacherTaskRow
              key={task.id}
              task={task}
              done={!!completions[task.id]}
              onToggle={() => onToggle(task.id)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Sidebar({ role, currentUser, tab, setTab, onLogout, onModal }) {
  const adminLinks = [
    { id: 'overview', icon: '🏠', label: 'Overview' },
    { id: 'teachers', icon: '👨‍🏫', label: 'Teachers' },
    { id: 'tasks', icon: '📋', label: 'Tasks' },
    { id: 'reports', icon: '📊', label: 'Reports' },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.sidebarLogo}>
        <span style={{ fontSize: 28 }}>🏫</span>
        <div>
          <div style={styles.sidebarAppName}>EduTrack</div>
          <div style={styles.sidebarRole}>
            {role === 'admin' ? 'Admin Panel' : 'Teacher Portal'}
          </div>
        </div>
      </div>

      <nav style={styles.nav}>
        {role === 'admin' &&
          adminLinks.map((link) => (
            <button
              key={link.id}
              style={{
                ...styles.navBtn,
                ...(tab === link.id ? styles.navBtnActive : {}),
              }}
              onClick={() => setTab(link.id)}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
        {role === 'teacher' && (
          <button style={{ ...styles.navBtn, ...styles.navBtnActive }}>
            <span>📋</span>
            <span>My Tasks</span>
          </button>
        )}
      </nav>

      <div style={styles.sidebarBottom}>
        <button
          style={styles.navBtn}
          onClick={() =>
            onModal({ type: 'change_password', data: currentUser })
          }
        >
          <span>🔑</span>
          <span>Change Password</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...styles.navBtnLogout }}
          onClick={onLogout}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function Header({ title, user }) {
  return (
    <div style={styles.header}>
      <h1 style={styles.pageTitle}>{title}</h1>
      <div style={styles.headerUser}>
        <span style={styles.avatar}>{user.name[0]}</span>
        <div>
          <div style={styles.headerName}>{user.name}</div>
          <div style={styles.headerRole}>
            {user.role === 'admin' ? 'Administrator' : user.department}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ ...styles.statIcon, color }}>{icon}</div>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function TaskCard({ task, teachers, completions, isAdmin, onEdit, onDelete }) {
  const done = teachers.filter((t) => completions[t.id]?.[task.id]).length;
  const pct = teachers.length ? Math.round((done / teachers.length) * 100) : 0;

  return (
    <div style={styles.taskCard} className="task-card">
      <div style={styles.taskCardHeader}>
        <span
          style={{
            ...styles.priorityBadge,
            background: priorityColor(task.priority) + '22',
            color: priorityColor(task.priority),
          }}
        >
          {task.priority}
        </span>
        <span style={styles.categoryBadge}>{task.category}</span>
        {isOverdue(task.dueDate) && (
          <span style={styles.overdueBadge}>Overdue</span>
        )}
      </div>
      <h4 style={styles.taskCardTitle}>{task.title}</h4>
      <p style={styles.taskCardDesc}>{task.description}</p>
      <div style={styles.taskCardMeta}>
        <span>📅 {task.dueDate}</span>
        <span>👥 {teachers.length} assigned</span>
      </div>
      {isAdmin && teachers.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Completion</span>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>
              {done}/{teachers.length}
            </span>
          </div>
          <div style={styles.progressBarBg}>
            <div style={{ ...styles.progressBarFill, width: `${pct}%` }} />
          </div>
        </div>
      )}
      {isAdmin && (
        <div style={styles.taskCardActions}>
          <button style={styles.btnSm} onClick={onEdit}>
            ✏️ Edit
          </button>
          <button
            style={{ ...styles.btnSm, ...styles.btnDanger }}
            onClick={onDelete}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TeacherTaskRow({ task, done, onToggle }) {
  return (
    <div
      style={{
        ...styles.teacherTaskRow,
        ...(done ? styles.teacherTaskRowDone : {}),
      }}
      className="teacher-task-row"
      onClick={onToggle}
    >
      <div style={{ ...styles.checkbox, ...(done ? styles.checkboxDone : {}) }}>
        {done && '✓'}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            ...styles.taskTitle,
            ...(done
              ? { textDecoration: 'line-through', color: '#64748b' }
              : {}),
          }}
        >
          {task.title}
        </div>
        <div style={styles.taskMeta}>
          <span
            style={{
              ...styles.priorityBadge,
              background: priorityColor(task.priority) + '22',
              color: priorityColor(task.priority),
            }}
          >
            {task.priority}
          </span>
          <span style={styles.categoryBadge}>{task.category}</span>
          <span
            style={{
              color: isOverdue(task.dueDate) && !done ? '#ef4444' : '#94a3b8',
            }}
          >
            📅 {task.dueDate}
          </span>
        </div>
        <div style={styles.taskDesc}>{task.description}</div>
      </div>
    </div>
  );
}

function ReportsView({ teachers, tasks, completions }) {
  return (
    <div>
      <div style={styles.tableWrap}>
        <h3 style={{ ...styles.cardTitle, marginBottom: 16 }}>
          Full Report — All Teachers
        </h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Teacher</th>
              <th style={styles.th}>Department</th>
              {tasks.map((t) => (
                <th
                  key={t.id}
                  style={{ ...styles.th, maxWidth: 120, fontSize: 11 }}
                >
                  {t.title}
                </th>
              ))}
              <th style={styles.th}>Progress</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const assigned = tasks.filter((tk) =>
                tk.assignedTo.includes(t.id)
              );
              const done = assigned.filter(
                (tk) => completions[t.id]?.[tk.id]
              ).length;
              const pct = assigned.length
                ? Math.round((done / assigned.length) * 100)
                : 0;
              return (
                <tr key={t.id} style={styles.tr} className="table-row">
                  <td style={styles.td}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span style={styles.avatar}>{t.name[0]}</span>
                      {t.name}
                    </div>
                  </td>
                  <td style={styles.td}>{t.department}</td>
                  {tasks.map((tk) => {
                    const isAssigned = tk.assignedTo.includes(t.id);
                    const isDone = completions[t.id]?.[tk.id];
                    return (
                      <td
                        key={tk.id}
                        style={{ ...styles.td, textAlign: 'center' }}
                      >
                        {!isAssigned ? (
                          <span style={{ color: '#334155', fontSize: 16 }}>
                            —
                          </span>
                        ) : isDone ? (
                          <span style={{ color: '#22c55e', fontSize: 18 }}>
                            ✅
                          </span>
                        ) : isOverdue(tk.dueDate) ? (
                          <span style={{ color: '#ef4444', fontSize: 18 }}>
                            ⚠️
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontSize: 18 }}>
                            ⏳
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td style={styles.td}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div style={{ ...styles.progressBarBg, width: 80 }}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <b style={{ fontSize: 12 }}>{pct}%</b>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {teachers.length === 0 && (
          <div style={styles.empty}>No teachers to report on.</div>
        )}
      </div>
    </div>
  );
}

// ─── Modal System ─────────────────────────────────────────────────────────────
function Modal({
  modal,
  onClose,
  users,
  teachers,
  tasks,
  completions,
  onCreate,
  onDelete,
  onChangePassword,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  currentUser,
}) {
  const { type, data } = modal;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <button style={styles.modalClose} onClick={onClose}>
          ✕
        </button>

        {type === 'create_user' && (
          <CreateUserForm onCreate={onCreate} onClose={onClose} />
        )}
        {type === 'confirm_delete_user' && (
          <ConfirmDialog
            title="Delete Account"
            message={`Are you sure you want to delete ${data.name}'s account? This cannot be undone.`}
            confirmLabel="Delete"
            danger
            onConfirm={() => onDelete(data.id)}
            onCancel={onClose}
          />
        )}
        {type === 'change_password' && (
          <ChangePasswordForm
            user={data}
            onSave={onChangePassword}
            onClose={onClose}
            currentUser={currentUser}
          />
        )}
        {type === 'create_task' && (
          <TaskForm
            teachers={teachers}
            onSave={onCreateTask}
            onClose={onClose}
          />
        )}
        {type === 'edit_task' && (
          <TaskForm
            task={data}
            teachers={teachers}
            onSave={(d) => onUpdateTask(data.id, d)}
            onClose={onClose}
          />
        )}
        {type === 'confirm_delete_task' && (
          <ConfirmDialog
            title="Delete Task"
            message={`Delete "${data.title}"? This cannot be undone.`}
            confirmLabel="Delete"
            danger
            onConfirm={() => onDeleteTask(data.id)}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
}

function CreateUserForm({ onCreate, onClose }) {
  const [form, setForm] = useState({
    name: '',
    username: '',
    password: '',
    department: '',
  });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <h2 style={styles.modalTitle}>➕ Add Teacher Account</h2>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Full Name</label>
        <input
          style={styles.input}
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Jane Smith"
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Username</label>
        <input
          style={styles.input}
          value={form.username}
          onChange={set('username')}
          placeholder="e.g. jane.smith"
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={form.password}
          onChange={set('password')}
          placeholder="Minimum 6 characters"
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Department</label>
        <input
          style={styles.input}
          value={form.department}
          onChange={set('department')}
          placeholder="e.g. Mathematics"
        />
      </div>
      <div style={styles.modalActions}>
        <button style={styles.btnOutline} onClick={onClose}>
          Cancel
        </button>
        <button
          style={styles.btnPrimary}
          onClick={() => {
            if (!form.name || !form.username || !form.password) return;
            if (form.password.length < 6) return;
            onCreate(form);
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

function ChangePasswordForm({ user, onSave, onClose, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  function handleSave() {
    if (!isAdmin && current !== user.password) {
      setError('Current password is incorrect.');
      return;
    }
    if (newPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPass !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    onSave(user.id, newPass);
  }

  return (
    <div>
      <h2 style={styles.modalTitle}>🔑 Change Password</h2>
      <p style={{ color: '#94a3b8', marginBottom: 20 }}>
        Updating password for <b style={{ color: '#e2e8f0' }}>{user.name}</b>
      </p>
      {!isAdmin && (
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Current Password</label>
          <input
            style={styles.input}
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      )}
      <div style={styles.fieldGroup}>
        <label style={styles.label}>New Password</label>
        <input
          style={styles.input}
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
        />
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Confirm New Password</label>
        <input
          style={styles.input}
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <div style={styles.errorMsg}>{error}</div>}
      <div style={styles.modalActions}>
        <button style={styles.btnOutline} onClick={onClose}>
          Cancel
        </button>
        <button style={styles.btnPrimary} onClick={handleSave}>
          Update Password
        </button>
      </div>
    </div>
  );
}

function TaskForm({ task, teachers, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'Administrative',
    dueDate: task?.dueDate || '',
    priority: task?.priority || 'medium',
    assignedTo: task?.assignedTo || [],
  });
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  function toggleTeacher(id) {
    setForm((p) => ({
      ...p,
      assignedTo: p.assignedTo.includes(id)
        ? p.assignedTo.filter((x) => x !== id)
        : [...p.assignedTo, id],
    }));
  }

  return (
    <div>
      <h2 style={styles.modalTitle}>{task ? '✏️ Edit Task' : '📋 New Task'}</h2>
      <div style={styles.twoColForm}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Task Title</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={set('title')}
            placeholder="Task name"
          />
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Due Date</label>
          <input
            style={styles.input}
            type="date"
            value={form.dueDate}
            onChange={set('dueDate')}
          />
        </div>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Description</label>
        <textarea
          style={{ ...styles.input, height: 80, resize: 'vertical' }}
          value={form.description}
          onChange={set('description')}
          placeholder="Task description..."
        />
      </div>
      <div style={styles.twoColForm}>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            value={form.category}
            onChange={set('category')}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={styles.fieldGroup}>
          <label style={styles.label}>Priority</label>
          <select
            style={styles.input}
            value={form.priority}
            onChange={set('priority')}
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Assign To Teachers</label>
        <div style={styles.teacherCheckboxes}>
          {teachers.map((t) => (
            <label key={t.id} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={form.assignedTo.includes(t.id)}
                onChange={() => toggleTeacher(t.id)}
                style={{ accentColor: '#6366f1' }}
              />
              <span style={styles.avatar}>{t.name[0]}</span>
              {t.name}
            </label>
          ))}
          {teachers.length === 0 && (
            <span style={{ color: '#64748b', fontSize: 13 }}>
              No teachers yet.
            </span>
          )}
        </div>
      </div>
      <div style={styles.modalActions}>
        <button style={styles.btnOutline} onClick={onClose}>
          Cancel
        </button>
        <button
          style={styles.btnPrimary}
          onClick={() => {
            if (form.title && form.dueDate) onSave(form);
          }}
        >
          {task ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>
        {danger ? '⚠️' : '❓'}
      </div>
      <h2 style={styles.modalTitle}>{title}</h2>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>{message}</p>
      <div style={styles.modalActions}>
        <button style={styles.btnOutline} onClick={onCancel}>
          Cancel
        </button>
        <button
          style={
            danger
              ? { ...styles.btnPrimary, background: '#ef4444' }
              : styles.btnPrimary
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function Toast({ toast }) {
  return (
    <div
      style={{
        ...styles.toast,
        background: toast.type === 'error' ? '#ef4444' : '#22c55e',
      }}
    >
      {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  app: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: "'DM Sans', sans-serif",
  },

  // Login
  loginWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background:
      'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  },
  loginCard: {
    background: '#1e293b',
    borderRadius: 20,
    padding: '48px 40px',
    width: 420,
    boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.2)',
  },
  loginLogoWrap: { textAlign: 'center', marginBottom: 36 },
  loginLogo: { fontSize: 56, marginBottom: 8 },
  loginSchool: {
    fontSize: 28,
    fontWeight: 800,
    color: '#e2e8f0',
    letterSpacing: -0.5,
  },
  loginSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  loginForm: { display: 'flex', flexDirection: 'column', gap: 16 },
  loginHint: {
    textAlign: 'center',
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },

  // Shell
  shell: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 240,
    background: '#0f172a',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 8px 24px',
    borderBottom: '1px solid #1e293b',
    marginBottom: 16,
  },
  sidebarAppName: { fontSize: 18, fontWeight: 800, color: '#e2e8f0' },
  sidebarRole: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  navBtnActive: { background: '#6366f122', color: '#818cf8' },
  navBtnLogout: { color: '#ef4444' },
  sidebarBottom: {
    borderTop: '1px solid #1e293b',
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },

  // Main
  main: { flex: 1, padding: '32px 36px', overflow: 'auto' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingBottom: 20,
    borderBottom: '1px solid #1e293b',
  },
  pageTitle: { fontSize: 26, fontWeight: 800, color: '#e2e8f0', margin: 0 },
  headerUser: { display: 'flex', alignItems: 'center', gap: 10 },
  headerName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  headerRole: { fontSize: 12, color: '#64748b' },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#1e293b',
    borderRadius: 14,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 32, fontWeight: 800, color: '#e2e8f0' },
  statLabel: { fontSize: 12, color: '#64748b' },

  // Cards
  card: {
    background: '#1e293b',
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#e2e8f0',
    margin: '0 0 16px',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },

  // Progress
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
    paddingBottom: 14,
    borderBottom: '1px solid #0f172a',
  },
  progressMeta: { display: 'flex', alignItems: 'center', gap: 10, width: 180 },
  progressName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  progressDept: { fontSize: 11, color: '#64748b' },
  progressBarWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
  progressBarBg: {
    flex: 1,
    height: 6,
    background: '#0f172a',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1, #818cf8)',
    borderRadius: 999,
    transition: 'width 0.4s ease',
  },
  progressPct: {
    fontSize: 12,
    color: '#94a3b8',
    width: 32,
    textAlign: 'right',
  },

  // Table
  tableWrap: { background: '#1e293b', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    background: '#0f172a',
    borderBottom: '1px solid #1e293b',
  },
  tr: { borderBottom: '1px solid #1e293b' },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    color: '#cbd5e1',
    verticalAlign: 'middle',
  },

  // Task card
  taskGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  taskCard: {
    background: '#1e293b',
    borderRadius: 14,
    padding: 20,
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  taskCardHeader: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  taskCardTitle: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', margin: 0 },
  taskCardDesc: { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 },
  taskCardMeta: { display: 'flex', gap: 12, fontSize: 12, color: '#475569' },
  taskCardActions: { display: 'flex', gap: 8, marginTop: 4 },

  // Teacher tasks
  teacherTaskRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '16px 0',
    borderBottom: '1px solid #1e293b',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  teacherTaskRowDone: { opacity: 0.6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: '2px solid #334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#22c55e',
    fontWeight: 700,
    fontSize: 13,
    transition: 'all 0.15s',
    marginTop: 2,
  },
  checkboxDone: { background: '#22c55e22', borderColor: '#22c55e' },
  taskTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: 4,
  },
  taskMeta: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  taskDesc: { fontSize: 12, color: '#64748b' },

  // Badges
  priorityBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 999,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: 999,
    background: '#6366f122',
    color: '#818cf8',
  },
  overdueBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 999,
    background: '#ef444422',
    color: '#ef4444',
  },

  // Misc
  actionBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultCount: { fontSize: 13, color: '#64748b' },
  miniTaskRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid #0f172a',
  },
  miniTaskTitle: { fontSize: 13, fontWeight: 600, color: '#e2e8f0' },
  miniTaskMeta: { fontSize: 11, color: '#64748b' },
  priorityDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 800,
    color: 'white',
    flexShrink: 0,
  },
  code: {
    background: '#0f172a',
    padding: '2px 8px',
    borderRadius: 6,
    fontSize: 12,
    color: '#818cf8',
    fontFamily: 'monospace',
  },
  empty: {
    textAlign: 'center',
    color: '#475569',
    padding: '32px 0',
    fontSize: 14,
  },

  // Filters
  filterTabs: {
    display: 'flex',
    gap: 4,
    background: '#0f172a',
    borderRadius: 10,
    padding: 4,
  },
  filterTab: {
    padding: '6px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.15s',
  },
  filterTabActive: { background: '#6366f1', color: 'white' },

  // Buttons
  btnPrimary: {
    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  btnOutline: {
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 10,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnSm: {
    background: '#1e293b',
    color: '#94a3b8',
    border: '1px solid #334155',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDanger: { color: '#ef4444', borderColor: '#ef444444' },

  // Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalBox: {
    background: '#1e293b',
    borderRadius: 20,
    padding: 36,
    width: 'min(520px, 95vw)',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: '#0f172a',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    borderRadius: 8,
    width: 32,
    height: 32,
    fontSize: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#e2e8f0',
    margin: '0 0 20px',
  },
  modalActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 24,
  },

  // Forms
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 10,
    color: '#e2e8f0',
    padding: '10px 14px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  twoColForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  teacherCheckboxes: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: '#0f172a',
    borderRadius: 10,
    padding: 12,
    maxHeight: 160,
    overflowY: 'auto',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    fontSize: 14,
    color: '#e2e8f0',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 16,
  },

  // Toast
  toast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    color: 'white',
    padding: '12px 20px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    zIndex: 2000,
    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.2s ease',
  },
  errorMsg: {
    background: '#ef444422',
    color: '#ef4444',
    border: '1px solid #ef444444',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 13,
  },
};

const globalCSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; }
  .fade-in { animation: fadeIn 0.3s ease; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .table-row:hover { background: #1a2744 !important; }
  .task-card:hover { border-color: #6366f1 !important; transform: translateY(-2px); transition: all 0.15s; }
  .teacher-task-row:hover { background: #1a2744; padding-left: 8px; transition: all 0.15s; border-radius: 10px; }
  input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; outline: none; box-shadow: 0 0 0 2px #6366f122; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
`;
