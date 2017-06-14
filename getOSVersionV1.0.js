/*
Name: getOSVersion.js
Author: Chandra Reddy (vgolugur@cisco.com)
Date: 30th May 2017
Version: 0.1
UCSD Version: 6.0

Description:
	This custom task gets OS Version

	//INPUTS:

	//OUTPUTS:
  outStr : Returns a String which is used to create SI in PSC

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
importPackage(javax.net.ssl);
importPackage(org.apache.commons.httpclient);
importPackage(org.apache.commons.httpclient.methods);
importPackage(org.apache.commons.httpclient.protocol);
importPackage(com.cloupia.lib.util.easytrust);
importPackage(org.apache.commons.httpclient.auth);
importPackage(org.json);
importPackage(org.w3c.dom);
importPackage(javax.xml.parsers);
loadLibrary("Generic/generateUUID");

//FUNCTION

function getOSVersion(URL){
	var httpClient = new HttpClient();
	httpClient.getParams().setCookiePolicy("default");
	var URL = URL
	var httpMethod = new GetMethod(URL);
	httpMethod.addRequestHeader("Content-type", "text/xml");
	httpClient.executeMethod(httpMethod);
	var statuscode = httpMethod.getStatusCode();
	if (statuscode != 200)
	{
		logger.addError("Unable to process the request. HTTP response code: " + statuscode);
		logger.addError("Response = "+httpMethod.getResponseBodyAsString());
	 	httpMethod.releaseConnection();
		ctxt.setFailed("Request failed.");
		ctxt.exit()
	} else {
		var responseBody = String(httpMethod.getResponseBodyAsString());
		logger.addInfo("REST API Executed successfully, RAW result: " + responseBody);
		return responseBody;
	}
}

//main function

var response = getOSVersion("http://connectivity.cumulosslab.local/api/getOSVersion");
var factory = DocumentBuilderFactory.newInstance();
var builder = factory.newDocumentBuilder();
var xmlStringBuilder = new StringBuilder();
xmlStringBuilder.append("<?xml version='1.0'?>"+response);
var respxml =  new ByteArrayInputStream( xmlStringBuilder.toString().getBytes('UTF-8') );
var doc = builder.parse(respxml);
var list = doc.getElementsByTagName("os");
var UUIDStr = generateUUID();
var outStr = "Name="+UUIDStr+";OSVersion="+list.item(0).getTextContent()+";";
output.OSJsonStr = outStr;
output.filter = "Name="+UUIDStr;
