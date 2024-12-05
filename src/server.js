import { MessageType } from './MessageTypes.js';
import { Server } from 'socket.io';

const PORT = 8001;
const MAX_ROOM_USERS = 2;

const rooms = {};
let lastUserId = 0;
let lastRoomId = 0;


class User {
    constructor(userAccount, userBalance) {
        lastUserId += 1;
        this.userId = lastUserId;
        this.userAccount = userAccount;
        this.userBalance = userBalance;
    }

    getId() {
        return this.userId;
    }
}

class Room {
    constructor(id, stake) {
        this.stake = stake;
        this.roomId = id;
        this.users = [];
        this.sockets = {};
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

    BroadcastToAll(message, data) {
        this.users.forEach(function (user) {
                this.sendTo(user, message, data);
        }, this);
    }
}

function handleSocket(socket) {
    let user = null;
    let room = null;

    socket.on(MessageType.JOIN, function (data) {
        // if (user !== null || room !== null) {
        //     room.sendTo(user, MessageType.ERROR_USER_INITIALIZED, {error: "User already initialized"});
        //     return;
        // }

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

        if (room.usersAmount() >= MAX_ROOM_USERS) {
            socket.emit(MessageType.ERROR_ROOM_IS_FULL, {error: "Room is full"});
            return;
        }

        room.addUser(user, socket);
        room.BroadcastToAll(
            MessageType.ROOM, {
                roomId: room.getRoomId(),
                userId: user.getId(),
                users: room.getUsers()
            });

        console.log('User %s joined room %d. Users in room: %d',
            user.getId(), room.getRoomId(), room.usersAmount());
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

    socket.on(MessageType.DISCONNECT, function () {
        if (room) {
            room.removeUser(user.getId());
            console.log('User %d left room %s. Users in room: %d',
                user.getId(), room.getRoomId(), room.usersAmount());
            if (room.isEmpty()) {
                console.log('Room is empty - dropping room %d', room.getRoomId());
                delete rooms[room.getRoomId()];
            } else {
                room.sendAll(user, MessageType.USER_LEAVE, user.getId());
            }
        }
    });

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
