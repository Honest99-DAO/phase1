export const ERRORS = {
  // ACCOUNTANT
  '$ACC1': "The caller already received dividends this month",
  '$ACC2': "No funds to receive dividends",
  '$ACC3': "Unable to receive dividends right after dividends distribution period reset",
  '$ACC4': "Maintenance percent should be less than 100%",
  '$ACC5': "Distribution session interval should be between 1 and 365 days",

  // CASINO
  '$CAS1': "Guess number should be between 0 and 99",
  '$CAS2': "Bet x10 can't be more than total locked value",
  '$CAS3': "Bet can't be more than 20 ethers",
  '$CAS4': "The account didn't place a bet",
  '$CAS5': "Blockhash history only stored for 255 blocks",
  '$CAS6': "Prize fund is exhausted",
  '$CAS7': "Fee transfer failed",
  '$CAS8': "Unable to claim a prize in the same block",
  '$CAS9': "Unable to set prize multiplier more than 99",

  // NINE TOKEN
  '$NIN1': "Max total supply reached",
  '$NIN2': "Unable to mint without investing",
  '$NIN3': "New max total supply is lesser than previous",
  '$NIN4': "To much funds for deployment sent (only 1 ether total needed)",
  '$NIN5': "The value does not fit in MAX_UINT192",
  '$NIN6': "The value does not fit in MAX_UINT64",

  // REGISTRY
  '$REG1': "Casino contract is unset",
  '$REG2': "Voting contract is unset",
  '$REG3': "Accountant contract is unset",
  '$REG4': "NineToken contract is unset",
  '$REG5': "The caller is not the Voting contract",

  // VOTING
  '$VOT1': "Voting max duration is 365 days",
  '$VOT2': "The caller should posses at least some Nines to start COMMON voting",
  '$VOT3': "UPGRADE voting type can't be NONE",
  '$VOT4': "Provide valid nextVersion address",
  '$VOT5': "LEADER ELECTION should last at least 14 days",
  '$VOT6': "The caller should posses at least 10 Nines to start UPGRADE or CHANGE voting",
  '$VOT7': "CHANGE voting type can't be NONE",
  '$VOT8': "CHANGE voting should last at least 7 days",
  '$VOT9': "",
  '$VOT10': "",
  '$VOT11': "The votings deadline has passed",
  '$VOT12': "The callers weight is 0",
  '$VOT13': "This voting is already executed",
  '$VOT14': "This voting didn't end yet",
  '$VOT15': "The caller should posses at least 10 Nines to execute a voting",
  '$VOT16': "The voting does not exist",
  '$VOT17': "The vote status can't be NONE",
  '$VOT18': "Unable to vote right after voting creation",
  '$VOT19': "Only the leader can perform this action",
  '$VOT20': "",
  '$VOT21': "",

  // REGISTERED WITH CAPITAL
  '$RWC1': "Unable to migrate capital to empty address",

  // REGISTERED
  '$RGD1': "Initial setting of the Registry contract is only possible once",
  '$RGD2': "Registry is unset",
  '$RGD3': "This action can only be done via voting",
  '$RGD4': "This action can only be performed by leader",

  // ERC777 WITH HISTORY
  '$EWH1': "Balance history lookup failed"
};