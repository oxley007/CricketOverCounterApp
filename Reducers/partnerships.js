
import { combineReducers } from 'redux';

import {AsyncStorage} from 'react-native';

export const ADD_PARTNERSHIPS = 'ADD_PARTNERSHIPS';

export const updatePartnerships = ( partnerships ) => ({
  type: ADD_PARTNERSHIPS,
  partnerships,
});

const initialState = {
  partnerships: [],
};

console.log('hitting rootReducer');
console.log(initialState);

//const rootReducer = (state = initialState, action) => {
export default (state = initialState, action) => {
  switch (action.type) {
    case ADD_PARTNERSHIPS:
    console.log(action.partnerships  + ' partnerships');
    return {
      ...state,
      partnerships: action.partnerships,
    };
    default:
      return state;
  }
};
