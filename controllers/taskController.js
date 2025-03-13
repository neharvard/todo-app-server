const Task = require('../models/Task');

exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id });
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.addTask = async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) return res.status(400).json({ msg: 'Title is required' });

        const newTask = new Task({ title, user: req.user.id });
        await newTask.save();
        res.json(newTask);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        // Ensure the user owns the task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Unauthorized' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Task deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// exports.updateTask = async (req, res) => {
//     try {
//         const { completed, title } = req.body;
       

//         let task = await Task.findById(req.params.id);
//         if (!task) return res.status(404).json({ msg: 'Task not found' });

//         // Ensure the user owns the task
//         if (task.user.toString() !== req.user.id) {
//             return res.status(401).json({ msg: 'Unauthorized' });
//         }

//         task.completed = completed;
//         task.title = title; // update the task title

//         await task.save(); 
//         res.json(task); // Return the updated task
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ msg: 'Server Error' });
//     }
// };


exports.updateTask = async (req, res) => {
    try {
      const { completed, title } = req.body; // Destructure both fields
      const taskId = req.params.id;
  
      let task = await Task.findById(taskId);
      if (!task) return res.status(404).json({ msg: 'Task not found' });
  
      // Ensure the user owns the task
      if (task.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Unauthorized' });
      }
  
      // Update only the fields that are provided
      if (completed !== undefined) {
        task.completed = completed;
      }
      if (title !== undefined) {
        task.title = title;
      }
  
      await task.save();
  
      res.json(task); // Return the updated task
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ msg: 'Server Error' });
    }
  };