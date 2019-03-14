
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_WICKETBALL = 'ADD_WICKETBALL';

export const updateWicketBall = ( wicketBall ) => ({
  type: ADD_WICKETBALL,
  wicketBall,
});

const initialState = {
  wicketBall: false,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_WICKETBALL:
    console.log(action.wicketBall  + ' wicketBall');
    return {
      ...state,
      wicketBall: action.wicketBall,
    };
    default:
      return state;
  }
};
