import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Lists from '../pages/Lists';
import Settings from '../pages/Settings';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/Lists',
    element: <Lists />
  },
  {
    path: '/settings',
    element: <Settings />
  }
], {
  basename: '/react2026_1'
});

export default router;