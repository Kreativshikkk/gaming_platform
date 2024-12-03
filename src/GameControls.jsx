import React, { useState } from 'react';

function GameControls() {
    const [roomId, setRoomId] = useState('');
    const walletAddress = '0x123...abc';

    const handleCreateRoom = () => {
        console.log('Creating room...');
        setRoomId('12345');
    };

    const handleJoinRoom = () => {
        console.log('Joining room:', roomId);
    };

    return (
        <div>
            <div>Player's account: {walletAddress}</div>
            <button onClick={handleCreateRoom}>Create Room</button>
            {roomId && <div>Room ID: {roomId} - <a href={`/${roomId}`}>Join Room</a></div>}
            <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Enter Room ID" />
            <button onClick={handleJoinRoom}>Join Room</button>
        </div>
    );
}

export default GameControls;