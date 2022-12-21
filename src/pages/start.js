import React, { useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { GlobalContext } from '../contexts/GlobalContext';

import icon from '../images/icon.svg';

export default function Start() {
  const navigate = useNavigate();
  const { changeState } = useContext(GlobalContext);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 150,
      alignSelf: 'center',
      width: '75%',
      maxWidth: 300,
      alignItems: 'stretch',
      justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        marginBottom: '15vh',
      }}>
        <img style={{ width: 75 }} src={icon}/>
        <div style={{ fontFamily: 'Nunito', fontSize: 32, color: '#34b27b' }}>Check Split</div>
        <div style={{ fontFamily: 'Montserrat', fontSize: 18, color: '#c3c3c3' }}>Split checks quick!</div>
      </div>
      <button
        onClick={() => {
          changeState({ userType: 'payer' })
          navigate('/setup')
        }}
      >
        I'm paying
      </button>
      <br/>
      <button
        onClick={() => {
          changeState({ userType: 'debtor' })
          navigate('/setup')
        }}
      >
        I owe someone
      </button>
    </div>
  )
}
