const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createProject,
  listProjects,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

// API 12
router.post('/', auth, createProject);

// API 13
router.get('/', auth, listProjects);

// API 14
router.put('/:projectId', auth, updateProject);

// API 15
router.delete('/:projectId', auth, deleteProject);

module.exports = router;
