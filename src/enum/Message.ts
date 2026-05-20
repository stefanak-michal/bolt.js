enum Message {
    // v1
    INIT = 'INIT',
    ACK_FAILURE = 'ACK_FAILURE',
    RESET = 'RESET',
    RUN = 'RUN',
    PULL_ALL = 'PULL_ALL',
    DISCARD_ALL = 'DISCARD_ALL',
    // v3
    HELLO = 'HELLO',
    GOODBYE = 'GOODBYE',
    BEGIN = 'BEGIN',
    COMMIT = 'COMMIT',
    ROLLBACK = 'ROLLBACK',
    // v4
    PULL = 'PULL',
    DISCARD = 'DISCARD',
    // v4.3
    ROUTE = 'ROUTE',
    // v5.1
    LOGON = 'LOGON',
    LOGOFF = 'LOGOFF',
    // v5.4
    TELEMETRY = 'TELEMETRY',
}

export default Message;
