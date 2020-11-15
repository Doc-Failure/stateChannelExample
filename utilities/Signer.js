class Signer {

    constructor(balances){
      this.balanceMap=balances;
      //we hardcoded the original balance just for test purpose
      this.originalBalance=1000;
      this.nonce=0;
      this.sender;
      this.receiver;
      this.amountToSend=0;
    }

    // pAmountToSend is the number of erc-20 token to send myAddress must be the real one.
    // If I firm a transaction with my privateKey and a wrong address the transaction is not valid and solidity don't accept it
    signPayment = (myAddress, otherAddress, pAmountToSend, privateKey )=>{
        let message=null;
        //amountToSend should be > 0 to prevent fraud
        if(this.balanceMap.get(myAddress)>pAmountToSend && pAmountToSend>0){
          //I manage the balance locally
          if(this.sender==myAddress){
            this.amountToSend+=pAmountToSend;
          }else if(this.receiver==myAddress || this.sender==null){
            if(pAmountToSend>this.amountToSend || this.sender==null){
              this.sender=myAddress;
              this.receiver=otherAddress;
              this.amountToSend=pAmountToSend-this.amountToSend;
            }else if(pAmountToSend<this.amountToSend){
              //If who sign this transaction send less money than the current debt i just
              //subtract those money from the actual situation and i send this value to the debitor
              //if the other part close the transaction this mean that he accepted is debit
              this.amountToSend-=pAmountToSend;
            }else{
              this.amountToSend=0;
              this.sender=null;
              this.receiver=null;
            }
          }
          if(this.amountToSend!=0){
            this.nonce++;
            this.balanceMap.set(myAddress, this.balanceMap.get(myAddress)-pAmountToSend); 
            this.balanceMap.set(otherAddress, this.balanceMap.get(otherAddress)+pAmountToSend); 
            message = this.constructPaymentMessage(this.sender, this.amountToSend, this.nonce);
          }
        }
        return message!=null?
          web3.eth.accounts.sign( message, privateKey )
          :'Signature not valid';
    }

    //Used to contruct the message
    constructPaymentMessage = (sender, amount, nonce ) => {
        return web3.utils.soliditySha3( web3.utils.padLeft(sender, 64) , amount, nonce );
    }

    getNonce(){
      return this.nonce;
    }

    getAmountToSend(){
      return this.amountToSend; 
    }

    getSender(){
      return this.sender;
    }

    getReceiver(){
      return this.receiver;
    }

    closeChannel(){
      this.amountToSend=0;
      this.sender=null;
      this.receiver=null;
    }

  }

module.exports = Signer;