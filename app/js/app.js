function app() {
    if (typeof web3 == 'undefined') throw 'No web3 detected. Is Metamask/Mist being used?';
    web3 = new Web3(web3.currentProvider); // MetaMask injected Ethereum provider
    console.log("Using web3 version: " + Web3.version);

    var contract;
    var contractAddress;
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
            Cookies.set('userAccount', userAccount);
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

    function bequeath(toAddress, amount) {
        var numERC20 = parseInt($('#numERC20').text());
        console.log('numERC20: ' + numERC20);
        if (!isNaN(amount)) {
            console.log('bequeathing ' + amount + ' eth')
            bequeathEth(toAddress, amount);
        }
        if (numERC20 != 0) {
            console.log('bequeathing ' + numERC20 + ' erc-20')
            bequeathERC20(toAddress, numERC20);
        }
    }

    function getBeneficiaries() {
        var numBens = parseInt($('#numBens').text());
        var bens = [];
        for (var i = 0; i <= numBens; i++) {
            bens.push($('#address_' + i).val());
        }
        console.log(bens);
        return bens;
    }

    function getDates() {
        var numDates = parseInt($('#numBens').text());
        var dates = [];
        for (var i = 0; i <= numDates; i++) {
            var datetime = new Date($('#datetime' + i).val()).getTime() / 1000;
            dates.push(datetime);
        }
        console.log(dates);
        return dates;
    }


    function bequeathEth(toAddress, amount) {
        var _type = 1;
        var _contractAddress = toAddress;
        var _beneficiaries = getBeneficiaries();
        var _dates = getDates();
        var _tokenIds = [1];
        contract.methods.bequeath(_type, _contractAddress, _beneficiaries, _dates, _tokenIds).send({
                from: userAccount,
                value: web3.utils.toWei(amount.toString(), 'ether')
            })
            .catch(function(e) {
                console.log(e);
            });
    }

    function bequeathERC20(toAddress, numERC20) {
        var _type = 20;
        var _beneficiaries = getBeneficiaries();
        var _dates = getDates();
        var _tokenIds = [0];
        for (var i = 0; i < numERC20; i++) {
            var _contractAddress = document.getElementById('erc20_' + i).value;
            console.log('bequeathing erc20 ' + _contractAddress + ' to beneficiary ' + _beneficiaries[0]);
            contract.methods.bequeath(_type, _contractAddress, _beneficiaries, _dates, _tokenIds).send({
                    from: userAccount
                })
                .catch(function(e) {
                    console.log(e);
                });
        }
    }

    $("#viewFunds").click(function() {
        viewMyFunds(userAccount);
    });

    $("#viewBequeathal").click(function() {
        viewBequeathal(2);
    })

    function viewBequeathal(id) {
        contract.methods.viewBequeathal(id).call()
            .then(function(bequeathal_array) {
                console.log(bequeathal_array);
                return bequeathal_array;
            })
            .catch(function(e) {
                console.log("error in viewBequeathal");
                console.log(e);
                console.log(e.toString());
            })
    }

    function viewMyFunds(address) {
      $('#eth-bequeathals').DataTable({
          searching: false,
          paging: false,
          "language": {
              "emptyTable": "You have no Bequeathals of Ethereum"
          }
      });
      $('#erc20-bequeathals').DataTable({
          searching: false,
          paging: false,
          "language": {
              "emptyTable": "You have no Bequeathals of ERC-20 tokens"
          }
      });
      var eth_table = $('#eth-bequeathals').DataTable();
      var erc20_table = $('#erc20-bequeathals').DataTable();
      var all_data = contract.methods.viewMyIds(address).call()
        .then(function(ids) {
          var totalEthData = [];
          var totalErc20_tokens = [];
          var totalErc721_tokens = [];
            for (var i = 0; i < ids.length; i++) {
                var id = ids[i];
                var bequeathal = async (id) => {
                  var bequeathal = await contract.methods.viewBequeathal(id).call();
                  var tokenType = bequeathal[0];
                  var amount = bequeathal[1];
                  var beneficiaries = bequeathal[2];
                  var dates = bequeathal[3];
                  var contractAddress = bequeathal[4];
                  if (tokenType == "1") {
                      for (var i = 0; i < beneficiaries.length; i++) {
                          var addr = beneficiaries[i];
                          if (addr == address) {
                              var date = new Date(1000 * dates[i]);
                              var order = '# ' + (i + 1) + ' of ' + beneficiaries.length
                              eth_table.row.add([date.toLocaleString(), web3.utils.fromWei(amount) + ' ETH', order]).draw(true);
                          }
                      }
                  }else if (tokenType == "20"){
                    for (var i = 0; i < beneficiaries.length; i++) {
                        var addr = beneficiaries[i];
                        if (addr == address) {
                            var date = new Date(1000 * dates[i]);
                            var order = '# ' + (i + 1) + ' of ' + beneficiaries.length
                            var success = erc20_table.row.add([date.toLocaleString(), contractAddress, web3.utils.fromWei(amount), order]).draw(true);
                        }
                    }
                  }
                }
                bequeathal(id);
            }
            return [totalEthData, totalErc20_tokens, totalErc721_tokens];

/**
.then(function(bequeathal) {
    var tokenType = bequeathal[0];
    var amount = bequeathal[1];
    var beneficiaries = bequeathal[2];
    var dates = bequeathal[3];
    var contractAddress = bequeathal[4];
    var bequeathalData = {}
    if (tokenType == "1") {
        for (var i = 0; i < beneficiaries.length; i++) {
            var addr = beneficiaries[i];
            if (addr == address) {
                var date = new Date(1000 * dates[i]);
                var order = 'Number ' + (i + 1) + ' out of ' + beneficiaries.length
                // console.log([date.toLocaleString(), web3.utils.fromWei(amount), order])
                if (bequeathalData["1"] == undefined){
                  bequeathalData["1"] = [[date.toLocaleString(), web3.utils.fromWei(amount), order]]
                }else{
                  bequeathalData["1"] = bequeathalData["1"].push([date.toLocaleString(), web3.utils.fromWei(amount), order])
                }
            }
        }
    } else if (tokenType == "20") {
    for (var i = 0; i < beneficiaries.length; i++) {
        var addr = beneficiaries[i];
        if (addr == address) {
            var date = new Date(1000 * dates[i]);
            var order = 'Number ' + (i + 1) + ' out of ' + beneficiaries.length
            // console.log([date.toLocaleString(), contractAddress, web3.utils.fromWei(amount), order])
            if (bequeathalData["20"] === undefined){
              bequeathalData["20"] = [[date.toLocaleString(), contractAddress, web3.utils.fromWei(amount), order]]
            }else{
              bequeathalData["20"] = bequeathalData["20"].push([date.toLocaleString(), contractAddress, web3.utils.fromWei(amount), order])
            }
        }
    }
    }
    console.log(bequeathalData)
    return bequeathalData;
}).then(function(bequeathalData){
  console.log(bequeathalData)
  var ethers = bequeathalData["1"]
  var erc20s = bequeathalData["20"]
  if (ethers !== undefined){
    totalEthData = totalEthData.concat(ethers);
  }
  if (erc20s !== undefined){
    totalErc20_tokens = totalErc20_tokens.concat(erc20s);
  }
})
*/


        })
        .catch(function(e) {
            console.log(e);
        })
      var totalEthData = all_data[0];
      var totalErc20_tokens = all_data[1];
      var totalErc721_tokens = all_data[2];
    }


    $("#createTrustButton").click(function() {
        var toAddress = $("#address_0").val();
        var amount = parseFloat($("#amount").val());
        // var date = new Date($("#datepicker").val()).getTime()/1000;
        // var datetime = new Date($('#datetime0').val()).getTime()/1000;
        console.log(toAddress);
        console.log(amount);
        // TODO: type checking and error handling
        bequeath(toAddress, amount);
    });

    function claim() {
        contract.methods.claim().send({
                from: userAccount,
                gas: 250000
            })
            .catch(function(e) {
                console.log(e);
            });
    }

    $("#claimTrust").click(function() {
        claim();
    });

    var select = '';
    for (i = 0; i <= 25; i++) {
        select += '<option val=' + i + '>' + i + '</option>';
    }
    $('#erc20selector').html(select);
    $('#erc20selector').on('change', function() {
        addERC20addresses(this.value);
    })
    $("#beneficiary-selector").html(select);
    $('#beneficiary-selector').on('change', function() {
        addBeneficiaries(this.value);
    })

    function addERC20addresses(num) {
        htmlString = "";
        for (var i = 0; i < num; i++) {
            htmlString += `<div class=row><input id="erc20_` + i + `" type="text"  placeholder="Enter ERC-20 contract address here" onfocus="this.placeholder = ''"onblur="this.placeholder = 'Enter ERC-20 contract address here'">`
            htmlString += `<input id="erc20amount_` + i + `" type="text" style="width: 200px" placeholder="Amount of ERC-20 token" onfocus="this.placeholder = ''"onblur="this.placeholder = 'Amount of ERC-20 token'"></div>`
        }
        htmlString += `<button id="approve"class="small blue button">Approve Transfer</button>`
        $('#numERC20').html(num);
        $('#erc20addresses').html(htmlString);
        $('#approve').click(function() {
            approve(num);
        })
    }

    function addBeneficiaries(num) {
        htmlString = "";
        for (var i = 1; i <= num; i++) {
            htmlString += `<div class=row><input id="address_` + i + `" type="text" placeholder="Enter beneficiary ETH address here" onfocus="this.placeholder = ''" onblur="this.placeholder = 'Enter beneficiary ETH address here'">`
            htmlString += `<div class="form-group">
                          <div class='input-group date' id='datetimepicker` + (10 + i) + `'>
                              <input type='text' name='datetime' id='datetime` + i + `' class="form-control" />
                                    <span class="input-group-addon">
                          <span class="glyphicon glyphicon-calendar">
                          </span>
                                    </span>
                                </div>
                      </div></div>`
        }
        $('#numBens').html(num);
        $('#beneficiaries').html(htmlString);

        for (var i = 10; i < 10 + num; i++) {
            $('#datetimepicker' + i).datetimepicker({
                viewMode: 'years'
            });
        }
    }

    function approve(num) {
        console.log('approving ' + num + ' tokens')
        for (var i = 0; i < num; i++) {
            var _erc20contract = document.getElementById('erc20_' + i).value;
            var _erc20amount = document.getElementById('erc20amount_' + i).value;
            var abi_url = `http://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=` + _erc20contract + `&apikey=DABZHWXSF6ZGBVFH4VKD9B8QCW2ZHFZJQ8HI`; // + process.env.ETHERSCAN_API_KEY
            $.get(abi_url, (function(_erc20contract, _erc20amount) {
                return function(data) {
                    $.get(abi_url, function(data) {
                        abi = JSON.parse(data.result);
                        tokenContract = new web3.eth.Contract(abi, _erc20contract);
                        console.log('approving ' + _erc20amount + ' of ' + _erc20contract);
                        tokenContract.methods.approve(contractAddress, web3.utils.toWei(_erc20amount.toString(), 'ether')).send({
                            from: userAccount
                        });
                    });
                }
            })(_erc20contract, _erc20amount));
        }
    }


    function get_symbol(_erc20contract) {
        var abi_url = `http://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=` + _erc20contract + `&apikey=DABZHWXSF6ZGBVFH4VKD9B8QCW2ZHFZJQ8HI`; // + process.env.ETHERSCAN_API_KEY
        $.get(abi_url, (function(_erc20contract) {
            return function(data) {
                $.get(abi_url, function(data) {
                    abi = JSON.parse(data.result);
                    tokenContract = new web3.eth.Contract(abi, _erc20contract);
                    // console.log(tokenContract.options.jsonInterface);
                    return tokenContract.methods.symbol().call();
                    // tokenContract.methods.approve(contractAddress, web3.utils.toWei(_erc20amount.toString(), 'ether')).send({from: userAccount});
                });
            }
        })(_erc20contract));

    }

    $(function() {
        $('#datetimepicker9').datetimepicker({
            viewMode: 'years'
        });
    });

}
$(document).ready(app);
