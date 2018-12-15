import { combineReducers } from 'redux';

import user from './user';
import toggle from './toggle';
import ball from './over';
import wicket from './wicket';
import stopwatch from './stopwatch';
import reset from './reset';
import partnership from './partnership';


export default combineReducers({
  user,
  toggle,
  ball,
  wicket,
  stopwatch,
  reset,
  partnership,
});
