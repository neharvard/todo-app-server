const express = require('express');
const { getTasks, addTask, deleteTask, updateTask } = require('../controllers/taskController');
const auth = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', auth, getTasks);
router.post('/', auth, addTask);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
