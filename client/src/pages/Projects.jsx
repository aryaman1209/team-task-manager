import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/client';
import { ProjectModal } from '../components/Modal';
import './Projects.css';

function ProjectCard({ project, onEdit, onDelete }) {
  const memberCount = project.members?.length ?? 0;
  const taskCount = project._count?.tasks ?? 0;

  return (
    <div className="proj-card">
      <div className="proj-card-header">
        <div className="proj-icon">{project.name[0].toUpperCase()}</div>
        <div className="proj-card-actions">
          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => onEdit(project)} title="Edit">✎</button>
          <button className="btn btn-icon btn-danger btn-sm" onClick={() => onDelete(project)} title="Delete">✕</button>
        </div>
      </div>

      <Link to={`/projects/${project.id}`}>
        <h3 className="proj-name">{project.name}</h3>
        {project.description && <p className="proj-desc">{project.description}</p>}
      </Link>

      <div className="proj-meta">
        <span className="proj-stat"><span className="proj-stat-num">{taskCount}</span> tasks</span>
        <span className="proj-stat"><span className="proj-stat-num">{memberCount}</span> members</span>
      </div>

      <div className="proj-members">
        {project.members?.slice(0, 5).map(m => (
          <div key={m.id} className="member-avatar" title={m.user?.name}>{m.user?.name?.[0]?.toUpperCase()}</div>
        ))}
        {memberCount > 5 && <div className="member-avatar more">+{memberCount - 5}</div>}
      </div>

      <div className="proj-footer">
        <span className="proj-owner">by {project.owner?.name}</span>
        <Link to={`/projects/${project.id}`} className="btn btn-ghost btn-sm">Open →</Link>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | project (edit)
  const [search, setSearch] = useState('');

  useEffect(() => {
    projectsApi.list().then(setProjects).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaved = (saved) => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModal(null);
  };

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await projectsApi.delete(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          + New Project
        </button>
      </div>

      <div className="projects-toolbar">
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon">📁</div>
          <h3>{search ? 'No projects found' : 'No projects yet'}</h3>
          <p>{search ? 'Try a different search' : 'Create your first project to get started'}</p>
          {!search && <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setModal('create')}>Create Project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onEdit={setModal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {(modal === 'create' || (modal && typeof modal === 'object')) && (
        <ProjectModal
          project={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
