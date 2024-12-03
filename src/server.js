const PORT = 8001;
const MAX_ROOM_USERS = 2;

const io = require('socket.io')(PORT);

const rooms = {};
let lastUserId = 0;
let lastRoomId = 0;

const MessageType = {
    // A messages you send to server, when want to join or leave etc.
    JOIN: 'join',
    DISCONNECT: 'disconnect',

    // You receive room info as a response for join command. It contains information about
    // the room you joined, and it's users
    ROOM: 'room',

    // A messages you receive from server when another user want to join or leave etc.
    USER_JOIN: 'user_join',
    USER_READY: 'user_ready',
    USER_LEAVE: 'user_leave',

    // WebRtc signalling info, session and ice-framework related
    SDP: 'sdp',
    ICE_CANDIDATE: 'ice_candidate',

    // Errors... shit happens
    ERROR_ROOM_IS_FULL: 'error_room_is_full',
    ERROR_USER_INITIALIZED: 'error_user_initialized'
};

class User {
    constructor() {
        lastUserId += 1;
        this.userId = lastUserId;
    }

    getId() {
        return this.userId;
    }
}

class Room {
    constructor(id) {
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
        this.users.filter(function (user) {
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
}

function handleSocket(socket) {
    let user = null;
    let room = null;

    socket.on(MessageType.JOIN, function (data) {

        if (user !== null || room !== null) {
            room.sendTo(user, MessageType.ERROR_USER_INITIALIZED);
            return;
        }

        room = getExistingOrCreateNewRoom(data.roomId);
        user = new User();

        if (room.usersAmount() >= MAX_ROOM_USERS) {
            room.sendTo(user, MessageType.ERROR_ROOM_IS_FULL);
            return;
        }

        room.addUser(user, socket);
        room.sendTo(user,
            MessageType.ROOM, {
                roomId: room.getRoomId(),
                userId: user.getId(),
                users: room.getUsers()
            });

        room.sendAll(user, MessageType.USER_JOIN,
            {
                userId: user.getId(),
                users: room.getUsers()
            });

        console.log('User %s joined room %d. Users in room: %d',
            user.getId(), room.getRoomId(), room.usersAmount());
    });

    function getExistingOrCreateNewRoom(roomId) {
        if (!roomId) {
            roomId = ++lastRoomId;
        }
        room = rooms[roomId];
        if (!room) {
            room = new Room(roomId);
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

io.on('connection', handleSocket);
console.log('Signalling server is running on port %d', PORT);
