function app() {
  if (typeof web3 == 'undefined') throw 'No web3 detected. Is Metamask/Mist being used?';
  web3 = new Web3(web3.currentProvider); // MetaMask injected Ethereum provider
  console.log("Using web3 version: " + Web3.version);

  var contract;
  var userAccount;
  var contractAddress;

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

      contractAddress = contractData.networks[networkId].address;
      contract = new web3.eth.Contract(contractData.abi, contractAddress);
      console.log('loaded contract ' + contractAddress + ' \nuser account: ' + userAccount);
    })
    // Refresh balance instead of printing to the console
    // .then(refreshBalance)
    .catch(console.error);

    function bequeath(toAddress, amount, date){
      var numERC20 = parseInt($('#numERC20').text());
      console.log('numERC20: ' + numERC20);
      if (!isNaN(amount)){
        console.log('bequeathing ' + amount + ' eth')
        bequeathEth(toAddress, amount, date);
      }
      if (numERC20 != 0){
        console.log('bequeathing ' + numERC20 + ' erc-20')
        bequeathERC20(toAddress, date, numERC20);
      }
    }

    function getBeneficiaries(){
      var numBens = parseInt($('#numBens').text());
      var bens = [];
      for (var i = 0; i <= numBens; i++){
        bens.push($('#address_' + i).val());
      }
      console.log(bens);
      return bens;
    }


    function bequeathEth(toAddress, amount, date){
      var _type = 1;
      var _contractAddress = toAddress;
      var _beneficiaries = getBeneficiaries();
      var _dates = [date];
      var _tokenIds = [1];
      contract.methods.bequeath(_type, _contractAddress, _beneficiaries, _dates, _tokenIds).send({from: userAccount, value: web3.utils.toWei(amount.toString(), 'ether')})
        .catch(function (e) {
          console.log(e);
        });
    }
    function bequeathERC20(toAddress, date, numERC20){
      var _type = 20;
      var _beneficiaries = [toAddress];
      var _dates = [date];
      var _tokenIds = [0];
      for (var i = 0; i < numERC20; i++){
        var _contractAddress = document.getElementById('erc20_' + i).value;
        console.log('bequeathing erc20 ' + _contractAddress);
        contract.methods.bequeath(_type, _contractAddress, _beneficiaries, _dates, _tokenIds).send({from: userAccount})
          .catch(function (e) {
            console.log(e);
          });
      }
    }

    $("#viewFunds").click(function(){
      viewMyFunds(userAccount);
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
        })
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
              }).then(function(values) {
                console.log("Total ETH: " + values[0]);
                document.getElementById("eth_amount").innerHTML = "Total Eth: "+values[0];
                var erc20_toks = "ERC20 Tokens: \n";
                for (var key in erc20_tokens) {
                   erc20_toks+=key+": "+erc20_tokens[key]+"\n"; 
                }
                document.getElementById("erc20_amount").innerHTML = erc20_toks; 
                var erc_toks = "ERC721 Tokens: \n";
                for (var key in erc721_tokens) {
                   erc_toks+=key+": "+erc721_tokens[key]+"\n"; 
                }
                document.getElementById("erc721_amount").innerHTML = erc_toks; 
                });
          }


        })
        .catch(function(e){
          console.log(e);
        })
    }

      $("#createTrustButton").click(function() {
        var toAddress = $("#address").val();
        var amount = parseFloat($("#amount").val());
        // var date = new Date($("#datepicker").val()).getTime()/1000;
        var datetime = new Date($('#datetime0').val()).getTime()/1000;
        console.log(toAddress);
        console.log(amount);
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
      for (i=0; i<=25; i++){
          select += '<option val=' + i + '>' + i + '</option>';
      }
      $('#erc20selector').html(select);
      $('#erc20selector').on('change', function(){
        addERC20addresses(this.value);
      })
      $("#beneficiary-selector").html(select);
      $('#beneficiary-selector').on('change', function(){
        addBeneficiaries(this.value);
      })
      function addERC20addresses(num) {
        htmlString = "";
        for (var i = 0; i < num; i++){
          htmlString += `<div class=row><input id="erc20_` + i +`" type="text"  placeholder="Enter ERC-20 contract address here" onfocus="this.placeholder = ''"onblur="this.placeholder = 'Enter ERC-20 contract address here'">`
          htmlString += `<input id="erc20amount_` + i + `" type="text" style="width: 200px" placeholder="Amount of ERC-20 token" onfocus="this.placeholder = ''"onblur="this.placeholder = 'Amount of ERC-20 token'"></div>`
        }
        htmlString += `<button id="approve"class="small blue button">Approve Transfer</button>`
        $('#numERC20').html(num);
        $('#erc20addresses').html(htmlString);
        $('#approve').click(function(){
          approve(num);
        })
      }

      function addBeneficiaries(num){
        htmlString = "";
        for (var i = 1; i <= num; i++){
          htmlString += `<div class=row><input id="address_`+ i + `" type="text" placeholder="Enter beneficiary ETH address here" onfocus="this.placeholder = ''" onblur="this.placeholder = 'Enter beneficiary ETH address here'">`
          htmlString += `<div class="form-group">
                          <div class='input-group date' id='datetimepicker` + (10 + i) + `'>
                              <input type='text' name='datetime' id='datetime`+i+`' class="form-control" />
                                    <span class="input-group-addon">
                          <span class="glyphicon glyphicon-calendar">
                          </span>
                                    </span>
                                </div>
                      </div></div>`
        }
        $('#numBens').html(num);
        $('#beneficiaries').html(htmlString);

        for (var i = 10; i < 10 + num; i++){
          $('#datetimepicker' + i).datetimepicker({
  			viewMode: 'years'
  		    });
        }
      }

      function approve(num){
        console.log('approving ' + num + ' tokens')
        for (var i = 0; i < num; i++){
          var _erc20contract = document.getElementById('erc20_' + i).value;
          var _erc20amount = document.getElementById('erc20amount_' + i).value;
          var abi_url = `http://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=`+_erc20contract +`&apikey=DABZHWXSF6ZGBVFH4VKD9B8QCW2ZHFZJQ8HI`; // + process.env.ETHERSCAN_API_KEY
          $.get(abi_url, (function (_erc20contract, _erc20amount){
            return function (data){
              $.get(abi_url, function(data){
                abi = JSON.parse(data.result);
                tokenContract = new web3.eth.Contract(abi, _erc20contract);
                console.log('approving ' + _erc20amount + ' of ' + _erc20contract);
                tokenContract.methods.approve(contractAddress, web3.utils.toWei(_erc20amount.toString(), 'ether')).send({from: userAccount});
              });
            }
          })(_erc20contract, _erc20amount));
        }
      }

      $(function () {
  		    $('#datetimepicker9').datetimepicker({
  			viewMode: 'years'
  		    });
  		});

}
$(document).ready(app);
