import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';
import pkg from '../../../../package.json';

interface HelloExtra {
    user_agent?: string;
    routing?: object;
    notifications_minimum_severity?: string;
    notifications_disabled_categories?: string[];
}

export function WithHello(this: AProtocol, extra: HelloExtra = {} as HelloExtra): AProtocol {
    if (!extra.user_agent) extra = { ...extra, user_agent: 'bolt.js/' + pkg.version };
    if (!extra.routing) extra = { ...extra, routing: {} };
    this.send(Message.HELLO, [extra]);
    return this;
}
