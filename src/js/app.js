console.log("The App is loaded");

App = {
  //metamask does not apply web3 anymore, apply ethereum instead
  web3Provider: null,
  contracts: [],
  account:'0x0',
  loading: false,
  tokenPrice:1e10, //wei = subTokenPrice; NOT TokenR
  tokenSold:0,
  IsAdmin:false,
  tokenAvailable:0,

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
    if(App.loading) {
      return;
    }
    App.loading = true;
        
    var loader = $('#loader');
    var content = $("#content");
    loader.show();
    content.hide();
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
    App.account = await ethereum.request({ method: 'eth_accounts' });
    console.log(App.account);
    $("#accountAddress").html("a/c(s):  " + App.account);


    App.contracts.SellTokenR.deployed().then(function(obj){
      sellTokenRObj = obj;
      return sellTokenRObj.tokenPrice();
    }).then(function(tokenPrice){
      console.log("token Price" + tokenPrice);
      App.tokenPrice = tokenPrice;
      $(".token-price").html(((App.tokenPrice.toNumber() * 1e8 )/1e18).toFixed(5)); //subTokenPrice * numSubTokenR/1e18 = TokenR price in eth 
      return sellTokenRObj.IsAdmin(App.account[0]);
    }).then(function(_isAdmin){
      console.log("sudo=",_isAdmin)
      App.IsAdmin = _isAdmin;
      if(App.IsAdmin){
        return sellTokenRObj.tokenSold().then(function(tokenSold){
          App.tokenSold = tokenSold.toNumber();
          console.log("tokenSold", App.tokenSold);
          $("#admin_Data").show();
          $("#admin_Data .tokens-sold").html((App.tokenSold/1e8).toFixed(8));
          return App.contracts.TokenR.deployed();
        }).then(function(obj){
          tokenRobj = obj;
          return tokenRobj.totalSupply()
        }).then(function(_totalSupply){
          App.tokenAvailable = _totalSupply.toNumber();
          $("#admin_Data .tokens-available").html((App.tokenAvailable/1e8));
          var progressPercent = (App.tokenSold/App.tokenAvailable)*100;
          $("#admin_Data .token-progress").html(progressPercent.toFixed(3) + "%");
          console.log("into admin");
        })                
      } else{
        $("#admin_Data").hide();
      }
    }).then(function(){
      return App.updateBalance();
    });

    App.loading = false;
    loader.hide();
    content.show();
    return App.accountChange();
  },

  updateBalance: async function() {
    App.contracts.TokenR.deployed().then(function(Obj){
      return Obj.balanceOf(App.account[0])
    }).then(function(balance){
      console.log("balance=",balance);
      var printBalance = 0;
      if(balance != undefined){
        printBalance = balance.toNumber()/1e8;
      }
      $(".TokenR-balance").html(printBalance.toFixed(8));      
    })
  },
  
  accountChange: async function(){
    window.ethereum.on('accountsChanged', function (accounts) {
      $("#accountAddress").html("a/c(s):  " + accounts);
      App.render();
    })
  },

  buyTokens:function(){
    var numOfSubToken = $("#numberOfTokens").val() * 1e8;
    App.contracts.SellTokenR.deployed().then(function(obj){
      return obj.buyTokens(numOfSubToken, {from:App.account,
        value:numOfSubToken * App.tokenPrice,
        gas: 500000
      });
    }).then(function(result){
      console.log("tokens bought", result);
    }).then(function(){
      App.updateBalance();
      App.balanceGreen();
    })
    .catch(function(error){
      error = String(error)
      $("#errorOnCall").html(error.slice(error.indexOf("Reason given:")+ ("Reason given:").length)).show(0).delay(4000).hide(0);
    })
  },

  sellTokens:function(){
    var numOfSubToken = $("#numberOfTokens").val() * 1e8;
    App.contracts.SellTokenR.deployed().then(function(obj){
      return obj.sellTokens(numOfSubToken, {from:App.account[0], gas:500000});
    }).then(function(result){
      console.log("tokens sold", result);
    }).then(function(){
      App.updateBalance();
      App.balanceRed();
    })
    .catch(function(error){
      error = String(error)
      $("#errorOnCall").html(error.slice(error.indexOf("Reason given:")+ ("Reason given:").length)).show(0).delay(4000).hide(0);
    })
  },

  balanceRed: function(){
      $(".TokenR-balance").css({"color":"#ff4d4d","font-weight":"bold"});
      setTimeout(function(){
        $(".TokenR-balance").css({"color":"black","font-weight":"normal"});
      },1000);
  },

  balanceGreen: function(){
      $(".TokenR-balance").css({"color":"#90ee90","font-weight":"bold"});
      setTimeout(function(){
        $(".TokenR-balance").css({"color":"black","font-weight":"normal"});
      },1000);
  },


  deployTokens: function(){
    if(!App.IsAdmin) {
      return;
    }
    var numOfSubToken = $("#admin_transferTokens").val() * 1e8;
    App.contracts.TokenR.deployed().then(function(obj){
      tokenRObj = obj;
      return App.contracts.SellTokenR.deployed();
    }).then(function(obj){
      sellTokenRObj = obj;
      console.log("sell contract: ",sellTokenRObj.address, obj);
      return tokenRObj.transfer(sellTokenRObj.address, numOfSubToken, {from:App.account[0]});
    }).then(function(){
      App.updateBalance();
      App.balanceRed();
    })
  }
}

$(function() {
  $(document).ready(function(){
    App.init();
  })
});


/*TBD
    // TBD: metamask shows warning if using web3, right now web3 is required for truffle web3Provider. find another way so that
    // warning can be removed , check https://www.trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts
add mongo db to store sell buy orders from an address and show them in website
*/