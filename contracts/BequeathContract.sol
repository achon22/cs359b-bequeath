pragma solidity ^0.4.21;

contract BequeathContract {
 struct Bequeathal {
     string type;
     uint amount; //number of ether, erc20, or erc721 token id
     address[] beneficiaries;
     uint[] dates;
     address contractAddress;
 }

 /* mapping (address => address) private BeneficiaryToDonor; */
 mapping (uint => Bequeathal) private IdToBequeathal;
 mapping (address => uint[]) private BeneficiaryToIds;
 uint256 balance;
 uint256 current_id;
 constructor() public{
   balance = 0;
   current_id = 0;
 }

 function bequeath(string _type, address _contractAddress, address[] _beneficiaries, uint[] _dates, uint256[] _tokenIds) public payable returns (bool success){
    require(IdToBequeathal[current_id+1]==0);
    current_id+=1;
    BeneficiaryToIds[msg.sender].push(current_id);

    if (_type=="ether") {
      Bequeathal memory newBequeathal = Bequeathal(_type, msg.value, _beneficiaries, _dates, 0x0);
      IdToBequeathal[current_id] = newBequeathal;
      fillBeneficiaryToIds(_beneficiaries, current_id);
      balance+=msg.value;
    } else if (_type=="erc20") {
      //assume approved
       ERC20Token tokenContract = ERC20Token(_contractAddress);
       uint amount = tokenContract.allowance(msg.sender, address(this));
       bool success = tokenContract.transferFrom(msg.sender, address(this), amount);
       if (success) {
         Bequeathal memory newBequeathal = Bequeathal(_type, amount, _beneficiaries, _dates, _contractAddress);
         IdToBequeathal[current_id]=newBequeathal;
         fillBeneficiaryToIds(_beneficiaries, current_id);
       } else {
         return false;
       }
    } else if (_type=="erc721"){
       ERC721Token tokenContract = ERC721Token(_contractAddress);

       for (uint i = 0; i < _tokenIds.length; i++) {
          uint256 id = _tokenIds[i];
          if (tokenContract.getApproved(id)==msg.sender) {
            tokenContract.safeTransferFrom(msg.sender, address(this), id, 0);
            Bequeathal memory newBequeathal = Bequeathal(_type, id, _beneficiaries, _dates, _contractAddress);
            IdToBequeathal[current_id+i]=newBequeathal;
            fillBeneficiaryToIds(_beneficiaries, current_id);
          }
          current_id += _tokenIds.length;
       }
    }

    return true;
 }

 function fillBeneficiaryToIds(uint256[] _beneficiaries, uint256 id) {
   for (uint i = 0; i < _beneficiaries.length; i++) {
     BeneficiaryToIds[_beneficiaries[i]].push(id);
   }
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
/*
mapping(address => id[])

id0 -> Bequeathal struct
		{
		type: ether
		contract address: null
		Amount,
		address[]
		dates[]
		}

id1 -> Bequeathal struct
		{
		type: erc-20 augur
		contract address
		Amount,
		address[]
		dates[]
		}

id2 -> Bequeathal struct
		{
		type: erc-721 cryptokitties
		contract address
		Amount,
		address[]
		dates[]
		}
*/
