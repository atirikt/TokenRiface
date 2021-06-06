console.log("The App is loaded");

App = {
  //metamask does not apply web3 anymore, apply ethereum instead
  web3Provider: null,
  contracts: [],
  account:'0x0',

  init:function(){
    console.log("App initialized");
    return App.initWeb3();
  },
  initWeb3: function(){
    console.log("hello web3:" + App.web3Provider);
    App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    return App.initContracts();
  },
  initContracts:function(){
    $.getJSON("SellTokenR.json", function(sellTokenR){
      App.contracts.SellTokenR = TruffleContract(sellTokenR);
      App.contracts.SellTokenR.setProvider(App.web3Provider);
      App.contracts.SellTokenR.deployed().then(function(sellTokenR){
        console.log('sell token R address:',sellTokenR.address);
      })
    }).done(function(){
        $.getJSON("TokenR.json", function(tokenR){
          App.contracts.TokenR = TruffleContract(tokenR);
          App.contracts.TokenR.setProvider(App.web3Provider);
          App.contracts.TokenR.deployed().then(function(tokenR){
            console.log('Token R address:',tokenR.address);
          });
        }).done(function(){
          App.render();
        })
      });
  },

  render: async function(){
    //load account data
    await window.ethereum
    .request({ method: 'eth_requestAccounts' })
    .catch((error) => {
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log('Please connect to MetaMask.');
      } else {
        console.error(error);
      }
    });
    //await window.ethereum.enable();
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    console.log(accounts);
    $("#accountAddress").html("a/c(s):  " + accounts);
    return App.accountChange();
  },
  accountChange: async function(){
    window.ethereum.on('accountsChanged', function (accounts) {
      $("#accountAddress").html("a/c(s):  " + accounts);
    })
  }
}

$(function() {
  $(window).on('load', function(){
    App.init();
  })
});


/*TBD
    // TBD: metamask shows warning if using web3, right now web3 is required for truffle web3Provider. find another way so that
    // warning can be removed , check https://www.trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts
add mongo db to store sell buy orders from an address and show them in website
*/