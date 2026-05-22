import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithBegin(this: AProtocol, extra: object = {}): AProtocol {
    this.send(Message.BEGIN, [extra]);
    return this;
}
