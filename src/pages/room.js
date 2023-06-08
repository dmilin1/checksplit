import React, { useState, useContext, useEffect, useRef, useMemo }  from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";

import constants from '../constants';
import { GlobalContext } from '../contexts/GlobalContext';
import QRInvitePopup from '../components/qrInvitePopup';


export default function Room() {
  const { roomId } = useParams();
  const { changeState, axios, userType, nickname, venmoId } = useContext(GlobalContext);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showTotals, setShowTotals] = useState(true);
  const [selectedTip, setSelectedTip] = useState(15);
  const [selectedNickname, setSelectedNickname] = useState(nickname);
  const [state, setState] = useState();
  const socket = useRef();
  const navigate = useNavigate();

  const math = useMemo(() => {
    if (!state) {
      return;
    }
    const taxRate = (state.receipt.tax ?? 0) / state.receipt.subtotal;
    const tip = typeof selectedTip === 'number' ? selectedTip / 100 : 0;
    const everyoneTotal = state.receipt.line_items.reduce((total, item) => {
      return total + item.total ?? 0;
    }, 0);
    const selectedTotal = state.receipt.line_items.reduce((total, item) => {
      if (item.total && state.participants[selectedNickname]?.includes(item.id)) {
        const peopleOnItem = Object.entries(state.participants).filter(p => {
          const [_, items] = p;
          return items.includes(item.id);
        }).length;
        return total + (item.total / peopleOnItem) ?? 0;
      } else {
        return total;
      }
    }, 0);
    const data = {
      taxRate: (taxRate * 100).toFixed(2) + '%',
      tip: (tip * 100).toFixed(0) + '%',
      everyone: {
        subtotal: `$${everyoneTotal.toFixed(2)}`,
        tax: `$${(everyoneTotal * taxRate).toFixed(2)}`,
        tip: `$${(everyoneTotal * tip).toFixed(2)}`,
        total: `$${(everyoneTotal * (1 + taxRate + tip)).toFixed(2)}`,
      },
      selected: {
        subtotal: `$${(selectedTotal).toFixed(2)}`,
        tax: `$${(selectedTotal * taxRate).toFixed(2)}`,
        tip: `$${(selectedTotal * tip).toFixed(2)}`,
        total: `$${(selectedTotal * (1 + taxRate + tip)).toFixed(2)}`,
      },
    };
    return data;
  }, [selectedTip, selectedNickname, state]);

  const emitUpdate = (update) => {
    socket.current?.emit('roomUpdate', {
      roomId,
      update,
    });
  }

  const itemClicked = (itemId) => {
    let itemSet = new Set(state.participants[selectedNickname]);
    if (state.participants[selectedNickname].includes(itemId)) {
      itemSet.delete(itemId);
    } else {
      itemSet.add(itemId);
    }
    emitUpdate({
      participants: {
        ...state.participants,
        [selectedNickname]: [...itemSet],
      }
    });
  }

  const addNewUser = (nickname) => {
    if (state.participants[nickname]) {
      alert(`${nickname} has already been added!`);
      return;
    }
    emitUpdate({
      participants: {
        ...state.participants,
        [nickname]: [],
      }
    });
  }

  useEffect(() => {
    emitUpdate({ tip: selectedTip })
  }, [selectedTip]);

  useEffect(() => {
    if (state) {
      setSelectedTip(state.tip)
    }
  }, [state?.tip]);

  useEffect(() => {
    changeState({ roomId });

    if (!nickname) {
      navigate('/setup');
    }

    socket.current = io(
      process.env.NODE_ENV === 'development' ? constants.baseURL : undefined
    );
  
    socket.current.on("connect", () => {
      socket.current.emit('joinRoom', { roomId, nickname });
    });

    socket.current.on('invalidRoom', () => {
      alert(`${roomId} is not a valid code`);
      navigate('/setup');
    });

    socket.current.on('roomUpdate', (data) => {
      setState((state) => ({
        ...state ?? {},
        ...data,
      }));
      setLoading(false);
    })

    return () => socket.current.close();
  }, []);

  return (
    <>
      <QRInvitePopup show={showInvite} setShow={setShowInvite}/>
      <div style={{
        display: 'flex',
        flex: 1,
        height: '100vh',
        maxHeight: '-webkit-fill-available',
        width: '100vw',
        flexDirection: 'column',
        justifyContent: 'stretch',
        fontSize: 24,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 50,
          borderBottom: 2,
          borderBottomStyle: 'solid',
          borderBottomColor: '#34b27b',
        }}>
          <div style={{
            margin: '0 10px',
          }}>
            Code: {roomId}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            margin: '0 10px',
            gap: 10,
          }}>
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
              }}
              onClick={() => setShowInvite(true)}
            >
              Invite
            </div>
            { state?.venmoId ? (
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
                }}
                onClick={() => window.open(`venmo://paycharge?txn=pay&recipients=${state.venmoId}&amount=${math.selected.total}&note=incorporeal%20penguin%20guts`)}
              >
                Pay
              </div>
            ) : null}
          </div>
        </div>
        {loading || !state ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div className='loader'/>
          </div>
        ) : (
          <>
            <div style={{
              flex: 1,
              overflowY: 'scroll'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                paddingTop: 10,
                paddingLeft: 10,
                paddingRight: 10,
                overflow: 'scroll',
              }}>
                Select the items you ordered or shared:
              </div>
              {state.receipt.line_items.filter(item => item.total).map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    margin: 10,
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: '#3a3a3a',
                    fontSize: 20,
                  }}
                  onClick={() => itemClicked(item.id)}
                >
                  <div style={{
                    display: 'flex',
                    flex: 1,
                    justifyContent: 'space-between',
                  }}>
                    <div>{item.description}</div>
                    <div>${item.total}</div>
                  </div>
                  <div style={{
                    display: 'flex',
                    flex: 1,
                    flexFlow: 'wrap',
                    marginTop: 5,
                    gap: 10,
                  }}>
                    {Object.entries(state.participants).filter(p => {
                      const [_, items] = p;
                      return items.includes(item.id)
                    }).map(p => p[0]).map(name => (
                      <div
                        key={`${item.id}-${name}`}
                        style={{
                          borderColor: '#34b27b',
                          borderRadius: 10,
                          borderWidth: 2,
                          borderStyle: 'solid',
                          color: 'white',
                          backgroundColor: '#34b27b',
                          fontSize: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 5,
                          minWidth: 75,
                        }}
                      >
                        <div style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          maxWidth: 200,
                          textOverflow: 'ellipsis',
                          textAlign: 'center',
                        }}>
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              borderTop: 2,
              borderTopStyle: 'solid',
              borderTopColor: '#34b27b',
              height: 45,
              fontSize: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-evenly',
            }}>
              <div>Tip:</div>
              <input
                style={{
                  borderColor: '#34b27b',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderStyle: 'solid',
                  color: 'white',
                  backgroundColor: '#2e2e2e',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 3,
                  width: 50,
                  textAlign: 'center',
                }}
                type="number"
                inputMode="numeric"
                value={selectedTip}
                onChange={(e) => setSelectedTip(Number(e.target.value.replaceAll(/[^0-9]/g, '').slice(0, 2)))}
              />
              {[15, 18, 20].map(amt => (
                <div
                  key={`tip-${amt}`}
                  style={{
                    borderColor: '#34b27b',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    color: 'white',
                    backgroundColor: selectedTip === amt ? '#34b27b' : '#2e2e2e',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 3,
                    minWidth: 50,
                  }}
                  onClick={() => setSelectedTip(amt)}
                >
                  {amt}%
                </div>
              ))}
              <div
                style={{
                  borderColor: '#34b27b',
                  borderRadius: 10,
                  borderWidth: 2,
                  borderStyle: 'solid',
                  color: 'white',
                  backgroundColor: '#2e2e2e',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 3,
                  minWidth: 50,
                }}
                onClick={() => setShowTotals(!showTotals)}
              >
                {showTotals ? 'Hide' : 'Show'}
              </div>
            </div>
            <div style={{
              display: 'flex',
              width: '100vw',
              borderTop: showTotals ? '2px solid #34b27b' : '0px solid #34b27b',
              fontSize: 18,
              maxHeight: showTotals ? 200 : 0,
              transition: 'max-height 0.5s ease-out, border-width 0.5s linear'
            }}>
              <div style={{
                flex: 1,
                borderRight: 2,
                borderRightStyle: 'solid',
                borderRightColor: '#34b27b',
              }}>
                <div style={{
                  backgroundColor: '#3a3a3a',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '3px 0',
                }}>
                  Everyone's Total
                </div>
                <div style={{ padding: '0 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Subtotal:</div><div style={{ fontFamily: 'monospace' }}>{math.everyone.subtotal}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Tax ({math.taxRate}):</div><div style={{ fontFamily: 'monospace' }}>{math.everyone.tax}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Tip ({math.tip}):</div><div style={{ fontFamily: 'monospace' }}>{math.everyone.tip}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Total:</div><div style={{ fontFamily: 'monospace' }}>{math.everyone.total}</div>
                  </div>
                </div>
              </div>
              <div style={{
                flex: 1,
                width: '50%'
              }}>
                <div style={{
                  backgroundColor: '#3a3a3a',
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '3px 0',
                }}>
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {selectedNickname}'s Total
                  </div>
                </div>
                <div style={{ padding: '0 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Subtotal:</div><div style={{ fontFamily: 'monospace' }}>{math.selected.subtotal}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Tax ({math.taxRate}):</div><div style={{ fontFamily: 'monospace' }}>{math.selected.tax}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Tip ({math.tip}):</div><div style={{ fontFamily: 'monospace' }}>{math.selected.tip}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
                    <div>Total:</div><div style={{ fontFamily: 'monospace' }}>{math.selected.total}</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              height: 65,
              width: '100vw',
              borderTop: 2,
              borderTopStyle: 'solid',
              borderTopColor: '#34b27b',
              backgroundColor: '#1c1c1c',
              overflowX: 'scroll',
            }}>
              {Object.keys(state.participants).map(name => (
                <div
                  key={name}
                  style={{
                    borderColor: '#34b27b',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    color: 'white',
                    backgroundColor: name == selectedNickname ? '#34b27b' : '#2e2e2e',
                    fontSize: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '10px 5px',
                    padding: 5,
                  }}
                  onClick={() => setSelectedNickname(name)}
                >
                  <div style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    minWidth: 70,
                    maxWidth: 120,
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                  }}>
                    {name}
                  </div>
                </div>
              ))}
              <div
                  style={{
                    borderColor: '#34b27b',
                    borderRadius: 10,
                    borderWidth: 2,
                    borderStyle: 'solid',
                    color: 'white',
                    backgroundColor: '#34b27b',
                    fontSize: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '10px 5px',
                    padding: 5,
                    minWidth: 33,
                  }}
                  onClick={() => {
                    let nickname = window.prompt(`What should the new person's name be?`);
                    if (nickname) {
                      addNewUser(nickname)
                    }
                  }
                }
                >
                  <span style={{ marginBottom: 5}}>+</span>
                </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
