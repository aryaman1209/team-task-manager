import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, tasksApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import TaskModal, { AddMemberModal } from '../components/Modal';
import './ProjectDetail.css';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
const PRIORITY_CLASS = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent' };
const STATUS_CLASS = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', IN_REVIEW: 'badge-inreview', DONE: 'badge-done' };

function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
  const overdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={`task-card ${task.status === 'DONE' ? 'task-done' : ''}`}>
      <div className="task-card-header">
        <span className={`badge ${PRIORITY_CLASS[task.priority]}`}>{task.priority}</span>
        <div className="task-card-actions">
          <button className="icon-btn" onClick={() => onEdit(task)} title="Edit">✎</button>
          <button className="icon-btn danger" onClick={() => onDelete(task)} title="Delete">✕</button>
        </div>
      </div>

      <h4 className="task-card-title">{task.title}</h4>
      {task.description && <p className="task-card-desc">{task.description}</p>}

      <div className="task-card-footer">
        <div className="task-card-meta">
          {due && <span className={`task-due-small ${overdue ? 'overdue' : ''}`}>{overdue ? '⚠ ' : '📅 '}{due}</span>}
          {task.assignee && (
            <div className="task-assignee-pill">
              <span className="assignee-dot">{task.assignee.name[0]}</span>
              <span>{task.assignee.name}</span>
            </div>
          )}
        </div>
        <select
          className="status-select"
          value={task.status}
          onChange={e => onStatusChange(task, e.target.value)}
        >
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
    </div>
  );
}

function Column({ status, tasks, onEdit, onDelete, onStatusChange, onAdd }) {
  return (
    <div className="column">
      <div className="column-header">
        <div className="column-title-wrap">
          <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABELS[status]}</span>
          <span className="column-count">{tasks.length}</span>
        </div>
        <button className="add-task-btn" onClick={onAdd}>+</button>
      </div>
      <div className="column-body">
        {tasks.length === 0 ? (
          <div className="column-empty">No tasks</div>
        ) : (
          tasks.map(t => (
            <TaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task (edit)
  const [memberModal, setMemberModal] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [activeTab, setActiveTab] = useState('board'); // 'board' | 'members'

  const loadProject = () => projectsApi.get(id).then(setProject).catch(() => navigate('/projects'));

  useEffect(() => {
    loadProject().finally(() => setLoading(false));
  }, [id]);

  const isProjectAdmin = project && (
    user.role === 'ADMIN' ||
    project.ownerId === user.id ||
    project.members?.find(m => m.userId === user.id)?.role === 'ADMIN'
  );

  const handleTaskSaved = (saved) => {
    setProject(prev => {
      const tasks = prev.tasks || [];
      const idx = tasks.findIndex(t => t.id === saved.id);
      if (idx >= 0) {
        const next = [...tasks];
        next[idx] = saved;
        return { ...prev, tasks: next };
      }
      return { ...prev, tasks: [saved, ...tasks] };
    });
    setTaskModal(null);
  };

  const handleTaskDelete = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await tasksApi.delete(task.id);
      setProject(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== task.id) }));
    } catch (err) { alert(err.message); }
  };

  const handleStatusChange = async (task, status) => {
    try {
      const updated = await tasksApi.update(task.id, { status });
      setProject(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === task.id ? updated : t),
      }));
    } catch (err) { alert(err.message); }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectsApi.removeMember(id, userId);
      setProject(prev => ({
        ...prev,
        members: prev.members.filter(m => m.userId !== userId),
      }));
    } catch (err) { alert(err.message); }
  };

  const handleMemberAdded = (member) => {
    setProject(prev => ({ ...prev, members: [...(prev.members || []), member] }));
    setMemberModal(false);
  };

  if (loading) return <div className="loading-center"><div className="spinner" style={{ width: 28, height: 28 }} /></div>;
  if (!project) return null;

  // Filter tasks
  const filteredTasks = (project.tasks || []).filter(t => {
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filteredTasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div className="animate-in project-detail">
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <a href="/projects" onClick={e => { e.preventDefault(); navigate('/projects'); }}>Projects</a>
            <span>›</span>
            <span>{project.name}</span>
          </div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isProjectAdmin && (
            <>
              <button className="btn btn-ghost" onClick={() => setMemberModal(true)}>+ Member</button>
              <button className="btn btn-primary" onClick={() => setTaskModal('create')}>+ Task</button>
            </>
          )}
          {!isProjectAdmin && (
            <button className="btn btn-primary" onClick={() => setTaskModal('create')}>+ Task</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'board' ? 'active' : ''}`} onClick={() => setActiveTab('board')}>Board</button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
          Members <span className="tab-count">{project.members?.length ?? 0}</span>
        </button>
      </div>

      {activeTab === 'board' && (
        <>
          {/* Filters */}
          <div className="filters">
            <select className="input filter-select" value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
              <option value="">All members</option>
              {project.members?.map(m => (
                <option key={m.id} value={m.user?.id}>{m.user?.name}</option>
              ))}
            </select>
            <select className="input filter-select" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All priorities</option>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p}>{p}</option>)}
            </select>
            {(filterAssignee || filterPriority) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setFilterAssignee(''); setFilterPriority(''); }}>
                Clear filters
              </button>
            )}
          </div>

          {/* Kanban Board */}
          <div className="board">
            {STATUSES.map(s => (
              <Column
                key={s}
                status={s}
                tasks={tasksByStatus[s]}
                onEdit={setTaskModal}
                onDelete={handleTaskDelete}
                onStatusChange={handleStatusChange}
                onAdd={() => setTaskModal('create')}
              />
            ))}
          </div>
        </>
      )}

      {activeTab === 'members' && (
        <div className="members-section">
          {project.members?.length === 0 ? (
            <div className="empty-state"><p>No members yet</p></div>
          ) : (
            <div className="members-grid">
              {project.members?.map(m => (
                <div key={m.id} className="member-card">
                  <div className="member-card-avatar">{m.user?.name?.[0]?.toUpperCase()}</div>
                  <div className="member-card-info">
                    <div className="member-card-name">{m.user?.name}</div>
                    <div className="member-card-email">{m.user?.email}</div>
                  </div>
                  <div className="member-card-right">
                    <span className={`badge ${m.role === 'ADMIN' ? 'badge-high' : 'badge-todo'}`}>{m.role}</span>
                    {isProjectAdmin && m.userId !== user.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.userId)}>Remove</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(taskModal === 'create' || (taskModal && typeof taskModal === 'object')) && (
        <TaskModal
          task={taskModal === 'create' ? null : taskModal}
          projectId={id}
          projectMembers={project.members || []}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}

      {memberModal && (
        <AddMemberModal
          projectId={id}
          currentMembers={project.members || []}
          onClose={() => setMemberModal(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}
