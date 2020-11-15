pragma solidity 0.5.16;

//This smartcontract is based on the one in the solidity documentation
contract PaymentChannel {

    mapping(address => uint256) balances; //This is a fake balances, just to simulate an erc-20 token

    address payable[2] public addr; // The account sending payments.
    uint256 public expiration;  // Timeout in case the recipient never closes.

    uint256 lastNonce = 0;

    constructor (address payable[2] memory pAddr , uint256 duration) public payable {
        require(duration > 0);
        balances[pAddr[0]]=1000; // we add some found in the balance of the address 0 only for the purpose of this simulation
        balances[pAddr[1]]=1000; // we add some found in the balance of the address 1 only for the purpose of this simulation
        addr = pAddr;
        expiration = duration;
    }

    //Function used to retrieved the balance of an address
    function checkBalances(address pAddr) public view returns(uint256){
        return balances[pAddr];
    }

    //Is used to validate the signature
    //This function should be used only in the solidity close function, I set it as public just to use it in the truffle test
    function isValidSignature(address pAddr, uint256 amount, uint256 nonce, bytes memory signature) public view returns(bool){
        bytes32 message = generateMessage(pAddr, amount, nonce);
        return recoverSigner(message, signature)==pAddr;
     }

    // The recipient can close the channel at any time by presenting a
    // signed amount from the sender. the recipient will be sent that amount,
    // and the remainder will go back to the sender
    function close(address sender, address receiver, uint256 amount, uint256 nonce, bytes memory signature) public payable{
        require(nonce>lastNonce);
        require(balances[sender]>amount);
        require(isValidSignature(sender, amount, nonce, signature));
        lastNonce=nonce;

        balances[sender]=balances[sender] - amount;
        balances[receiver] = balances[receiver]+amount;
    }

    function splitSignature(bytes memory sig) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(sig.length == 65);
        assembly {
            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }
        return (v, r, s);
    }

    function recoverSigner(bytes32 message, bytes memory sig) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = splitSignature(sig);
        return ecrecover(message, v, r, s);
    }

    //Generate the hash message
    //This function is public only for test purpose
    function generateMessage(address pAddr , uint256 amount, uint256 nonce) public pure returns (bytes32) {
        bytes32 h = keccak256(abi.encode(pAddr,amount, nonce));
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";    
        return keccak256(abi.encodePacked(prefix,h)); 
    }
}