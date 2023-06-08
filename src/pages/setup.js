import React, { useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../contexts/GlobalContext';

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const {
    changeState, axios, userType, nickname, venmoId, roomId,
  } = useContext(GlobalContext);
  const navigate = useNavigate();

  const imgUpload = (e) => {
    if (!nickname) {
      return;
    }
    e.preventDefault();
    const elem = document.querySelector('#image');
    elem.click();
  };

  const processPicture = async (e) => {
    setLoading(true);
    if (e.target.files?.[0]) {
      const receipt = (await axios.post('/api/processReceipt', {
        body: e.target.files?.[0],
      }, {
        headers: { 'content-type': 'multipart/form-data' },
      })).data;
      setLoading(false);
      const res = await axios.post('/api/createRoom', {
        receipt,
        venmoId,
      });
      navigate(`/room/${res.data.roomId}`);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      fontSize: 24,
    }}
    >
      <div>
        Nickname (required):
      </div>
      <input
        id="name"
        placeholder="Nickname (6 characters)"
        value={nickname}
        onChange={(e) => {
          if (e.target.value.length <= 12) {
            changeState({ nickname: e.target.value });
          }
        }}
      />
      <br />
      { userType === 'payer' ? (
        <>
          <div>
            Venmo ID (optional):
          </div>
          <input
            id="venmoId"
            placeholder="@your-venmo-id"
            value={venmoId}
            onChange={(e) => changeState({ venmoId: e.target.value.slice(0, 35) })}
          />
          <br />
        </>
      ) : (
        <>
          <div>
            Room ID (required):
          </div>
          <input
            id="roomId"
            placeholder="XXXXX"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="on"
            spellCheck="false"
            value={roomId}
            onChange={(e) => changeState({
              roomId: e.target.value.toUpperCase().replaceAll(/[^a-zA-Z]/g, '').slice(0, 5),
            })}
          />
          <br />
        </>
      )}
      <div style={{
        display: 'flex',
        gap: 10,
      }}
      >
        <div
          className="btn"
          onClick={() => navigate('/')}
          disabled={loading}
          style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#606060',
            height: 26,
            aspectRatio: 1,
          }}
        >
          <span style={{ color: 'white' }}>
            <FontAwesomeIcon icon={faXmark} />
          </span>
        </div>
        <div
          className="btn"
          onClick={userType === 'payer' ? imgUpload : () => {
            if (nickname.length && roomId) navigate(`/room/${roomId}`);
          }}
          disabled={loading}
          style={{
            display: 'flex',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          { loading ? (
            <div className="loader" />
          ) : (
            <span>{ userType === 'payer' ? 'Take Picture Of Receipt' : 'Next' }</span>
          )}
        </div>
      </div>
      <input
        id="image"
        name="image"
        type="file"
        accept="image/png, image/gif, image/jpeg, image/jpg"
        hidden
        onChange={processPicture}
      />
    </div>
  );
}
