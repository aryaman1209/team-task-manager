const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/projects — list projects for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const where =
      req.user.role === 'ADMIN'
        ? {}
        : {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id } } },
            ],
          };

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects — create project (any authenticated user)
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Project name required'),
    body('description').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { name, description } = req.body;
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.user.id,
          members: {
            create: { userId: req.user.id, role: 'ADMIN' },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
      });
      res.status(201).json(project);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// GET /api/projects/:id
router.get('/:id', authenticate, requireProjectAccess, async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/projects/:id
router.put(
  '/:id',
  authenticate,
  requireProjectAdmin,
  [body('name').optional().trim().notEmpty()],
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: { name, description },
        include: { owner: { select: { id: true, name: true, email: true } } },
      });
      res.json(project);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireProjectAdmin, async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/projects/:id/members — add member
router.post('/:id/members', authenticate, requireProjectAdmin, async (req, res) => {
  const { userId, role = 'MEMBER' } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });

  try {
    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: req.params.id, userId } },
      create: { projectId: req.params.id, userId, role },
      update: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId — remove member
router.delete('/:id/members/:userId', authenticate, requireProjectAdmin, async (req, res) => {
  try {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId: req.params.id, userId: req.params.userId },
      },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
