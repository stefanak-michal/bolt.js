import { AProtocol } from './AProtocol';
import { WithReset } from './mixins/v1/WithReset';
import { WithRun } from './mixins/v3/WithRun';
import { WithHello } from './mixins/v4_1/WithHello';
import { WithGoodbye } from './mixins/v3/WithGoodbye';
import { WithBegin } from './mixins/v3/WithBegin';
import { WithCommit } from './mixins/v3/WithCommit';
import { WithRollback } from './mixins/v3/WithRollback';
import { WithPull } from './mixins/v4/WithPull';
import { WithDiscard } from './mixins/v4/WithDiscard';
import { v4Transitions } from './transitions/v4';
import { Packer } from '../packstream/v1/Packer';
import { Unpacker } from '../packstream/v1/Unpacker';
import { IConnection } from '../connection/IConnection';
import ServerState from '../enum/ServerState';
import { unpackStructureMap } from './structures/v1';

// V4.1 and V4.2: same message set as V4.0, no new messages before ROUTE was added in V4.3
interface iVersionedProtocol {
    hello: typeof WithHello;
    goodbye: typeof WithGoodbye;
    reset: typeof WithReset;
    run: typeof WithRun;
    pull: typeof WithPull;
    discard: typeof WithDiscard;
    begin: typeof WithBegin;
    commit: typeof WithCommit;
    rollback: typeof WithRollback;
}

export class V4_1 extends AProtocol implements iVersionedProtocol {
    readonly stateTransitionTable = v4Transitions;
    readonly unpackStructureMap = unpackStructureMap;
    public serverState: ServerState = ServerState.CONNECTED;

    hello = WithHello;
    goodbye = WithGoodbye;
    reset = WithReset;
    run = WithRun;
    pull = WithPull;
    discard = WithDiscard;
    begin = WithBegin;
    commit = WithCommit;
    rollback = WithRollback;

    constructor(connection: IConnection) {
        super(connection, new Packer(), new Unpacker(unpackStructureMap));
        this.serverState = ServerState.CONNECTED;
    }
}
