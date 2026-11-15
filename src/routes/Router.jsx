import { createHashRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Lists from '../pages/Lists';
import Settings from '../pages/Settings';

const router = createHashRouter([
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
]);

export default router;
