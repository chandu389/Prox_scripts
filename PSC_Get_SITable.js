/*
Name: PSC_Get_SITable.js
Author: Alejandro Madurga (almadurg@cisco.com)
Date: 16th December 2015
Version: 1.0
UCSD Version: 5.3
PSC Version 11.1 (Virtual Appliance)

Description:
	This Custom task gets a table for a SI defined in PSC

	//INPUTS:
		PSCCredentials: [Credential Policy] Mandatory
		PSCIP: [Generic Text input] Mandatory
		SITableName: [Generic Text input] Mandatory
		filter: [Generic Text Input] Optional Filter, if there is a filter, it will be used on the query.
			Format should be [FieldName][Operator][FieldValue]
			ie: Name=test
			Refer to the Integration guide for futher information.

	//OUTPUTS
		SITableData:[Generic Text Input]: The JSON Table from PSC.
*/

//IMPORTS
importPackage(java.util);
importPackage(java.lang);
importPackage(java.io);
importPackage(java.net);
importPackage(java.security);
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);
importPackage(com.cloupia.lib.util);
importClass(com.cloupia.lib.util.JSON);
importPackage(javax.net.ssl);
importPackage(com.cloupia.model.cIM);
importPackage(com.cloupia.service.cIM.inframgr);
importPackage(org.apache.commons.httpclient);
importPackage(org.apache.commons.httpclient.methods);
importPackage(org.apache.commons.httpclient.protocol);
importPackage(com.cloupia.lib.util.easytrust);
importPackage(com.cloupia.lib.cIaaS.vcd.api);


//FUNCTIONS

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

   /**
     * Get the JSON table from PSC with ALL the rows if no filter is used.
     *
     * @return JSON String with the table details.
     */
function getSITable(PSCIP,PSCPort,PSCUser,PSCPassword,SITableName,filter){
	var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	httpsClient.getParams().setCookiePolicy("default");
	if(SITableName.indexOf("Si")!=0){
		SITableName = "Si" + SITableName;
	}
	var tableURL = "/RequestCenter/nsapi/serviceitem/" +  SITableName;
	if (filter !=""){
		tableURL = tableURL + "/" + filter;
	}
	var httpMethod = new GetMethod(tableURL);
	httpMethod.addRequestHeader("username", PSCUser);
	httpMethod.addRequestHeader("password", PSCPassword);
	httpMethod.addRequestHeader("Content-type", "application/json");
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{
		logger.addError("Unable to get the table data with name " + SITableName + ". HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		logger.addInfo("Table " + SITableName + " retrieved successfully.");
		var responseBody = String(httpMethod.getResponseBodyAsString());
		logger.addInfo(responseBody)
		return responseBody;

	}
}

//
//	MAIN PROGRAM
//
var PSCCredentials  = String(input.PSCCredentials)
var PSCIP  = String(input.PSCIP)
var SITableName  = String(input.SITableName)
var filter = String(input.filter)

//Get the info from the account.
var PSCAccount = getAccount(PSCCredentials);
var PSCUser = PSCAccount.getUserName();
var PSCPassword = PSCAccount.getPassword();
var PSCPort = parseInt(String(PSCAccount.getPort()));
var PSCProtocol = String(PSCAccount.getProtocal());

//Show Connection Info.
logger.addInfo("Using the following parameters from the selected account: " + PSCCredentials);
logger.addInfo(" ---- Username: " + PSCUser );
logger.addInfo(" ---- Protocol: " + PSCProtocol);
logger.addInfo(" ---- Port: " + String(PSCPort));

//var token = PSCLogin(PSCIP,PSCUser,PSCPassword,PSCPort);
output.SITableData = getSITable(PSCIP,PSCPort,PSCUser,PSCPassword,SITableName,filter);
// A sample JSON parser for the future:
var jsonData = String(output.SITableData);  //Get the JSON String.
importPackage(org.json)
var results = new JSONObject(jsonData);
var serviceitem = results.getJSONObject("serviceitem");
var serviceItemData = serviceitem.getJSONArray("serviceItemData")
logger.addInfo("Total Rows: " + String(serviceItemData.length()));
for (i=0;i<serviceItemData.length();i++){
	logger.addInfo("Showing Row: " + String(i+1));
	var row = serviceItemData.getJSONObject(i);
	var items = row.getJSONArray("items");
	var fields = items.getJSONObject(0);
	var iterator = fields.keys();
	logger.addInfo("Fields: ")
	while(iterator.hasNext()){
		var fieldName = iterator.next();
		logger.addWarning(String(fieldName) + " = " + fields.getString(fieldName));
    }
}
