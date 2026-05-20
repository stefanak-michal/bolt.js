import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';
import AuthToken from '../../AuthToken';
import pkg from '../../../../package.json';

export function WithInit(this: AProtocol, userAgent: string | null, authToken: AuthToken): AProtocol {
    if (!userAgent) userAgent = 'bolt.js/' + pkg.version;
    this.send(Message.INIT, [userAgent, authToken]);
    return this;
}
