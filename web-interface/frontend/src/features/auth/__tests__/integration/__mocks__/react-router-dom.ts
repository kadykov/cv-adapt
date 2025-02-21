import * as ReactRouterDom from 'react-router-dom';
import { mockNavigate } from './navigation';

module.exports = {
  ...ReactRouterDom,
  useNavigate: () => mockNavigate,
};
