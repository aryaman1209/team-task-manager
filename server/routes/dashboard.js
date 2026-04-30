const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';
    const now = new Date();

    // Projects accessible to user
    const projectWhere = isAdmin
      ? {}
      : { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };

    const [projects, taskStats, myTasks, recentTasks] = await Promise.all([
      prisma.project.findMany({
        where: projectWhere,
        include: { _count: { select: { tasks: true, members: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),

      // Task counts by status (tasks in my projects)
      prisma.task.groupBy({
        by: ['status'],
        where: isAdmin
          ? {}
          : {
              project: {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
              },
            },
        _count: { _all: true },
      }),

      // My assigned tasks
      prisma.task.findMany({
        where: { assigneeId: userId, status: { not: 'DONE' } },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      // Recently created tasks
      prisma.task.findMany({
        where: isAdmin
          ? {}
          : {
              project: {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
              },
            },
        include: {
          project: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    // Overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: 'DONE' },
        ...(isAdmin
          ? {}
          : {
              project: {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
              },
            }),
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Build status map
    const statusCounts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
    taskStats.forEach(({ status, _count }) => {
      statusCounts[status] = _count._all;
    });

    const totalProjects = await prisma.project.count({ where: projectWhere });
    const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    res.json({
      stats: {
        totalProjects,
        totalTasks,
        statusCounts,
        overdueCount: overdueTasks.length,
      },
      recentProjects: projects,
      myTasks,
      recentTasks,
      overdueTasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
