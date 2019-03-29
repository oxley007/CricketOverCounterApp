
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_TOGGLE = 'ADD_TOGGLE';

export const updateToggle = ( togglePremium ) => ({
  type: ADD_TOGGLE,
  togglePremium,
});

const initialState = {
  togglePremium: false,
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  console.log(action.togglePremium);
  switch (action.type) {
    case ADD_TOGGLE:
    return {
      ...state,
      togglePremium: action.togglePremium
    };
    default:
      return state;
  }
};
