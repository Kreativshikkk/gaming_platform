export const MessageType = {
    // A messages you send to server, when want to join or leave etc.
    JOIN: 'join',
    DISCONNECT: 'disconnect',
    CUSTOM_DISCONNECT: 'custom_disconnect',

    // You receive room info as a response for join command. It contains information about
    // the room you joined, and it's users
    ROOM: 'room',

    // When you join the room you get stake of this room
    STAKE: 'stake',

    // A messages you receive from server when another user want to join or leave etc.
    USER_JOIN: 'user_join',
    USER_READY: 'user_ready',
    USER_LEAVE: 'user_leave',

    // WebRtc signalling info, session and ice-framework related - deprecated
    SDP: 'sdp',
    ICE_CANDIDATE: 'ice_candidate',

    // Errors... shit happens
    ERROR_ROOM_IS_FULL: 'error_room_is_full',
    ERROR_USER_INITIALIZED: 'error_user_initialized',
    ERROR_INSUFFICIENT_FUNDS: 'error_insufficient_funds',

    // Checkers game process
    TIMER: 'timer',
    GAME_OVER: 'game_over',
    UPDATE_BOARD: 'update_board',
    MAKE_MOVE: 'make_move',
    INVALID_MOVE: 'invalid_move',
    MOVE_TURN: 'move_turn'
};