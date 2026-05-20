import Message from '../../enum/Message';
import Signature from '../../enum/Signature';
import ServerState from '../../enum/ServerState';

export interface StateTransition {
    from: ServerState;
    message: Message;
    response: Signature;
    to: ServerState;
}
