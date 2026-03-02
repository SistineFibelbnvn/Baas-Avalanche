export const CONTRACT_TEMPLATES = [
    {
        name: "SimpleStorage",
        description: "A simple contract to store and retrieve a number.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public number;

    function store(uint256 num) public {
        number = num;
    }

    function retrieve() public view returns (uint256) {
        return number;
    }
}`,
        abi: [
            "function store(uint256 num) public",
            "function retrieve() public view returns (uint256)"
        ],
        bytecode: "0x608060405234801561001057600080fd5b5060f78061001f6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80632e64cec11460415780636057361d14605c575b600080fd5b60005460405190815260200160405180910390f35b606c6067366004608e565b600055565b005b600060208284031215609f57600080fd5b503591905056fea26469706673582212209a159a4f3847a31bb3e2c2f6f7b0c8f3fa7f6b5f2e7b6f8c3a4d5e6f7a8b9c0d64736f6c63430008120033"
    },
    {
        name: "ERC20 Token",
        description: "Standard Fungible Token",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}`,
        abi: [
            "constructor(uint256 initialSupply)",
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)",
            "function totalSupply() view returns (uint256)",
            "function balanceOf(address account) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function approve(address spender, uint256 amount) returns (bool)",
            "function transferFrom(address from, address to, uint256 amount) returns (bool)"
        ],
        // Bytecode is too large for this snippet, using placeholder or user must compile
        // For demo, we might need a real bytecode or just warn 'Compilation not supported in browser'
        bytecode: ""
    }
];
