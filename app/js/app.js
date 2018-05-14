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

      var contractAddress = '0xb6057af7b13f72115478c70ea0483267e5b99ff3';//contractData.networks[networkId].address;
      contract = new web3.eth.Contract(contractData.abi, contractAddress);
    })
    // Refresh balance instead of printing to the console
    // .then(refreshBalance)
    .catch(console.error);

    function bequeath(toAddress, amount, date){
        contract.methods.bequeath(toAddress, date).send({from: userAccount, value: amount*1000000000000000000, gas: 2500000})
          .catch(function (e) {
            console.log(e);
          });
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



    // $(document).ready(function() {
    //   $("#datepicker").datepicker();
    // });

    $(function() {
      $('input[name="datetime"]').daterangepicker({
        singleDatePicker: true,
        timePicker: true,
        startDate: moment().startOf('hour'),
        showDropdowns: true,
        minDate: "05/11/2018",
        maxYear: parseInt(moment().format('YYYY'),200),
        locale: {
          format: 'MM/DD/YYYY hh:mm A'
        }
      });
    });



}
$(document).ready(app);
