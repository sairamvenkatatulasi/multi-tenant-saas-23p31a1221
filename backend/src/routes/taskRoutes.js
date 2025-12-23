const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTask,
  listProjectTasks,
  updateTaskStatus,
  updateTask
} = require('../controllers/taskController');

// API 16
router.post('/projects/:projectId/tasks', auth, createTask);

// API 17
router.get('/projects/:projectId/tasks', auth, listProjectTasks);

// API 18
router.patch('/tasks/:taskId/status', auth, updateTaskStatus);

// API 19
router.put('/tasks/:taskId', auth, updateTask);

module.exports = router;
