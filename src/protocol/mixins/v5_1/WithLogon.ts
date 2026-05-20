import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';
import AuthToken from '../../AuthToken';

export function WithLogon(this: AProtocol, auth: AuthToken): AProtocol {
    this.send(Message.LOGON, [auth]);
    return this;
}
