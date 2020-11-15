module.exports = {
 
  test: {
    provider: function() {
      return new HDWalletProvider(mnemonic, "http://127.0.0.1:8545/");
    },
    network_id: '*',
    compilers: {
      solc: {
          version: "0.5.16", 
      }
    }
  }
};
