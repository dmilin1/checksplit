import React, { useState } from 'react';
import axios from 'axios';
import { useCookies } from 'react-cookie';
import constants from '../constants';

axios.defaults.baseURL = constants.baseURL;

export const GlobalContext = React.createContext();

export default function GlobalContextProvider({ children }) {
  const [cookies, setCookie] = useCookies();
  const [globalState, setGlobalState] = useState({
    axios,
    userType: null,
    nickname: cookies?.nickname ?? '',
    venmoId: cookies?.venmoId ?? '',
    roomId: cookies?.roomId ?? '',
  });

  const changeState = (newItems) => {
    setGlobalState({ ...globalState, ...newItems });
    Object.keys(newItems).forEach((key) => {
      if ([
        'nickname',
        'venmoId',
        'roomId',
      ].includes(key)) {
        setCookie(key, newItems[key], { path: '/', expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
      }
    });
  };

  return (
    /* eslint-disable react/jsx-no-constructed-context-values */
    <GlobalContext.Provider value={{ ...globalState, changeState }}>
      {children}
    </GlobalContext.Provider>
  );
}
