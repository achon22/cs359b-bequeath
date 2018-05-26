function app() {
  if (typeof web3 == 'undefined') throw 'No web3 detected. Is Metamask/Mist being used?';
  web3 = new Web3(web3.currentProvider); // MetaMask injected Ethereum provider
  console.log("Using web3 version: " + Web3.version);

  var contract;
  var userAccount;

  var contractDataPromise = $.getJSON('BequeathContract.json');
  var networkIdPromise = web3.eth.net.getId(); // resolves on the current network id
  var accountsPromise = web3.eth.getAccounts(); // resolves on an array of accounts

  Promise.all([contractDataPromise, networkIdPromise, accountsPromise])
    .then(function initApp(results) {
      var contractData = results[0];
      var networkId = results[1];
      var accounts = results[2];
      userAccount = accounts[0];

      // (todo) Make sure the contract is deployed on the network to which our provider is connected
      // Make sure the contract is deployed on the connected network
      if (!(networkId in contractData.networks)) {
         throw new Error("Contract not found in selected Ethereum network on MetaMask.");
      }

      var contractAddress = contractData.networks[networkId].address;
      contract = new web3.eth.Contract(contractData.abi, contractAddress);
    })
    // Refresh balance instead of printing to the console
    // .then(refreshBalance)
    .catch(console.error);

    function bequeath(toAddress, amount, date){
      var _type = 1;
      var _contractAddress = toAddress;
      var _beneficiaries = [toAddress];
      var _dates = [date];
      var _tokenIds = [1];
      contract.methods.bequeath(_type, _contractAddress, _beneficiaries, _dates, _tokenIds).send({from: userAccount, value: web3.utils.toWei(amount.toString(), 'ether')})
        .catch(function (e) {
          console.log(e);
        });
    }

    $("#viewFunds").click(function(){
      viewMyFunds(userAccount);
    });

    $("#viewBequeathal").click(function(){
      viewBequeathal(2);
    })

    function viewBequeathal(id){
      contract.methods.viewBequeathal(id).call()
        .then(function (a,b,c,d,e,f){
          console.log(a);
          console.log(b);
          console.log(c);
          console.log(d);
          console.log(e);
          console.log(f);
        })
        .catch(function(e){
          console.log(e);
        })
    }

    function viewMyFunds(address){
      contract.methods.viewMyIds(address).call()
        .then(function (ids){
          console.log(ids);
          $("#current-amount").innerHTML = ids;
        })
        .catch(function(e){
          console.log(e);
        })
    }

      $("#createTrustButton").click(function() {
        var toAddress = $("#address").val();
        var amount = parseFloat($("#amount").val());
        // var date = new Date($("#datepicker").val()).getTime()/1000;
        var datetime = new Date($('#datetime').val()).getTime()/1000;
        console.log(toAddress);
        console.log(amount);
        // console.log(date);
        console.log(datetime);
        // TODO: type checking and error handling
        bequeath(toAddress, amount, datetime);
      });

      function claim(){
        contract.methods.claim().send({from: userAccount, gas: 250000})
          .catch(function (e) {
            console.log(e);
          });
      }

      $("#claimTrust").click(function() {
        claim();
      });






}
$(document).ready(app);
