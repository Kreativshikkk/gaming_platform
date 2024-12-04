export const MessageType = {
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