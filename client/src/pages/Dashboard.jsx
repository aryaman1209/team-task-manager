import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const priorityClass = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent' };
const statusClass = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };

function isOverdue(dueDate) {
  return dueDate && new Date(dueDate) < new Date() && true;
}

function TaskRow({ task }) {
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const overdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className="task-row">
      <div className="task-row-left">
        <span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span>
        <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
        <span className="task-row-title">{task.title}</span>
      </div>
      <div className="task-row-right">
        {task.project && (
          <Link to={`/projects/${task.project.id}`} className="task-project-link">{task.project.name}</Link>
        )}
        {due && <span className={`task-due ${overdue ? 'overdue' : ''}`}>{overdue ? '⚠ ' : ''}{due}</span>}
        {task.assignee && <span className="task-assignee">{task.assignee.name}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-center"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
  );

  const { stats, recentProjects, myTasks, recentTasks, overdueTasks } = data || {};
  const total = stats?.totalTasks || 0;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{stats?.totalProjects ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card accent-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{stats?.statusCounts?.IN_PROGRESS ?? 0}</div>
        </div>
        <div className="stat-card danger-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{stats?.overdueCount ?? 0}</div>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="card progress-card">
          <div className="progress-header">
            <span className="progress-label">Overall Completion</span>
            <span className="progress-pct">{Math.round(((stats?.statusCounts?.DONE || 0) / total) * 100)}%</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-inner" style={{ width: `${((stats?.statusCounts?.DONE || 0) / total) * 100}%` }} />
          </div>
          <div className="progress-legend">
            {Object.entries(statusLabel).map(([k, v]) => (
              <div key={k} className="legend-item">
                <span className={`badge ${statusClass[k]}`}>{v}</span>
                <span>{stats?.statusCounts?.[k] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dash-grid">
        {/* My Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">My Tasks</h3>
            <span className="card-count">{myTasks?.length ?? 0}</span>
          </div>
          {myTasks?.length === 0 ? (
            <div className="empty-state"><p>No tasks assigned to you</p></div>
          ) : (
            <div className="task-list">
              {myTasks?.slice(0, 6).map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>

        {/* Overdue */}
        {overdueTasks?.length > 0 && (
          <div className="card overdue-card">
            <div className="card-header">
              <h3 className="card-title">⚠ Overdue Tasks</h3>
              <span className="card-count danger">{overdueTasks.length}</span>
            </div>
            <div className="task-list">
              {overdueTasks.slice(0, 5).map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Projects</h3>
            <Link to="/projects" className="card-link">View all →</Link>
          </div>
          {recentProjects?.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet</p>
              <Link to="/projects" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Create Project</Link>
            </div>
          ) : (
            <div className="project-list">
              {recentProjects?.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} className="project-row">
                  <div className="project-row-name">{p.name}</div>
                  <div className="project-row-meta">
                    <span>{p._count?.tasks ?? 0} tasks</span>
                    <span>{p._count?.members ?? 0} members</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tasks</h3>
          </div>
          {recentTasks?.length === 0 ? (
            <div className="empty-state"><p>No tasks yet</p></div>
          ) : (
            <div className="task-list">
              {recentTasks?.slice(0, 8).map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
