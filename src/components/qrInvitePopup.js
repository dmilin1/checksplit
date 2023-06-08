import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';

export default function QRInvitePopup({ show, setShow }) {
  const { roomId } = useParams();
  const [qrImg, setQrImg] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(document.location.href, {
      errorCorrectionLevel: 'M',
      margin: 0,
      width: 350,
      color: {
        dark: '#34b27b',
        light: '#1c1c1c',
      },
    }, (err, url) => {
      setQrImg(url);
    });
  }, [roomId]);

  return (
    <div
      style={{
        position: 'absolute',
        display: show ? 'flex' : 'none',
        flex: 1,
        height: '100vh',
        maxHeight: '-webkit-fill-available',
        width: '100vw',
        flexDirection: 'column',
        justifyContent: 'stretch',
        fontSize: 24,
        background: 'rgba(0,0,0,0.75)',
      }}
      onClick={() => setShow(false)}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#1c1c1c',
        margin: 30,
        padding: 20,
        border: 2,
        borderRadius: 10,
        borderStyle: 'solid',
        borderColor: '#34b27b',
      }}
      >
        <div style={{
          fontSize: 18,
        }}
        >
          Ask others to scan this QR code to join the room, or invite them by clicking "Share Link" below.
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          margin: '20px 0px',
          width: '100%',
        }}
        >
          <img src={qrImg} />
        </div>
        <div
          style={{
            padding: '3px 10px',
            fontSize: 18,
            borderColor: '#34b27b',
            borderRadius: 10,
            borderWidth: 2,
            borderStyle: 'solid',
            color: 'white',
            backgroundColor: '#34b27b',
            width: 'fit-content',
          }}
          onClick={(e) => {
            e.stopPropagation();
            try {
              navigator?.share({
                url: document.location.href,
              });
            } catch (err) {
              alert(err);
            }
          }}
        >
          Share Link
        </div>
      </div>
    </div>
  );
}
