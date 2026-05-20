import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithReset(this: AProtocol): AProtocol {
    this.send(Message.RESET, []);
    return this;
}
