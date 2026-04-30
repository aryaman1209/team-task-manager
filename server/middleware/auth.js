const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user is admin OR a project admin
const requireProjectAccess = async (req, res, next) => {
  const { id: projectId } = req.params;
  if (req.user.role === 'ADMIN') return next();

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.user.id } },
  });

  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this project' });
  }
  req.membership = membership;
  next();
};

const requireProjectAdmin = async (req, res, next) => {
  const { id: projectId } = req.params;
  if (req.user.role === 'ADMIN') return next();

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project?.ownerId === req.user.id) return next();

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: req.user.id } },
  });
  if (!membership || membership.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Project admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireProjectAccess, requireProjectAdmin };
