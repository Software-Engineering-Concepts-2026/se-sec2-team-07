import React from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import App from './App';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import Editor from './pages/Editor';
import Review from './pages/Review';
import Schedule from './pages/Schedule';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Notes from './pages/Notes';
import Statistics from './pages/Statistics';
import Export from './pages/Export';
import PomodoroPage from './pomodoro';
import './style.css';

const router = createHashRouter([{ element: <App />, children: [{ element: <Layout />, children: [
  { path: '/', element: <Dashboard /> },
  { path: '/decks', element: <Library /> },
  { path: '/create', element: <Editor key="create" /> },
  { path: '/edit/:id', element: <Editor /> },
  { path: '/review', element: <Review key="all" /> },
  { path: '/review/:id', element: <Review /> },
  { path: '/schedule', element: <Schedule /> },
  { path: '/courses', element: <Courses /> },
  { path: '/courses/:id', element: <CourseDetail /> },
  { path: '/notes', element: <Notes /> },
  { path: '/pomodoro', element: <PomodoroPage /> },
  { path: '/stats', element: <Statistics /> },
  { path: '/export', element: <Export /> },
  { path: '*', element: <Navigate to="/" replace /> },
] }] }]);
createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
