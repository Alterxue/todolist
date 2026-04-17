import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Calendar from '../components/Calendar';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [todoContent, setTodoContent] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Set up API authorization
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Fetch user profile and projects
    const fetchData = async () => {
      try {
        const userResponse = await api.get('/profile');
        setUser(userResponse.data.user);
        
        const projectsResponse = await api.get('/projects');
        setProjects(projectsResponse.data);
        
        if (projectsResponse.data.length > 0) {
          setSelectedProject(projectsResponse.data[0]);
          await fetchTodos(projectsResponse.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchTodos = async (projectId) => {
    try {
      const response = await api.get('/todos', { params: { projectId } });
      setTodos(response.data);
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      setError('Failed to load todos');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    try {
      setError('');
      const response = await api.post('/projects', { 
        name: projectName,
        dueDate: projectDueDate || null
      });
      setProjects([...projects, response.data]);
      setProjectName('');
      setProjectDueDate('');
      setSelectedProject(response.data);
      setTodos([]);
    } catch (error) {
      console.error('Failed to create project:', error);
      setError(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      const updatedProjects = projects.filter(p => p.id !== projectId);
      setProjects(updatedProjects);
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProjects[0] || null);
        if (updatedProjects.length > 0) {
          await fetchTodos(updatedProjects[0].id);
        } else {
          setTodos([]);
        }
      }
      setError('');
    } catch (error) {
      console.error('Failed to delete project:', error);
      setError('Failed to delete project');
    }
  };

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    await fetchTodos(project.id);
    setTodoContent('');
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!todoContent.trim() || !selectedProject) {
      setError('Todo content cannot be empty');
      return;
    }

    try {
      setError('');
      const response = await api.post('/todos', {
        content: todoContent,
        projectId: selectedProject.id
      });
      setTodos([...todos, response.data]);
      setTodoContent('');
    } catch (error) {
      console.error('Failed to create todo:', error);
      setError('Failed to create todo');
    }
  };

  const handleToggleTodo = async (todoId, completed) => {
    try {
      const response = await api.put(`/todos/${todoId}`, { completed: !completed });
      setTodos(todos.map(t => t.id === todoId ? response.data : t));
    } catch (error) {
      console.error('Failed to update todo:', error);
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await api.delete(`/todos/${todoId}`);
      setTodos(todos.filter(t => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
      setError('Failed to delete todo');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '20px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: '0 0 10px 0',
              color: '#333',
              fontSize: '28px'
            }}>
              Welcome, {user?.email}!
            </h1>
            <p style={{
              margin: '0',
              color: '#666',
              fontSize: '14px'
            }}>
              Manage your projects and todos here
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Main Content - Two Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '30px'
        }}>
          {/* Left Sidebar - Projects */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            height: 'fit-content'
          }}>
            <h2 style={{
              color: '#333',
              marginBottom: '20px',
              fontSize: '18px'
            }}>
              Projects
            </h2>

            {/* Create Project Form */}
            <form onSubmit={handleCreateProject} style={{ marginBottom: '30px' }}>
              <input
                type="text"
                placeholder="New project name..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="date"
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  marginBottom: '10px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                Create Project
              </button>
            </form>

            {/* Projects List */}
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {projects.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>No projects yet</p>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    style={{
                      padding: '12px',
                      marginBottom: '10px',
                      background: selectedProject?.id === project.id ? '#f0f0f0' : 'white',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleSelectProject(project)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                        {project.name}
                      </div>
                      {project.dueDate && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                          📅 {new Date(project.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id);
                      }}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Todos */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
          }}>
            {selectedProject ? (
              <>
                <h2 style={{
                  color: '#333',
                  marginBottom: '20px',
                  fontSize: '18px'
                }}>
                  {selectedProject.name} - Todos
                </h2>

                {/* Create Todo Form */}
                <form onSubmit={handleCreateTodo} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Add a new todo..."
                    value={todoContent}
                    onChange={(e) => setTodoContent(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                  >
                    Add Todo
                  </button>
                </form>

                {/* Todos List */}
                <div>
                  {todos.length === 0 ? (
                    <p style={{ color: '#999', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                      No todos yet. Create one to get started!
                    </p>
                  ) : (
                    todos.map(todo => (
                      <div
                        key={todo.id}
                        style={{
                          padding: '15px',
                          marginBottom: '10px',
                          background: todo.completed ? '#e8f5e9' : '#f5f5f5',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={todo.completed}
                          onChange={() => handleToggleTodo(todo.id, todo.completed)}
                          style={{
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          flex: 1,
                          fontSize: '14px',
                          color: todo.completed ? '#999' : '#333',
                          textDecoration: todo.completed ? 'line-through' : 'none'
                        }}>
                          {todo.content}
                        </span>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#999'
              }}>
                <h3>No project selected</h3>
                <p>Create a project to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Calendar View */}
        <div style={{ marginTop: '40px' }}>
          <Calendar projects={projects} />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
