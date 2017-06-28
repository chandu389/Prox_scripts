/*
* Name: SITasks.js
* Author: G V R Chandra Reddy (vgolugur@cisco.com)
* Date: 12th June 2017
* Version: 0.1
*
* Description:
	This file contains PSC SI Create/Update/Delete tasks
*
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
importPackage(org.json);


//FUNCTIONS

/**
* Checks whether an entry exists in PSC Table.
*
* @return None
* @memberof PSC
*/

function callPSCCheckSITable(PSCCredentials,PSCIP,SITableName,filter){
    var task = ctxt.createInnerTaskContext("custom_PSC_Check_SITable");
    logger.addInfo("PSC Credentials:"+PSCCredentials);
    task.setInput("PSCCredentials",PSCCredentials);
    task.setInput("PSCIP",PSCIP);
    task.setInput("SITableName",SITableName);
    task.setInput("filter",filter);
    task.execute();
}

/**
* Adds an entry in PSC Table.
*
* @return None
* @memberof PSC
*/

function callPSCAddSI(PSCCredentials,PSCIP,SITableName,SIData,action,enableRollback){
	var task = ctxt.createInnerTaskContext("custom_PSC_Add_SI_Record");
	logger.addInfo("PSC Credentials:"+PSCCredentials);
	task.setInput("PSCCredentials",PSCCredentials);
	task.setInput("PSCIP",PSCIP);
	task.setInput("SITableName",SITableName);
	task.setInput("SIData",SIData);
	task.setInput("action",action);
	task.setInput("rollback",enableRollback);
	task.execute();
}

	/**
     * Get the JSON table from PSC with ALL the rows if no filter is used.
     *
     * @return JSON String with the table details.
     */
function getSITable(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,filter){
	if (PSCProtocol == "http"){
		var httpsClient = new HttpClient();
		httpsClient.getHostConfiguration().setHost(PSCIP, 80, "http");
	}else{
		var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	}
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
        httpMethod.releaseConnection();
		//logger.addInfo(responseBody)
		return responseBody;

	}
}

/**
 * Add entry to Service Item Table in PSC
 *
 * @return None.
 */

function addSI(PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action){
  if (PSCProtocol == "http"){
		var httpsClient = new HttpClient();
		httpsClient.getHostConfiguration().setHost(PSCIP,PSCPort,PSCProtocol);
	}else{
		var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	}

	httpsClient.getParams().setCookiePolicy("default");
	//Create the JSON estructure
	var jsonData = new HashMap();
	var serviceitem = new HashMap();
	var serviceItemData = new HashMap();
	var serviceItemAttribute = util.createNameValueList();
	for (var i=0;i<SIData.length;i++){
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
	dataPayload = dataPayload.replace(/'/g, '"');
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
        httpMethod.releaseConnection();
		//logger.addInfo(responseBody)
	}
}

 /**
 * Get the JSON table from PSC with ALL the rows if no filter is used.
 *
 * @return None.
 */

function getSITablePost(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,filter){
	if (PSCProtocol == "http"){
		var httpsClient = new HttpClient();
		httpsClient.getHostConfiguration().setHost(PSCIP, 80, "http");
	}else{
		var httpsClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
	}
	httpsClient.getParams().setCookiePolicy("default");
	if(SITableName.indexOf("Si")!=0){
		SITableName = "Si" + SITableName;
	}
	var tableURL = "/RequestCenter/nsapi/serviceitem/" +  SITableName;
	var httpMethod = new PostMethod(tableURL);
    var filterJson = new HashMap();
    filterJson.put("filterString",filter);
    var dataPayload = String(JSON.javaToJsonString(filterJson, filterJson.getClass()));
	dataPayload = dataPayload.replace(/'/g, '"');
	requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
    httpMethod.setRequestEntity(requestEntity);
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
		//logger.addInfo("Table " + SITableName + " retrieved successfully.");
		var responseBody = String(httpMethod.getResponseBodyAsString());
        httpMethod.releaseConnection();
		//logger.addInfo(responseBody)
		return responseBody;

	}
}

/**
* Get the JSON table from PSC with ALL the rows if no filter is used - a variant of getSITablePost as it takes httpclient as input.
*
* @return None.
*/

function getSITablePostwithClient(httpsClient,PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,filter){
	if(SITableName.indexOf("Si")!=0){
		SITableName = "Si" + SITableName;
	}
	var tableURL = "/RequestCenter/nsapi/serviceitem/" +  SITableName;
	var httpMethod = new PostMethod(tableURL);
    var filterJson = new HashMap();
    filterJson.put("filterString",filter);
    var dataPayload = String(JSON.javaToJsonString(filterJson, filterJson.getClass()));
	dataPayload = dataPayload.replace(/'/g, '"');
	requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
    httpMethod.setRequestEntity(requestEntity);
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
		//logger.addInfo("Table " + SITableName + " retrieved successfully.");
		var responseBody = String(httpMethod.getResponseBodyAsString());
		//logger.addInfo(responseBody)
		return responseBody;

	}
}

/**
 * Add entry to Service Item Table in PSC - it is a variant of addSI function as it takes httpclient as input.
 *
 * @return None.
 */
function addSIwithClient(httpsClient,PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action){

	//Create the JSON estructure
	var jsonData = new HashMap();
	var serviceitem = new HashMap();
	var serviceItemData = new HashMap();
	var serviceItemAttribute = util.createNameValueList();
	for (var i=0;i<SIData.length;i++){
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
	dataPayload = dataPayload.replace(/'/g, '"');
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

		//logger.addInfo(responseBody)
	}
}
