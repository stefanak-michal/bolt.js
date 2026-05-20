import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithCommit(this: AProtocol): AProtocol {
    this.send(Message.COMMIT, []);
    return this;
}
