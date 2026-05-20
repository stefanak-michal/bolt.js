import pkg from '../../../../package.json';
import { AProtocol } from '../../AProtocol';
import Message from '../../../enum/Message';

function buildBoltAgent(): Record<string, string> {
    const agent: Record<string, string> = {
        product: `js-bolt-driver/${pkg.version}`,
        language: 'JavaScript',
    };
    if (typeof process !== 'undefined' && process.versions?.node) {
        agent.platform = `${process.platform}; ${process.arch}`;
        agent.language_details = `Node.js/${process.versions.node}`;
    } else if (typeof navigator !== 'undefined' && navigator.platform) {
        agent.platform = navigator.platform;
    }
    return agent;
}

const BOLT_AGENT = buildBoltAgent();

interface HelloExtra {
    user_agent?: string;
    routing?: object;
    notifications_minimum_severity?: string;
    notifications_disabled_categories?: string[];
}

// v5.3+: HELLO includes bolt_agent (fixed, not user-configurable)
export function WithHello(this: AProtocol, extra: HelloExtra = {} as HelloExtra): AProtocol {
    if (!extra.user_agent) extra = { ...extra, user_agent: 'bolt.js/' + pkg.version };
    if (!extra.routing) extra = { ...extra, routing: {} };
    this.send(Message.HELLO, [{ ...extra, bolt_agent: BOLT_AGENT }]);
    return this;
}
