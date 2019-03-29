
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_TOGGLEVIBRATE = 'ADD_TOGGLEVIBRATE';

export const updateToggleVibrate = ( toggleVibrate ) => ({
  type: ADD_TOGGLEVIBRATE,
  toggleVibrate,
});

const initialState = {
  toggleVibrate: 'true',
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  console.log(action.toggleVibrate);
  switch (action.type) {
    case ADD_TOGGLEVIBRATE:
    return {
      ...state,
      toggleVibrate: action.toggleVibrate,
    };
    default:
      return state;
  }
};
