import React, {useContext, useEffect, useState} from 'react';
import '../styles/GameControls.css';
import {MessageType} from "../MessageTypes.js";
import {WalletContext} from "../WalletContext.js";
import toastService from "./toastService.jsx";


function GameControls({setPlayerCount, setRoomIdExternally, setUserIdExternally, socket, setUsersInRoomExternally}) {
    const [stake, setStake] = useState(0);
    const {connectionState, userAccount, balance} = useContext(WalletContext);
    const [roomId, setRoomId] = useState(0);
    const [userId, setUserId] = useState(null);
    const [usersInRoom, setUsersInRoom] = useState([]);
    const [isJoining, setIsJoining] = useState(false);

    const [timeLeft, setTimeLeft] = useState(120);
    const [moving, setMoving] = useState('white');
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        setPlayerCount(usersInRoom.length);
        if (usersInRoom.length !== 2) {
            setGameOver(false); // costil'
        }
    }, [usersInRoom, setPlayerCount]);

    useEffect(() => {
        setRoomIdExternally(roomId)
    }, [roomId, setRoomIdExternally]);

    useEffect(() => {
        setUserIdExternally(userId)
    }, [userId, setUserIdExternally]);

    useEffect(() => {
        const onRoomConnected = (data) => {
            if (userId === null) {
                setUserId(data.userId);
                console.log(`new user id ${data.userId}`);
            }
            setRoomId(data.roomId);
            setUsersInRoom(data.users);
            setUsersInRoomExternally(data.users);
            setMoving(data.moving);
            console.log('Connected to room:', data.roomId);
        };

        socket.on(MessageType.ROOM, onRoomConnected);

        return () => {
            socket.off(MessageType.ROOM, onRoomConnected);
        };
    }, [userId, socket, setUsersInRoomExternally]);


    //maybe we need modify it
    useEffect(() => {
        const userDisconnected = (data) => {
            setUsersInRoom(data.users);
            console.log(`User ${data.userId} disconnected`);
        };

        socket.on(MessageType.USER_LEAVE, userDisconnected);

        return () => {
            socket.off(MessageType.USER_LEAVE, userDisconnected);
        };
    }, [userId, socket]);

    useEffect(() => {
        const onOpponentDisconnection = (data) => {
            setUsersInRoom(data.users);
            toastService.info('Opponent disconnected. Waiting for recconection...');
        }

        socket.on(MessageType.OPPONENT_DISCONNECTED, onOpponentDisconnection);

        return () => {
            socket.off(MessageType.OPPONENT_DISCONNECTED, onOpponentDisconnection);
        }
    }, [socket]);


    //timer and game over due to timer
    useEffect(() => {
        const onTimer = (data) => {
            setTimeLeft(data.timeLeft);
            setMoving(data.moving);
        };
        socket.on(MessageType.TIMER, onTimer);

        return () => {
            socket.off(MessageType.TIMER, onTimer);
        };
    }, [socket]);

    //game over
    useEffect(() => {
        const onGameOver = (data) => {
            setGameOver(true);
            setRoomId(null);
            setUsersInRoom([]);
            toastService.info(`Game over: ${data.loserColor} loses! ${data.reason}`);
            setWinner(data.loserColor === 'black' ? 'White' : 'Black');
        }

        socket.on(MessageType.GAME_OVER, onGameOver);

        return () => {
            socket.off(MessageType.GAME_OVER, onGameOver);
        }
    }, [socket]);

    const formatTime = (totalSeconds) => {
        const mm = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const ss = String(totalSeconds % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const handleCreateRoom = () => {
        if (connectionState !== 'connected') {
            toastService.error('Please connect your wallet first.');
            return;
        }

        if (stake === 0) {
            toastService.error('Please set your stake.');
            return;
        }

        if (stake > balance) {
            toastService.error('Insufficient funds');
            return;
        }

        console.log('Creating room...');

        socket.emit(MessageType.JOIN, {
            roomId: '',
            userAccount: userAccount,
            balance: balance,
            stake: stake,
        });

        const onError = (data) => {
            console.error('Error connecting to room:', data.error);
            toastService.error('Error connecting to room: ' + data.error);
        };

        socket.once(MessageType.ERROR_ROOM_IS_FULL, onError);
        socket.once(MessageType.ERROR_USER_INITIALIZED, onError);
    };

    const handleJoinRoom = () => {
        if (connectionState !== 'connected') {
            toastService.error('Please connect your wallet first.');
            return;
        }

        console.log('Joining room...');


        socket.emit(MessageType.JOIN, {
            roomId: roomId,
            userAccount: userAccount,
            balance: balance,
            stake: stake
        });

        const onError = (data) => {
            console.error('Error connecting to room:', data.error);
            toastService.error('Error connecting to room: ' + data.error);
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

            {!gameOver && (usersInRoom.length === 2) && (
                <div className="timer-container">
                    <span className="timer-label">Time left:</span>{" "}
                    {formatTime(timeLeft)}{" "}
                    <span className="moving-label">(moving: {moving})</span>
                </div>
            )}
            {gameOver && (usersInRoom.length === 2) && (
                <div className="timer-container">
                    <span className="timer-label">Game over! {winner} wins!</span>
                </div>
            )}

            {content}
        </div>
    );
}

export default GameControls;