/*
Name: PSC_Add_SI_Record.js
Author: Alejandro Madurga (almadurg@cisco.com)
Date: 17h December 2015
Version: 1.0
UCSD Version: 5.3
PSC Version 11.1 (Virtual Appliance)

Description:
	This Custom adds a new record to an existing table in PSC

	//INPUTS:
		PSCCredentials: [Credential Policy] Mandatory
		PSCIP: [Generic Text input] Mandatory
		SITableName: [Generic Text input] Mandatory
		SIData:[Generic Text Input] Mandatory, it should have the following format:
		[FieldName1]=[FieldValue1];[FieldName2]=[FieldValue2];
		rollback: [Boolean] If checked, the SI will be deleted on rollback.

	//OUTPUTS
		NONE
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

function addSI(PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action){
  if (PSCProtocol == "http"){
		var httpsClient = new HttpClient();
		httpsClient.getHostConfiguration().setHost(PSCIP, 80, "http");
	}else{
		var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	}

	httpsClient.getParams().setCookiePolicy("default");
	//Create the JSON estructure
	var jsonData = new HashMap();
	var serviceitem = new HashMap();
	var serviceItemData = new HashMap();
	var serviceItemAttribute = util.createNameValueList();
	for (i=0;i<SIData.length;i++){
		var name = SIData[i].split("=")[0];
		var value = SIData[i].split("=")[1];
		serviceItemAttribute.addNameValue(name,value);
	}
	serviceItemData.put("serviceItemAttribute",serviceItemAttribute.getList())
	serviceitem.put("name",SITableName);
	serviceitem.put("serviceItemData",serviceItemData);
	jsonData.put("serviceitem",serviceitem);
	var tableURL = "/RequestCenter/nsapi/serviceitem/process";
	if(action == "Create"){
		var httpMethod = new PostMethod(tableURL);
	}
	else{
		var httpMethod = new PutMethod(tableURL);
	}
	var dataPayload = String(JSON.javaToJsonString(jsonData, jsonData.getClass()));
	//dataPayload = dataPayload.replace(/'/g, '"');
	requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
	httpMethod.setRequestEntity(requestEntity);
	httpMethod.addRequestHeader("username", PSCUser);
	httpMethod.addRequestHeader("password", PSCPassword);
	httpsClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{
		logger.addError("Unable to add the new SI on the table " + SITableName + ". HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
	    // Set this task as failed.
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		var responseBody = String(httpMethod.getResponseBodyAsString());
		logger.addInfo(responseBody)
	}
}

//This function uses the custom SSH Command Task to run the undo commands.
function registerUndoTask(PSCCredentials,PSCIP,SITableName,SIName)
{

	var handler = "custom_PSC_Delete_SI_Record";
	var task = ctxt.createInnerTaskContext("custom_PSC_Delete_SI_Record");

    task.setInput("PSCCredentials",PSCCredentials);
	task.setInput("PSCIP",PSCIP);
	task.setInput("SITableName",SITableName);
	task.setInput("SIName",SIName);
    ctxt.getChangeTracker().undoableResourceModified("Delete Service Item.",
                String(ctxt.getSrId()),
                "Delete Service Item",
				"Table: " + SITableName + " Name: " + SIName ,
                handler,
                task.getConfigObject());
}


//
//	MAIN PROGRAM
//
var PSCCredentials  = String(input.PSCCredentials)
var PSCIP  = String(input.PSCIP)
var SITableName  = String(input.SITableName);
var SIData = String(input.SIData).split(";");
var action = String(input.action);
var rollback = String(input.rollback);
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

addSI(PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action);
if(rollback == "true" && action == "Create"){
	for(i=0;i<SIData.length;i++){
		var name = SIData[i].split("=")[0];
		var value = SIData[i].split("=")[1];
		if (name == "Name"){
			var SIName = value;
		}
	}
	registerUndoTask(PSCCredentials,PSCIP,SITableName,SIName)
}
