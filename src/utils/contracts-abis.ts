export const counterContractAbi: any = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "newCounterValue",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "msgSender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "originalSender",
				"type": "address"
			}
		],
		"name": "IncrementCounter",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "counter",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMsgSenders",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "_array",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getOriginalSenders",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "_array",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "originalSender",
				"type": "address"
			}
		],
		"name": "increment",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "incrementValue",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "originalSender",
				"type": "address"
			}
		],
		"name": "incrementWithValue",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];