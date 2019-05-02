import { combineReducers } from 'redux';

import user from './user';
import toggle from './toggle';
import toggleVibrate from './toggleVibrate';
import ball from './over';
import wicket from './wicket';
import stopwatch from './stopwatch';
import reset from './reset';
import partnership from './partnership';
import partnerships from './partnerships';
import wicketBall from './wicketball';
import settings from './settings';


export default combineReducers({
  user,
  toggle,
  toggleVibrate,
  ball,
  wicket,
  stopwatch,
  reset,
  partnership,
  partnerships,
  wicketBall,
  settings,
});
