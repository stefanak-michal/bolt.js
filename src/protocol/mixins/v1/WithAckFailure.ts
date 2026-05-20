import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithAckFailure(this: AProtocol): AProtocol {
    this.send(Message.ACK_FAILURE, []);
    return this;
}
