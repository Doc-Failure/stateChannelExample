const PaymentChannel = artifacts.require("PaymentChannel");
const Signer = require("../utilities/Signer.js");

const privateKeys = [
  'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
  'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
  '0dbbe8e4ae425a6d2687f1a7e3ba17bc98c673636790f1b8ad91193c05875ef1',
  'c88b703fb08cbea894b6aeff5a544fb92e78a18e19814cd85da83b71f772aa6c',
  '388c684f0ba1ef5017716adb5d21a053ea8e90277d0868337519f97bede61418',
  '659cbb0e2411a44db63778987b1e22153c086a95eb6b18bdf89de078917abc63',
  '82d052c865f5763aad42add438569276c00d3d88a2d062d36b2bae914d58b8c8',
  'aa3680d5d48a8283413f7a108367c7299ca73f553735860a87b08f39395618b7',
  '0f62d96d6675f32685bbdb8ac13cda7c23436f63efbb9d07700d8669ff12b7c4',
  '8d5366123cb560bb606379f90a0bfd4769eecc0557f1b362dcae9012b548b1e5'
];

contract('PaymentChannel', (accounts, b) => {

  let paymentChannel;
  
  //Those are the 2 address used in the operations
  const account1 = accounts[0];
  const account2 = accounts[1];
  
  //We deploy the smart contracts and check if the two address are correct
  before( async () => {
    paymentChannel = await PaymentChannel.new( [account1,account2] , 60 );
    const addr1 = await paymentChannel.addr.call(0);
    const addr2 = await paymentChannel.addr.call(1);
    assert.equal(addr1, account1, "The sender is the right one!");
    assert.equal(addr2, account2, "The receiver is the right one!");
  });

  //We check if the balances are correct (checkBalances function)
  it('Balance tests', async () => {
    let balance = await paymentChannel.checkBalances(account1);
    assert.equal( balance.toString(), "1000", "Error in the first account");
    balance = await paymentChannel.checkBalances(account2);
    assert.equal( balance.toString(), "1000", "Error in the second account");
  });

  //This function is used to check the signatures functionalities
  it('Signature tests', async () => {
    let map = new Map();
    map.set(account1, 1000);
    map.set(account2, 1000);
    let signer = new Signer(map);

    //This assert is used to check if the hash message generated with web3 and the one generated in the solidity function are equal
    const messageObject = signer.signPayment(account1, account2, 100, privateKeys[0]);
    const checkContractHash = await paymentChannel.generateMessage(account1, "100", 1);
    assert.equal( checkContractHash, messageObject.messageHash, "Hash is not the same!");

    //This assert is used to check if the generated signature is valid
    const isSignatureValid = await paymentChannel.isValidSignature(account1, "100", 1, messageObject.signature);
    assert.equal( isSignatureValid, true, "The signature is not Valid");
  });

  //In this function we use the signPayment function (JS) to generate a receipt 
  //and the close function (Solidity) to verify if the function is correct
  //We send multiple times the money from the address1 to the address 2  
  //and from the address2 to the address1, to simulate a real case example.
  //When the 2 part want to close the channell they call the solidity close function, 
  //the function check if the sign is correct. 
  //The nonce is used to identify the last message, when one of the two part call the close function the other part have 4h to 
  //claim an older nonce and demostrate that the other part is a liar
  it('Payment tests', async () => {
    let map = new Map();
    map.set(account1, 1000);
    map.set(account2, 1000);
    let signer = new Signer(map);
  
    //We send some money from the account 1 to the account 2
    //and from account 2 to the 1
    let messageObject = signer.signPayment(account1, account2, 100, privateKeys[0]);
    messageObject = signer.signPayment(account2, account1, 50, privateKeys[1]);
    messageObject = signer.signPayment(account1, account2, 25, privateKeys[0]);
    messageObject = signer.signPayment(account2, account1, 12, privateKeys[1]);
    messageObject = signer.signPayment(account2, account1, 7, privateKeys[1]);
    messageObject = signer.signPayment(account2, account1, 9, privateKeys[1]);
    messageObject = signer.signPayment(account1, account2, 3, privateKeys[0]);
    messageObject = signer.signPayment(account1, account2, 7, privateKeys[0]);
    messageObject = signer.signPayment(account1, account2, 10, privateKeys[0]);
    messageObject = signer.signPayment(account2, account1, 345, privateKeys[1]);
    messageObject = signer.signPayment(account1, account2, 323, privateKeys[0]);
    messageObject = signer.signPayment(account2, account1, 133, privateKeys[1]);
    messageObject = signer.signPayment(account1, account2, 323, privateKeys[0]);



    //The function close can be called by both address
    let isChannelClosed = await paymentChannel.close(signer.getSender(), signer.getReceiver(), signer.getAmountToSend(account1), signer.getNonce(), messageObject.signature, {from:account1} );
    signer.closeChannel(); //we need to close the local channel

    //And check the balances of both the adresses
    let balance = await paymentChannel.checkBalances(account2);
    assert.equal( balance.toString(), "1235", "Error in the balance (Check 1)");
    balance = await paymentChannel.checkBalances(account1);
    assert.equal( balance.toString(), "765", "Error in the balance (Check 2)");

    //Let's do another operation to check if a nonce greater than the old one can claim the payment
    messageObject = signer.signPayment(account2, account1, 923, privateKeys[1]);
    
    //The function close can be called by both address
    isChannelClosed = await paymentChannel.close(signer.getSender(), signer.getReceiver(), signer.getAmountToSend(account1), signer.getNonce(), messageObject.signature, {from:account1} );
    signer.closeChannel(); //we need to close the local channel


    //And check the balances of both the adresses
    balance = await paymentChannel.checkBalances(account2);
    assert.equal( balance.toString(), "312", "Error in the balance (Check 3)");
    balance = await paymentChannel.checkBalances(account1);
    assert.equal( balance.toString(), "1688", "Error in the balance (Check 4)");

  
  });

});
