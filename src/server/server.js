import {MessageType} from '../client/MessageTypes.js';
import {Server} from 'socket.io';
import {Man} from './CheckersStructure.js';
import userService from './userService.js';

const PORT = 8001;
const MAX_ROOM_USERS = 2;

const rooms = {};
let lastRoomId = 0;


class User {
    constructor(userId, userAccount, userBalance, userColor) {
        this.userId = userId;
        this.userAccount = userAccount;
        this.userBalance = userBalance;
        this.userColor = userColor;
        this.connected = true;
    }

    getId() {
        return this.userId;
    }
}

class Room {
    constructor(id, stake) {
        this.available_colors = ['black', 'white'];
        this.stake = stake;
        this.roomId = id;
        this.users = [];
        this.sockets = {};
        this.board = this.generateInitialBoard();
        this.moving = 'white';
        this.timeLeft = 120;
        this.timerId = null;
    }

    generateInitialBoard() {
        const boardSize = 8;
        const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if ((i + j) % 2 === 1) {
                    if (i < 3) board[i][j] = new Man('black', i, j);
                    else if (i > 4) board[i][j] = new Man('white', i, j);
                }
            }
        }
        return board;
    };

    assignColor() {
        if (this.users.length === 0) {
            const index = Math.random() > 0.5 ? 1 : 0;
            const color = this.available_colors[index];
            this.available_colors.splice(index, 1);
            return color;
        }
        if (this.users.length === 1) {
            const color = this.available_colors[0];
            this.available_colors.splice(0, 1);
            return color;
        }
    }

    getRoomId() {
        return this.roomId;
    }

    getUsers() {
        return this.users;
    }

    getUserById(id) {
        return this.users.find(function (user) {
            return user.getId() === id
        });
    }

    usersAmount() {
        return this.users.length;
    }

    isEmpty() {
        return this.usersAmount() === 0; //
    }

    addUser(user, socket) {
        this.users.push(user);
        this.sockets[user.getId()] = socket;
    }

    setUserDisconnected(id) {
        const usr = this.getUserById(id);
        if (usr) {
            usr.connected = false;
        }
    }

    setUserReconnected(id, socket) {
        const usr = this.getUserById(id);
        if (usr) {
            usr.connected = true;
        }
        if (socket) {
            this.sockets[id] = socket;
        }
    }

    startTimer() {
        // If there is already a timer, reset it first
        this.stopTimer();

        this.timeLeft = 120;

        this.timerId = setInterval(() => {
            this.timeLeft--;
            // Send the current time to all sockets in the room
            this.broadcastToAll(MessageType.TIMER, {
                timeLeft: this.timeLeft,
                moving: this.moving
            });

            if (this.timeLeft <= 0) {
                this.stopTimer();
                this.broadcastToAll(MessageType.GAME_OVER, {
                    reason: 'time_is_up',
                    loserColor: this.moving
                });
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
    }


    removeUser(id) {
        if (this.getUserById(id)) {
            this.available_colors.push(this.getUserById(id).userColor);
        }
        this.users = this.users.filter(function (user) {
            return user.getId() !== id
        });
        delete this.sockets[id];
    }

    sendTo(user, message, data) {
        let socket = this.sockets[user.getId()];
        if (socket) {
            socket.emit(message, data);
        }
    }

    sendToId(id, message, data) {
        this.sendTo(this.getUserById(id), message, data);
    }

    sendAll(sender, message, data) {
        this.users.forEach(function (user) {
            if (user.getId() !== sender.getId()) {
                this.sendTo(user, message, data);
            }
        }, this);
    }

    broadcastToAll(message, data) {
        this.users.forEach(function (user) {
            this.sendTo(user, message, data);
        }, this);
    }
}

function handleSocket(socket) {
    let user;
    let room;

    socket.on(MessageType.JOIN, function (data) {
        if (!user) {
            let userId = userService.findUserByWallet(data.userAccount);
            if (userId) {
                user = new User(userId, data.userAccount, data.balance);
            } else {
                userId = userService.addUser(data.userAccount);
                user = new User(userId, data.userAccount, data.balance);
            }

        }

        if (data.roomId && rooms[data.roomId]) {
            room = rooms[data.roomId];
            if (room.stake > data.balance) {
                socket.emit(MessageType.ERROR_INSUFFICIENT_FUNDS, {error: `User has insufficient funds, stake in this room: ${room.stake} ETH`});
                return;
            }
        } else if (data.stake > data.balance) {
            socket.emit(MessageType.ERROR_INSUFFICIENT_FUNDS, {error: `User has insufficient funds`});
            return;
        }

        const existingUser = room?.getUserById(user.getId());
        if (existingUser) {
            socket.emit(MessageType.STAKE, {stake: room.stake});
            room.setUserReconnected(user.getId(), socket);

            room.broadcastToAll(MessageType.ROOM, {
                roomId: room.getRoomId(),
                userId: user.getId(),
                users: room.getUsers(),
                moving: room.moving
            });
            // send the current board/timer state to this socket only

            socket.emit(MessageType.UPDATE_BOARD, {
                board: room.board,
                color: user.userColor,
                moving: room.moving,
                reconnect: true
            });

            socket.emit(MessageType.TIMER, {
                timeLeft: room.timeLeft,
                moving: room.moving
            });
            return;
        }


        room = getExistingOrCreateNewRoom(data.roomId, data.stake);
        user.userColor = room.assignColor();

        if (room.usersAmount() >= MAX_ROOM_USERS) {
            socket.emit(MessageType.ERROR_ROOM_IS_FULL, {error: "Room is full"});
            return;
        }

        room.addUser(user, socket);
        room.broadcastToAll(
            MessageType.ROOM, {
                roomId: room.getRoomId(),
                userId: user.getId(),
                users: room.getUsers(),
                moving: room.moving
            });

        if (room.usersAmount() === 2) {
            room.startTimer();
        }

        console.log('User %s joined room %d. His color is %s. Users in room: %d',
            user.getId(), room.getRoomId(), user.userColor, room.usersAmount());
    });

    function getExistingOrCreateNewRoom(roomId, stake) {
        if (!roomId) {
            roomId = ++lastRoomId;
        }
        room = rooms[roomId];
        if (room) {
            socket.emit(MessageType.STAKE, {stake: room.stake});
        }
        if (!room) {
            room = new Room(roomId, stake);
            rooms[roomId] = room;
        }
        return room;
    }

    function disconnection() {
        if (room) {
            room.setUserDisconnected(user.getId());
            console.log(
                'User %d DISCONNECTED from room %d. (mark disconnected) Users in room still: %d',
                user.getId(), room.getRoomId(), room.usersAmount()
            );

            room.sendAll(user, MessageType.USER_LEAVE, {
                userId: user.getId(),
                users: room.getUsers()
            });


            // this we need delete maybe
            if (room.isEmpty()) {
                console.log('Room %d is empty - dropping it.', room.getRoomId());
                room.stopTimer(); // тоже важно остановить интервал
                delete rooms[room.getRoomId()];
            }
        }
    }

    socket.on(MessageType.MAKE_MOVE, function (data) {
        room = getExistingOrCreateNewRoom(data.roomId);
        user = room.getUserById(data.userId);
        if (room && user) {
            if (room.getUserById(data.userId).userColor !== room.board[data.fromRow][data.fromCol].color) {
                return;
            }

            const piece = room.board[data.fromRow][data.fromCol];
            console.log("Piece initialized...");

            if (piece.isValidMove(data.fromRow, data.fromCol, data.toRow, data.toCol, room.board)) {
                console.log("Making move in room...");
                data = piece.makeMove(data.fromRow, data.fromCol, data.toRow, data.toCol, room.board);
                room.board = data.board;
                room.moving = data.moving;

                room.startTimer();

                room.broadcastToAll(MessageType.TIMER, {
                    timeLeft: room.timeLeft,
                    moving: room.moving
                });

                room.broadcastToAll(MessageType.UPDATE_BOARD, {
                    board: room.board,
                    color: user.userColor,
                    moving: room.moving,
                    reconnect: false
                });

            } else {
                room.sendToId(user.userId, MessageType.INVALID_MOVE, {error: 'Invalid move'});
            }
            console.log("Sending updated board...");
        }
    });

    socket.on(MessageType.DISCONNECT, disconnection);

    socket.on(MessageType.CUSTOM_DISCONNECT, disconnection);

    socket.on(MessageType.SDP, function (data) {
        if (room) {
            room.sendToId(data.target, MessageType.SDP, {userId: user.getId(), sdp: data.sdp});
        }
    });

    socket.on(MessageType.ICE_CANDIDATE, function (data) {
        if (room) {
            room.sendToId(data.target, MessageType.ICE_CANDIDATE, {userId: user.getId(), candidate: data.candidate});
        }
    });//we don't need this
}

const io = new Server(PORT, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.on('connection', handleSocket);
console.log('Signalling server is running on port %d', PORT);
