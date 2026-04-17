require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();

const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await prisma.user.findUnique({
      where: { email }
    });

    if (userExists) {
      return res.status(400).json({ message: 'This email has been registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });
    res.status(201).json({ message: 'success', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error inside the server' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error inside the server' });
  }
});

// Protected route example - get user profile
app.get('/api/profile', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error inside the server' });
  }
});

// ===== PROJECTS API =====
// Get all projects for user
app.get('/api/projects', verifyToken, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId }
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching projects' });
  }
});

// Create new project
app.post('/api/projects', verifyToken, async (req, res) => {
  const { name, dueDate } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        userId: req.userId,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error.message);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

// Delete project
app.delete('/api/projects/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete todos first
    await prisma.todo.deleteMany({
      where: { projectId: parseInt(id) }
    });
    
    // Delete project
    const project = await prisma.project.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting project' });
  }
});

// ===== TODOS API =====
// Get todos for project
app.get('/api/todos', verifyToken, async (req, res) => {
  const { projectId } = req.query;
  try {
    const todos = await prisma.todo.findMany({
      where: { projectId: parseInt(projectId) }
    });
    res.status(200).json(todos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching todos' });
  }
});

// Create todo
app.post('/api/todos', verifyToken, async (req, res) => {
  const { content, projectId } = req.body;
  try {
    const todo = await prisma.todo.create({
      data: {
        content,
        projectId: parseInt(projectId)
      }
    });
    res.status(201).json(todo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating todo' });
  }
});

// Update todo
app.put('/api/todos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { content, completed } = req.body;
  try {
    const todo = await prisma.todo.update({
      where: { id: parseInt(id) },
      data: {
        ...(content && { content }),
        ...(completed !== undefined && { completed })
      }
    });
    res.status(200).json(todo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const todo = await prisma.todo.delete({
      where: { id: parseInt(id) }
    });
    res.status(200).json(todo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting todo' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})