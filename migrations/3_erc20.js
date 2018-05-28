var FixedSupplyToken = artifacts.require("FixedSupplyToken");

FixedSupplyToken.deployed()
.then(inst=>{
  console.log('instance address is ' + inst.address);
})
module.exports = function(deployer){
  deployer.deploy(FixedSupplyToken, {from: '0x627306090abaB3A6e1400e9345bC60c78a8BEf57'});
};
