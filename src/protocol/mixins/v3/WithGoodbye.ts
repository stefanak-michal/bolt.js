import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithGoodbye(this: AProtocol): AProtocol {
    this.send(Message.GOODBYE, []);
    return this;
}
