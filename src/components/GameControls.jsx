import React, {useContext, useEffect, useState} from 'react';
import '../styles/GameControls.css';
import {io} from "socket.io-client";
import {MessageType} from "../MessageTypes.js";
import {WalletContext} from "../WalletContext.js";

let socket = io('http://localhost:8001', {reconnection: false});

socket.on('connect', () => {
    console.log('Connected to the signaling server');
});

socket.once('connect_error', (error) => {
    console.error('Error connecting to signaling server:', error);
    alert('Error connecting to signaling server: ' + error.message);
    socket.disconnect();
    socket = null;
});


function GameControls() {
    const [stake, setStake] = useState(0);
    const {connectionState, userAccount, balance} = useContext(WalletContext);
    const [roomId, setRoomId] = useState(0);
    const [userId, setUserId] = useState(null);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const onRoomConnected = (data) => {
            if (userId === null) {
                setUserId(data.userId);
                console.log(`new user id ${data.userId}`);
            }
            setRoomId(data.roomId);
            setUsersInRoom(data.users);
            console.log('Connected to room:', data.roomId);
        };

        socket.on(MessageType.ROOM, onRoomConnected);

        return () => {
            socket.off(MessageType.ROOM, onRoomConnected);
        };
    }, [userId]);


    useEffect(() => {
        const userDisconnected = (data) => {
            setUsersInRoom(data.users);
            console.log(`User ${data.userId} disconnected`);
        };

        socket.on(MessageType.USER_LEAVE, userDisconnected);

        return () => {
            socket.off(MessageType.USER_LEAVE, userDisconnected);
        };
    }, [userId]);

    const handleCreateRoom = () => {
        if (connectionState !== 'connected') {
            alert('Please connect your wallet first.');
            return;
        }

        if (stake === 0) {
            alert('Please set your stake.');
            return;
        }

        if (stake > balance) {
            alert('Insufficient funds');
            return;
        }

        console.log('Creating room...');

        socket.emit(MessageType.JOIN, {roomId: '', userAccount: userAccount, balance: balance, stake: stake});

        const onError = (data) => {
            console.error('Error connecting to room:', data.error);
            alert('Error connecting to room: ' + data.error);
        };

        socket.once(MessageType.ERROR_ROOM_IS_FULL, onError);
        socket.once(MessageType.ERROR_USER_INITIALIZED, onError);
    };

    const handleJoinRoom = () => {
        if (connectionState !== 'connected') {
            alert('Please connect your wallet first.');
            return;
        }

        console.log('Joining room...');

        socket.emit(MessageType.JOIN, {roomId: roomId, userAccount: userAccount, balance: balance, stake: stake});

        const onError = (data) => {
            console.error('Error connecting to room:', data.error);
            alert('Error connecting to room: ' + data.error);
        };

        const gotStake = (data) => {
            setStake(data.stake);
        };


        socket.once(MessageType.STAKE, gotStake);
        socket.once(MessageType.ERROR_ROOM_IS_FULL, onError);
        socket.once(MessageType.ERROR_USER_INITIALIZED, onError);
        socket.once(MessageType.ERROR_INSUFFICIENT_FUNDS, onError);
    };

    const handleJoinRoomButton = () => {
        setIsJoining(true);
    };

    const handleStopConnection = () => {
        setIsJoining(false);
    };

    const handleInputChange = (event) => {
        setRoomId(event.target.value);
    };

    const handleInputKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleJoinRoom();
            setIsJoining(false);
        }
    };

    const handleConnectButton = () => {
        handleJoinRoom();
        setIsJoining(false);
    };

    const handleDisconnectButton = () => {
        console.log(`Disconnected from room ${roomId}`);
        setStake(0);
        setRoomId(null);
        setUsersInRoom([]);
        socket.emit(MessageType.CUSTOM_DISCONNECT);
    };

    let content;
    if (usersInRoom.length === 0) {
        content = (
            <>
                <button onClick={handleCreateRoom}>
                    <span className="icon">🔗 </span>
                    <span>Create Room</span>
                </button>

                {isJoining ? (
                    <>
                        <input
                            type="text"
                            placeholder="Enter Room ID"
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyPress}
                        />
                        <button className="connect-button" onClick={handleConnectButton}>
                            Connect
                        </button>
                        <button className="stop-button" onClick={handleStopConnection}>
                            Stop Connection
                        </button>
                    </>
                ) : (
                    <button onClick={handleJoinRoomButton}>
                        <span className="icon">➕ </span>
                        <span>Join Room</span>
                    </button>
                )}
                <input
                    className="stake-input"
                    type="text"
                    placeholder="Set your stake"
                    onChange={(event) => setStake(event.target.value)}
                />
            </>
        )
    } else if (usersInRoom.length === 1) {
        content = (
            <>
                <h3>Room ID: {roomId}</h3>
                <h3>Waiting for another player...</h3>
                <button className="disconnect-button" onClick={handleDisconnectButton}>
                    Disconnect
                </button>
            </>
        )
    } else if (usersInRoom.length === 2) {
        let you = usersInRoom.find(user => user.userId === userId);
        let opponent = usersInRoom.find(user => user.userId !== userId);
        content = (
            <div className="centered-container">
                <h2>Room ID: {roomId}</h2>
                <h2>Stake: {stake} ETH</h2>
                <h2>Your account: {you.userAccount.slice(0, 2)}...{you.userAccount.slice(-4)}</h2>
                <h2>Your balance: {parseFloat(you.userBalance).toFixed(3)} ETH</h2>
                <h2>Opponent's account: {opponent.userAccount.slice(0, 2)}...{opponent.userAccount.slice(-4)}</h2>
                <button className="disconnect-button" onClick={handleDisconnectButton}>
                    Disconnect
                </button>
            </div>)
    }

    return (
        <div className="game-controls">
            <h1>Play Checkers</h1>
            {content}
        </div>
    );
}

export default GameControls;