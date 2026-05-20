import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithDiscardAll(this: AProtocol): AProtocol {
    this.send(Message.DISCARD_ALL, []);
    return this;
}
