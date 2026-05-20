import { AProtocol } from './AProtocol';
import { WithReset } from './mixins/v1/WithReset';
import { WithPullAll } from './mixins/v1/WithPullAll';
import { WithDiscardAll } from './mixins/v1/WithDiscardAll';
import { WithRun } from './mixins/v3/WithRun';
import { WithHello } from './mixins/v3/WithHello';
import { WithGoodbye } from './mixins/v3/WithGoodbye';
import { WithBegin } from './mixins/v3/WithBegin';
import { WithCommit } from './mixins/v3/WithCommit';
import { WithRollback } from './mixins/v3/WithRollback';
import { v3Transitions } from './transitions/v3';
import { Packer } from '../packstream/v1/Packer';
import { Unpacker } from '../packstream/v1/Unpacker';
import { IConnection } from '../connection/IConnection';
import ServerState from '../enum/ServerState';
import { unpackStructureMap } from './structures/v1';

interface iVersionedProtocol {
    hello: typeof WithHello;
    goodbye: typeof WithGoodbye;
    reset: typeof WithReset;
    run: typeof WithRun;
    pullAll: typeof WithPullAll;
    discardAll: typeof WithDiscardAll;
    begin: typeof WithBegin;
    commit: typeof WithCommit;
    rollback: typeof WithRollback;
}

export class V3 extends AProtocol implements iVersionedProtocol {
    readonly stateTransitionTable = v3Transitions;
    readonly unpackStructureMap = unpackStructureMap;
    public serverState: ServerState = ServerState.CONNECTED;

    hello = WithHello;
    goodbye = WithGoodbye;
    reset = WithReset;
    run = WithRun;
    pullAll = WithPullAll;
    discardAll = WithDiscardAll;
    begin = WithBegin;
    commit = WithCommit;
    rollback = WithRollback;

    constructor(connection: IConnection) {
        super(connection, new Packer(), new Unpacker(unpackStructureMap));
        this.serverState = ServerState.CONNECTED;
    }
}
