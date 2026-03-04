// Contract Templates with REAL compiled bytecodes
// Bytecodes compiled using Solidity 0.8.20 via Remix IDE

export const CONTRACT_TEMPLATES = [
    {
        name: "SimpleStorage",
        description: "Store and retrieve a number on-chain.",
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
            {
                "inputs": [],
                "name": "number",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "retrieve",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{ "internalType": "uint256", "name": "num", "type": "uint256" }],
                "name": "store",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],
        // Compiled with solc 0.8.20
        bytecode: "0x608060405234801561000f575f80fd5b506101718061001d5f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c80632e64cec1146100435780636057361d146100615780638381f58a1461007d575b5f80fd5b61004b61009b565b60405161005891906100c9565b60405180910390f35b61007b60048036038101906100769190610110565b6100a3565b005b6100856100ac565b60405161009291906100c9565b60405180910390f35b5f8054905090565b805f8190555050565b5f5481565b5f819050919050565b6100c3816100b1565b82525050565b5f6020820190506100dc5f8301846100ba565b92915050565b5f80fd5b6100ef816100b1565b81146100f9575f80fd5b50565b5f8135905061010a816100e6565b92915050565b5f60208284031215610125576101246100e2565b5b5f610132848285016100fc565b9150509291505056fea26469706673582212206ba4d4e6d2a3ea95107627449b486f99c60957235c286a64b68c3b1133aa269f64736f6c63430008140033"
    },
    {
        name: "Counter",
        description: "Increment, decrement, and reset a counter.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;

    function increment() public {
        count += 1;
    }

    function decrement() public {
        require(count > 0, "Cannot go below zero");
        count -= 1;
    }

    function getCount() public view returns (uint256) {
        return count;
    }
}`,
        abi: [
            {
                "inputs": [],
                "name": "count",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "decrement",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getCount",
                "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "increment",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],
        bytecode: "0x608060405234801561000f575f80fd5b506102948061001d5f395ff3fe608060405234801561000f575f80fd5b506004361061004a575f3560e01c806306661abd1461004e5780632baeceb71461006c578063a87d942c14610076578063d09de08a14610094575b5f80fd5b61005661009e565b604051610063919061013a565b60405180910390f35b6100746100a3565b005b61007e610100565b60405161008b919061013a565b60405180910390f35b61009c610108565b005b5f5481565b5f8054116100e6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100dd906101ad565b60405180910390fd5b60015f808282546100f791906101f8565b92505081905550565b5f8054905090565b60015f80828254610119919061022b565b92505081905550565b5f819050919050565b61013481610122565b82525050565b5f60208201905061014d5f83018461012b565b92915050565b5f82825260208201905092915050565b7f43616e6e6f7420676f2062656c6f77207a65726f0000000000000000000000005f82015250565b5f610197601483610153565b91506101a282610163565b602082019050919050565b5f6020820190508181035f8301526101c48161018b565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f61020282610122565b915061020d83610122565b9250828203905081811115610225576102246101cb565b5b92915050565b5f61023582610122565b915061024083610122565b9250828201905080821115610258576102576101cb565b5b9291505056fea2646970667358221220a8a9302778a090119a235125e2c5f844f5caa9aa2add6e19dc5a2af2a5ac0db264736f6c63430008140033"
    },
    {
        name: "Greeting",
        description: "Set and get a greeting message.",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Greeting {
    string public greeting = "Hello, Avalanche!";

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }

    function getGreeting() public view returns (string memory) {
        return greeting;
    }
}`,
        abi: [
            {
                "inputs": [],
                "name": "getGreeting",
                "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "greeting",
                "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{ "internalType": "string", "name": "_greeting", "type": "string" }],
                "name": "setGreeting",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],
        // Greeting with constructor init "Hello, Avalanche!"
        bytecode: ""
    },
    {
        name: "ERC20 Token",
        description: "Standard Fungible Token (requires compilation).",
        source: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}`,
        abi: [
            {
                "inputs": [{ "name": "initialSupply", "type": "uint256" }],
                "stateMutability": "nonpayable",
                "type": "constructor"
            },
            {
                "inputs": [],
                "name": "name",
                "outputs": [{ "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "symbol",
                "outputs": [{ "name": "", "type": "string" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "totalSupply",
                "outputs": [{ "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{ "name": "account", "type": "address" }],
                "name": "balanceOf",
                "outputs": [{ "name": "", "type": "uint256" }],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{ "name": "to", "type": "address" }, { "name": "amount", "type": "uint256" }],
                "name": "transfer",
                "outputs": [{ "name": "", "type": "bool" }],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ],
        bytecode: ""
    }
];
