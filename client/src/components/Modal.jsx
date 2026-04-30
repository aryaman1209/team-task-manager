import { useState, useEffect } from 'react';
import { tasksApi, authApi } from '../api/client';
import './Modal.css';

const STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function TaskModal({ task, projectId, projectMembers = [], onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'TODO',
    priority: task?.priority || 'MEDIUM',
    assigneeId: task?.assigneeId || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        projectId,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      };
      const saved = isEdit
        ? await tasksApi.update(task.id, payload)
        : await tasksApi.create(payload);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            <div className="field">
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={set('title')} placeholder="Task title..." />
            </div>

            <div className="field">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="Optional description..." style={{ resize: 'vertical' }} />
            </div>

            <div className="modal-row">
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Priority</label>
                <select className="input" value={form.priority} onChange={set('priority')}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-row">
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Assignee</label>
                <select className="input" value={form.assigneeId} onChange={set('assigneeId')}>
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => (
                    <option key={m.user?.id || m.id} value={m.user?.id || m.id}>
                      {m.user?.name || m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label className="label">Due Date</label>
                <input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Project modal
export function ProjectModal({ project, onClose, onSaved }) {
  const isEdit = !!project;
  const [form, setForm] = useState({ name: project?.name || '', description: project?.description || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name required');
    setLoading(true); setError('');
    try {
      const { projectsApi } = await import('../api/client');
      const saved = isEdit
        ? await projectsApi.update(project.id, form)
        : await projectsApi.create(form);
      onSaved(saved);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Project' : 'New Project'}</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="field">
              <label className="label">Project Name *</label>
              <input className="input" value={form.name} onChange={set('name')} placeholder="e.g. Marketing Campaign" />
            </div>
            <div className="field">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="What is this project about?" style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              {isEdit ? 'Save' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add member modal
export function AddMemberModal({ projectId, currentMembers, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authApi.users().then((all) => {
      const memberIds = new Set(currentMembers.map(m => m.user?.id || m.userId));
      setUsers(all.filter(u => !memberIds.has(u.id)));
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return setError('Select a user');
    setLoading(true); setError('');
    try {
      const { projectsApi } = await import('../api/client');
      const member = await projectsApi.addMember(projectId, { userId: selected, role });
      onAdded(member);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-in" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="btn btn-icon btn-ghost" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}
            <div className="field">
              <label className="label">User</label>
              <select className="input" value={selected} onChange={e => setSelected(e.target.value)}>
                <option value="">Select user...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Role</label>
              <select className="input" value={role} onChange={e => setRole(e.target.value)}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
