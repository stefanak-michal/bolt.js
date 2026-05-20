import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';
import AuthToken from '../../AuthToken';
import pkg from '../../../../package.json';

interface HelloExtra {
    user_agent?: string;
    auth_token: AuthToken;
}

export function WithHello(this: AProtocol, extra: HelloExtra = {} as HelloExtra): AProtocol {
    if (!extra.user_agent) extra = { ...extra, user_agent: 'bolt.js/' + pkg.version };
    this.send(Message.HELLO, [extra]);
    return this;
}
