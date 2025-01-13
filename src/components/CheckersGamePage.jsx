import React, {useState} from 'react';
import ChessBoard from './ChessBoard.jsx';
import GameControls from './GameControls.jsx';
import '../styles/CheckersGamePage.css';
import {io} from "socket.io-client";

let socket = io('https://gaming-platform.herokuapp.com/', {reconnection: false});

socket.on('connect', () => {
    console.log('Connected to the signaling server');
});

socket.once('connect_error', (error) => {
    console.error('Error connecting to signaling server:', error);
    alert('Error connecting to signaling server: ' + error.message);
    socket.disconnect();
    socket = null;
});

function GamePage() {
    const [playerCount, setPlayerCount] = useState(0);
    const [roomId, setRoomId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [usersInRoom, setUsersInRoom] = useState([]);

    return (
        <div className="CheckersGamePage">
            <ChessBoard isGameReady={playerCount >= 2} roomId={roomId} userId={userId} socket={socket}
                        usersInRoom={usersInRoom}/>
            <div className="game-controls-container">
                <GameControls setPlayerCount={setPlayerCount} setRoomIdExternally={setRoomId}
                              setUserIdExternally={setUserId} socket={socket}
                              setUsersInRoomExternally={setUsersInRoom}/>
            </div>
        </div>
    );
}

export default GamePage;