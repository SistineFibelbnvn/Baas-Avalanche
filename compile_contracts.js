const solc = require('solc');

const SimpleStorage = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract SimpleStorage {
    uint256 public number;
    function store(uint256 num) public { number = num; }
    function retrieve() public view returns (uint256) { return number; }
}`;

const Counter = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract Counter {
    uint256 public count;
    function increment() public { count += 1; }
    function decrement() public { require(count > 0, "Cannot go below zero"); count -= 1; }
    function getCount() public view returns (uint256) { return count; }
}`;

function compile(source, name) {
    const input = {
        language: 'Solidity',
        sources: { 'contract.sol': { content: source } },
        settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } }
    };
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    if (output.errors) {
        const errs = output.errors.filter(e => e.severity === 'error');
        if (errs.length > 0) { console.error(JSON.stringify(errs, null, 2)); process.exit(1); }
    }
    const contract = output.contracts['contract.sol'][name];
    return '0x' + contract.evm.bytecode.object;
}

const ss = compile(SimpleStorage, 'SimpleStorage');
const ct = compile(Counter, 'Counter');

const fs = require('fs');
fs.writeFileSync('bytecodes.json', JSON.stringify({ SimpleStorage: ss, Counter: ct }, null, 2));
console.log('Written to bytecodes.json');
