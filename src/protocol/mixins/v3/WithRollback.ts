import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

export function WithRollback(this: AProtocol): AProtocol {
    this.send(Message.ROLLBACK, []);
    return this;
}
