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
      view(userAccount);
    });

    $("#viewBequeathal").click(function(){
      viewBequeathal(2);
    })

    function viewBequeathal(id){
      contract.methods.viewBequeathal(id).call()
        .then(function (bequeathal_array) {
          console.log(bequeathal_array);
          return bequeathal_array;
        })
        .catch(function(e){
          console.log("error in viewBequeathal");
          console.log(e);
          console.log(e.toString());
          document.getElementById("current-amount").innerHTML = e.toString();
        })
    }
    function view(address) {
        values = viewMyFunds(address);
        console.log("Total ETH: " + values);
    }
    function viewMyFunds(address){
      contract.methods.viewMyIds(address).call()
        .then(function (ids){
            var totalEth = 0;
            var erc20_tokens = {}
            var erc721_tokens = {} 
          for (var i = 0; i < ids.length; i++) {
            var id = ids[i];
            console.log("id: " +  id);
            contract.methods.viewBequeathal(id).call()
                .then(function(beqVals) {
                if (beqVals[0]=="1") {
                    console.log("eth: " + web3.utils.fromWei(beqVals[1]))
                    totalEth+=parseInt(web3.utils.fromWei(beqVals[1]));
                } else if (beqVals[0]=="20") {
                    if(beqVals[4] in erc20_tokens) {
                        erc20_tokens[beqVals[4]]+=beqVals[1];
                    } else {
                        erc20_tokens[beqVals[4]]=beqVals[1];
                    }
                } else if (beqVals[0]=="721") {
                    if(beqVals[4] in erc721_tokens) {
                        erc721_tokens[beqVals[4]].push(beqVals[1]);
                    } else {
                        erc721_tokens[beqVals[4]]=[beqVals[1]];
                    }
                }
                return [totalEth, erc20_tokens, erc721_tokens];
              })
          }

          document.getElementById("current-amount").innerHTML = ids;
        })
        .catch(function(e){
          console.log(e);
          document.getElementById("current-amount").innerHTML = e;
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

      var select = '';
      for (i=0;i<=25;i++){
          select += '<option val=' + i + '>' + i + '</option>';
      }
      $('#erc20selector').html(select);
      $('#erc20selector').on('change', function(){
        addERC20addresses(this.value);
      })
      function addERC20addresses(num) {
        htmlString = "";
        for (var i = 0; i < num; i++){
          htmlString += `<div class=row><input id="erc20"` + i +` type="text"  placeholder="Enter ERC-20 contract address here" onfocus="this.placeholder = ''"onblur="this.placeholder = 'Enter ERC-20 contract address here'"></div>`
        }
        htmlString += `<div id="numERC20" style="display: none;">` + num + `</div>`
        $('#erc20addresses').html(htmlString);
      }

      $(function () {
  		    $('#datetimepicker9').datetimepicker({
  			viewMode: 'years'
  		    });
  		});
}
$(document).ready(app);
