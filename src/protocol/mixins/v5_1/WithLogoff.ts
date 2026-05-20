import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithLogoff(this: AProtocol): AProtocol {
    this.send(Message.LOGOFF, []);
    return this;
}
