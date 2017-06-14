/*
Name: getAccount.js
Author: G V R Chandra Reddy (vgolugur@cisco.com)
Date: 13th June 2017
Version: 1.0
UCSD Version: 6.0

Description:
	This Custom task gets a Credential Policy from UCSD

	//INPUTS:
		accountName: [Credential Policy] Mandatory

	//OUTPUTS:
		account :[CredentialPolicy]: PSC Account.
*/
//IMPORTS
importPackage(java.util);
importPackage(java.lang);
importPackage(java.io);
importPackage(java.net);
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);


	/**
    * Get the Credentials from the Credentials policy.
    *
    * @return account with the username, password, port and protocol.
    */

function getAccount(accountName){
	logger.addInfo("Looking for the following account:" + accountName);
	var account = PersistenceUtil.getCredentialPolicyByName(accountName);
	if (account != null){
		logger.addInfo("Account:" + accountName + " found.");
		return account;
	}
	else{
		logger.addError("Account:" + accountName + " NOT found.");
		ctxt.setFailed("No Account found with name: " + accountName);
	}
}
