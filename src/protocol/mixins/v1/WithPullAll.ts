import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithPullAll(this: AProtocol): AProtocol {
    this.send(Message.PULL_ALL, []);
    return this;
}
