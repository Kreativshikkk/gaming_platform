import {MessageType} from '../MessageTypes.js';
import {Server} from 'socket.io';

const PORT = 8001;
const MAX_ROOM_USERS = 2;

const rooms = {};
let lastUserId = 0;
let lastRoomId = 0;


class User {
    constructor(userAccount, userBalance, userColor) {
        lastUserId += 1;
        this.userId = lastUserId;
        this.userAccount = userAccount;
        this.userBalance = userBalance;
        this.userColor = userColor;
    }

    getId() {
        return this.userId;
    }
}

// TODO: прописать логику while может срубить -- ходит.

class Room {
    constructor(id, stake) {
        this.available_colors = ['black', 'white'];
        this.stake = stake;
        this.roomId = id;
        this.users = [];
        this.sockets = {};
        this.board = this.generateInitialBoard();
        this.moving = 'white';
    }

    generateInitialBoard() {
        const boardSize = 8;
        const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if ((i + j) % 2 === 1) {
                    if (i < 3) board[i][j] = 'black';
                    else if (i > 4) board[i][j] = 'white';
                }
            }
        }
        return board;
    };

    makeMove(fromRow, fromCol, toRow, toCol) {
        const newBoard = this.board.map(row => [...row]);
        const moveDistance = Math.abs(fromRow - toRow);

        if (moveDistance === 2) {
            const midRow = fromRow + (toRow - fromRow) / 2;
            const midCol = fromCol + (toCol - fromCol) / 2;
            newBoard[midRow][midCol] = null;
        }

        newBoard[fromRow][fromCol] = null;
        newBoard[toRow][toCol] = this.board[fromRow][fromCol];

        this.board = newBoard;

        if (moveDistance === 2 && this.canCaptureMore(toRow, toCol)) {
            this.moving = this.board[toRow][toCol];
        } else {
            this.moving = this.moving === 'white' ? 'black' : 'white';
        }
    };

    canCaptureMore(row, col) {
        return this.isValidMove(row, col, row + 2, col + 2) ||
            this.isValidMove(row, col, row + 2, col - 2) ||
            this.isValidMove(row, col, row - 2, col + 2) ||
            this.isValidMove(row, col, row - 2, col - 2);
    }

    isValidMove(fromRow, fromCol, toRow, toCol) {
        const player = this.board[fromRow][fromCol];
        const enemy = player === 'black' ? 'white' : 'black';

        const canCapture = (row, col) => {
            const boardSize = this.board.length;
            const availableEnemyDirections = [
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ];

            return availableEnemyDirections.some(([dr, dc]) => {
                const enemyRow = row + dr;
                const enemyCol = col + dc;
                const landingRow = row + 2 * dr;
                const landingCol = col + 2 * dc;

                return enemyRow >= 0 && enemyRow < boardSize && enemyCol >= 0 && enemyCol < boardSize &&
                    landingRow >= 0 && landingRow < boardSize && landingCol >= 0 && landingCol < boardSize &&
                    this.board[enemyRow][enemyCol] === enemy && this.board[landingRow][landingCol] === null;
            });
        };

        const canReachAfterCaptures = (row, col, toRow, toCol) => {
            const boardSize = this.board.length;
            const availableEnemyDirections = [
                [1, 1], [1, -1], [-1, 1], [-1, -1]
            ];

            const afterCapturingPossiblePositions = [];

            availableEnemyDirections.forEach(([dr, dc]) => {
                const enemyRow = row + dr;
                const enemyCol = col + dc;
                const landingRow = row + 2 * dr;
                const landingCol = col + 2 * dc;

                if (enemyRow >= 0 && enemyRow < boardSize && enemyCol >= 0 && enemyCol < boardSize &&
                    landingRow >= 0 && landingRow < boardSize && landingCol >= 0 && landingCol < boardSize &&
                    this.board[enemyRow][enemyCol] === enemy && this.board[landingRow][landingCol] === null) {
                    afterCapturingPossiblePositions.push([landingRow, landingCol]);
                }
            });

            return afterCapturingPossiblePositions.some(([newRow, newCol]) => {
                return newRow === toRow && newCol === toCol;
            });
        };

        const mustCapture = this.board.some((row, i) =>
            row.some((cell, j) => cell === player && canCapture(i, j))
        );

        if (mustCapture) {
            return canReachAfterCaptures(fromRow, fromCol, toRow, toCol);
        }

        if (player === 'black') {
            return (toRow - fromRow === 1 && Math.abs(fromCol - toCol) === 1 && this.board[toRow][toCol] === null)
        }
        if (player === 'white') {
            return (fromRow - toRow === 1 && Math.abs(fromCol - toCol) === 1 && this.board[toRow][toCol] === null)
        }
    }

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
        return this.usersAmount() === 0;
    }

    addUser(user, socket) {
        this.users.push(user);
        this.sockets[user.getId()] = socket;
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
            user = new User(data.userAccount, data.balance);
        }

        if (data.roomId && rooms[data.roomId]) {
            room = rooms[data.roomId];
            if (room.stake > data.balance) {
                socket.emit(MessageType.ERROR_INSUFFICIENT_FUNDS, {error: `User has insufficient funds, stake in this room: ${room.stake} ETH`});
                return;
            }
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
            room.removeUser(user.getId());
            console.log('User %d left room %s. Users in room: %d',
                user.getId(), room.getRoomId(), room.usersAmount());
            if (room.isEmpty()) {
                console.log('Room is empty - dropping room %d', room.getRoomId());
                delete rooms[room.getRoomId()];
            } else {
                room.sendAll(user, MessageType.USER_LEAVE, {userId: user.getId(), users: room.getUsers()});
            }
        }
    }

    socket.on(MessageType.MAKE_MOVE, function (data) {
        room = getExistingOrCreateNewRoom(data.roomId);
        user = room.getUserById(data.userId);
        if (room && user) {
            if (room.getUserById(data.userId).userColor !== room.board[data.fromRow][data.fromCol]) {
                return;
            }
            if (room.isValidMove(data.fromRow, data.fromCol, data.toRow, data.toCol)) {
                console.log("Making move in room...");
                room.makeMove(data.fromRow, data.fromCol, data.toRow, data.toCol);
            } else {
                room.sendToId(user.userId, MessageType.INVALID_MOVE, {error: 'Invalid move'});
            }
            console.log("Sending updated board...");
            room.broadcastToAll(MessageType.UPDATE_BOARD, {
                board: room.board,
                color: user.userColor,
                moving: room.moving
            });
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
    });
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
