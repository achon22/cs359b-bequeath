pragma experimental ABIEncoderV2; // Adds ability to pass structs as function arguments.

contract BequeathContract {

  struct Erc20Amount {
    address contractAddress;
    uint amount;
  }

  struct Bequeathal {
     address beneficiary;
     uint ethAmount;
     uint withdrawalDate;
     Erc20Amount[] erc20Amounts;
  }

  mapping (address => Bequeathal[]) private BeneficiaryToBequeathals;
  mapping (address => Bequeathal[]) private DonorToBequeathals;
  uint256 balance;

  constructor() public {
   balance = 0;
  }

  function bequeath(address _beneficiary, uint _withdrawalDate) public payable returns (bool success){
    require(DonorToBequeathal[msg.sender].beneficiary == 0 && BeneficiaryToDonor[_beneficiary] == 0);
    if (BeneficiaryToDonor[_beneficiary] == 0){

      Bequeathal memory newBequeathal = Bequeathal(_beneficiary, msg.value, _withdrawalDate);
    }

    BeneficiaryToDonor[_beneficiary] = msg.sender;
    DonorToBequeathal[msg.sender] = newBequeathal;

    balance += msg.value;
    return true;
  }

  function claim() public payable returns (bool success){
     address _donor = BeneficiaryToDonor[msg.sender];
     require(_donor != 0);
     Bequeathal storage withdrawal = DonorToBequeathal[_donor];
     require(withdrawal.withdrawalDate <= block.timestamp);
     balance -= withdrawal.ethAmount;
     msg.sender.transfer(withdrawal.ethAmount);
     delete BeneficiaryToDonor[msg.sender];
     delete DonorToBequeathal[_donor];
     return true;
  }
}
