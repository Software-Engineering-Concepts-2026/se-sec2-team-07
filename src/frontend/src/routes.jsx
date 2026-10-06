import { lazy } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import App from './App';
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Library = lazy(() => import('./pages/Library'));
const Editor = lazy(() => import('./pages/Editor'));
const Review = lazy(() => import('./pages/Review'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Notes = lazy(() => import('./pages/Notes'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Export = lazy(() => import('./pages/Export'));
const Archive = lazy(() => import('./pages/Archive'));
const PomodoroPage = lazy(() => import('./pomodoro'));

export const router = createHashRouter([
  {
    element: <App />,
    children: [
      {
        element: <Layout />,
        children: [
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
          { path: '/archive', element: <Archive /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
    ],
  },
]);
