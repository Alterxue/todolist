import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = 'http://172.20.10.6:3001/api';

const api = axios.create({ baseURL: API_URL });

// Token management
const setToken = async (token) => {
  await SecureStore.setItemAsync('token', token);
};

const getToken = async () => {
  return await SecureStore.getItemAsync('token');
};

const removeToken = async () => {
  await SecureStore.deleteItemAsync('token');
};

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function App() {
  const [screen, setScreen] = useState('login'); // 'login', 'register', 'dashboard'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('projects'); // 'projects', 'calendar'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [todoContent, setTodoContent] = useState('');

  // Dashboard states
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [todos, setTodos] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Check if user is already logged in
  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      if (token) {
        setScreen('dashboard');
        fetchProjects();
      }
    };
    checkToken();
  }, []);

  // API Functions
  const handleRegister = async () => {
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/register', { email, password });
      Alert.alert('Success', 'Registration successful! Please login.');
      setScreen('login');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      await setToken(response.data.token);
      setScreen('dashboard');
      fetchProjects();
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
      if (response.data.length > 0) {
        setSelectedProject(response.data[0]);
        fetchTodos(response.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchTodos = async (projectId) => {
    try {
      const response = await api.get('/todos', { params: { projectId } });
      setTodos(response.data);
    } catch (err) {
      console.error('Error fetching todos:', err);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    // Validate date format if provided
    let dueDate = null;
    if (projectDueDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(projectDueDate)) {
        setError('Invalid date format. Use YYYY-MM-DD (e.g., 2026-04-25)');
        return;
      }
      // Verify it's a valid date
      const dateObj = new Date(projectDueDate);
      if (isNaN(dateObj.getTime())) {
        setError('Invalid date');
        return;
      }
      dueDate = projectDueDate;
    }

    try {
      const response = await api.post('/projects', {
        name: projectName,
        dueDate: dueDate
      });
      setProjects([...projects, response.data]);
      setProjectName('');
      setProjectDueDate('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    Alert.alert('Delete Project', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/projects/${projectId}`);
            const updated = projects.filter(p => p.id !== projectId);
            setProjects(updated);
            if (selectedProject?.id === projectId) {
              setSelectedProject(updated[0] || null);
              if (updated.length > 0) {
                fetchTodos(updated[0].id);
              } else {
                setTodos([]);
              }
            }
          } catch (err) {
            setError('Failed to delete project');
          }
        }
      }
    ]);
  };

  const handleCreateTodo = async () => {
    if (!todoContent.trim() || !selectedProject) {
      setError('Please select a project and enter todo content');
      return;
    }

    try {
      const response = await api.post('/todos', {
        content: todoContent,
        projectId: selectedProject.id
      });
      setTodos([...todos, response.data]);
      setTodoContent('');
      setError('');
    } catch (err) {
      setError('Failed to create todo');
    }
  };

  const handleToggleTodo = async (todoId, completed) => {
    try {
      await api.put(`/todos/${todoId}`, { completed: !completed });
      setTodos(todos.map(t =>
        t.id === todoId ? { ...t, completed: !completed } : t
      ));
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const handleDeleteTodo = async (todoId) => {
    try {
      await api.delete(`/todos/${todoId}`);
      setTodos(todos.filter(t => t.id !== todoId));
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleLogout = async () => {
    await removeToken();
    setScreen('login');
    setEmail('');
    setPassword('');
    setProjects([]);
    setTodos([]);
    setSelectedProject(null);
  };

  // Register Screen
  if (screen === 'register') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            {error ? <Text style={styles.errorBox}>{error}</Text> : null}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 chars)"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!isLoading}
            />

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign Up</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setScreen('login')}>
              <Text style={styles.link}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Login Screen
  if (screen === 'login') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.title}>Welcome Back</Text>
            {error ? <Text style={styles.errorBox}>{error}</Text> : null}
            
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setScreen('register')}>
              <Text style={styles.link}>Don't have an account? Create One</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Dashboard Screen
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.viewBtn, view === 'projects' && styles.viewBtnActive]}
            onPress={() => setView('projects')}
          >
            <Text style={styles.viewBtnText}>Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.viewBtn, view === 'calendar' && styles.viewBtnActive]}
            onPress={() => setView('calendar')}
          >
            <Text style={styles.viewBtnText}>Calendar</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      {view === 'calendar' ? (
        // Calendar View
        <ScrollView style={styles.content}>
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
                <Text style={styles.calendarNavBtn}>← Previous</Text>
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
                <Text style={styles.calendarNavBtn}>Next →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.calendarDayHeader}>{day}</Text>
              ))}
            </View>

            <View style={styles.calendarDays}>
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDayEmpty} />
              ))}
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                const day = i + 1;
                const dayProjects = projects.filter((p) => {
                  if (!p.dueDate) return false;
                  const dueDate = new Date(p.dueDate);
                  return dueDate.getDate() === day && dueDate.getMonth() === currentDate.getMonth() && dueDate.getFullYear() === currentDate.getFullYear();
                });
                return (
                  <View key={day} style={[styles.calendarDay, dayProjects.length > 0 && styles.calendarDayWithProject]}>
                    <Text style={styles.calendarDayText}>{day}</Text>
                    {dayProjects.length > 0 && (
                      <Text style={styles.calendarDayBadge}>{dayProjects.length}</Text>
                    )}
                  </View>
                );
              })}
            </View>

            <View style={styles.calendarLegend}>
              <Text style={styles.calendarLegendTitle}>Projects with Due Dates:</Text>
              {projects.filter((p) => p.dueDate).map((project) => (
                <View key={project.id} style={styles.calendarLegendItem}>
                  <Text style={styles.calendarLegendDot}>📅</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.calendarLegendName}>{project.name}</Text>
                    <Text style={styles.calendarLegendDate}>
                      {new Date(project.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              ))}
              {projects.filter((p) => p.dueDate).length === 0 && (
                <Text style={styles.emptyText}>No projects with due dates</Text>
              )}
            </View>
          </View>
        </ScrollView>
      ) : (
        // Projects & Todos View
        <ScrollView style={styles.content}>
          {/* Projects Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Project name..."
              value={projectName}
              onChangeText={setProjectName}
              placeholderTextColor="#999"
            />
            <Text style={styles.inputLabel}>Due Date (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD or leave empty"
              value={projectDueDate}
              onChangeText={setProjectDueDate}
              placeholderTextColor="#999"
              keyboardType="default"
            />
            {projectDueDate && !/^\d{4}-\d{2}-\d{2}$/.test(projectDueDate) && (
              <Text style={styles.warningText}>⚠️ Format: YYYY-MM-DD (e.g., 2026-04-25)</Text>
            )}
            <TouchableOpacity style={styles.button} onPress={handleCreateProject}>
              <Text style={styles.buttonText}>Create Project</Text>
            </TouchableOpacity>

            <View style={styles.list}>
              {projects.length === 0 ? (
                <Text style={styles.emptyText}>No projects</Text>
              ) : (
                projects.map((project) => (
                  <View
                    key={project.id}
                    style={[
                      styles.projectItem,
                      selectedProject?.id === project.id && styles.projectItemSelected
                    ]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1 }}
                      onPress={() => {
                        setSelectedProject(project);
                        fetchTodos(project.id);
                      }}
                    >
                      <Text style={styles.projectName}>{project.name}</Text>
                      {project.dueDate && (
                        <Text style={styles.projectDate}>
                          📅 {new Date(project.dueDate).toLocaleDateString()}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteProject(project.id)}
                    >
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Todos Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedProject ? `${selectedProject.name} - Todos` : 'Select Project'}
            </Text>

            {selectedProject && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Add todo..."
                  value={todoContent}
                  onChangeText={setTodoContent}
                />
                <TouchableOpacity style={styles.button} onPress={handleCreateTodo}>
                  <Text style={styles.buttonText}>Add Todo</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.list}>
              {todos.length === 0 ? (
                <Text style={styles.emptyText}>No todos</Text>
              ) : (
                todos.map((todo) => (
                  <View key={todo.id} style={styles.todoItem}>
                    <TouchableOpacity
                      style={styles.checkbox}
                      onPress={() => handleToggleTodo(todo.id, todo.completed)}
                    >
                      <Text style={styles.checkboxText}>{todo.completed ? '✓' : '○'}</Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.todoText,
                        todo.completed && styles.todoCompleted
                      ]}
                    >
                      {todo.content}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteTodoBtn}
                      onPress={() => handleDeleteTodo(todo.id)}
                    >
                      <Text style={styles.deleteTodoBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#667eea',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fee',
    borderWidth: 1,
    borderColor: '#fcc',
    color: '#c33',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },

  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  list: {
    marginTop: 12,
  },
  projectItem: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectItemSelected: {
    backgroundColor: '#f0f0f0',
    borderColor: '#667eea',
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  todoItem: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxText: {
    fontSize: 18,
    color: '#667eea',
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteTodoBtn: {
    padding: 5,
  },
  deleteTodoBtnText: {
    fontSize: 20,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewBtnActive: {
    backgroundColor: 'white',
  },
  viewBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutBtnText: {
    color: 'white',
    fontWeight: '600',
  },
  // Calendar Styles
  calendarSection: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarNavBtn: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  calendarDayHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#667eea',
    width: '14.28%',
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  calendarDayEmpty: {
    width: '14.28%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  calendarDayWithProject: {
    backgroundColor: '#e8f4f8',
    borderColor: '#667eea',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  calendarDayBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#667eea',
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  calendarLegend: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 15,
  },
  calendarLegendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  calendarLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
  },
  calendarLegendDot: {
    fontSize: 16,
    marginRight: 10,
  },
  calendarLegendName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  calendarLegendDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
});
