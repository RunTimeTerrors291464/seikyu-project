const Sequencer = require('@jest/test-sequencer').default;
const path = require('path');

/**
 * Custom sequencer to run integration tests in the correct order.
 * Order is determined by the numeric prefix in each filename:
 *   01-users.integration-spec.ts    -> runs first
 *   02-products.integration-spec.ts -> runs second
 *   ...
 */
class IntegrationSequencer extends Sequencer {
    sort(tests) {
        return [...tests].sort((a, b) => {
            const aNum = parseInt(path.basename(a.path).match(/^(\d+)/)?.[1] ?? '999');
            const bNum = parseInt(path.basename(b.path).match(/^(\d+)/)?.[1] ?? '999');
            return aNum - bNum;
        });
    }
}

module.exports = IntegrationSequencer;
