
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_STOPTIMER = 'ADD_STOPTIMER';

export const updateStoptimer = ( stoptimer ) => ({
  type: ADD_STOPTIMER,
  stoptimer,
});

const initialState = {
  stoptimer: false,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  console.log(action.stoptimer);
  switch (action.type) {
    case ADD_STOPTIMER:
    return {
      ...state,
      stoptimer: action.stoptimer,
    };
    default:
      return state;
  }
};
