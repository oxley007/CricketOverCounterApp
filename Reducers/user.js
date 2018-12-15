
//import { ADD_TOGGLE } from "../Constants/action-types";

import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const UPDATE_USERNAME = 'UPDATE_USERNAME';

export const updateUsername = username => ({
  type: UPDATE_USERNAME,
  username,
});

const initialState = {
  username: '',
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_USERNAME:
      return {
        ...state,
        username: action.username,
      };
    default:
      return state;
  }
};

//export default rootReducer;



/*
export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_USERNAME:
      return {
        ...state,
        username: action.username,
      };
    default:
      return state;
  }
};
*/
