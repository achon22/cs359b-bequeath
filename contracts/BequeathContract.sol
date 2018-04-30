pragma solidity ^0.4.21;

contract BequeathContract {
 struct Bequeathal {
     address beneficiary;
     uint amount;
     uint withdrawalDate;
 }
 mapping (address => address) private BeneficiaryToDonor;
 mapping (address => Bequeathal) private DonorToBequeathal;
 uint256 balance;

 constructor() public{
   balance = 0;
 }

 function bequeath(address _beneficiary, uint _withdrawalDate) public payable returns (bool success){
    require(DonorToBequeathal[msg.sender].beneficiary == 0 && BeneficiaryToDonor[_beneficiary] == 0);
    BeneficiaryToDonor[_beneficiary] = msg.sender;
    Bequeathal memory newBequeathal = Bequeathal(_beneficiary, msg.value, _withdrawalDate);
    DonorToBequeathal[msg.sender] = newBequeathal;
    balance += msg.value;
    return true;
 }

 function claim() public payable returns (bool success){
     address _donor = BeneficiaryToDonor[msg.sender];
     require(_donor != 0);
     Bequeathal storage withdrawal = DonorToBequeathal[_donor];
     require(withdrawal.withdrawalDate <= block.timestamp);
     balance -= withdrawal.amount;
     msg.sender.transfer(withdrawal.amount);
     delete BeneficiaryToDonor[msg.sender];
     delete DonorToBequeathal[_donor];
     return true;
 }
}
