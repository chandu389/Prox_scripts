/**
 * @file
 * This custom task will get API response for getEnvironment
 *
 *	 INPUTS:
 *
 *	 OUTPUTS:
 *		{GenericTextInput} xmlResponse XML response for getEnvironment API
 *
 *
 * @author G V R Chandra Reddy <vgolugur@cisco.com>
 * @version  0.1
 * @Date 12 June 2017
 * @namespace parsexmlResponse
 */

//IMPORTS
importPackage(java.util);
importPackage(java.lang);
importPackage(java.io);
importPackage(java.net);
importPackage(java.security);
importPackage(javax.net.ssl);
importPackage(org.apache.commons.httpclient);
importPackage(org.apache.commons.httpclient.methods);
importPackage(org.apache.commons.httpclient.protocol);
importPackage(org.apache.commons.httpclient.auth);


//FUNCTIONS

function getEnvironment(URL){
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

//
// MAIN PROGRAM
//

 output.xmlResponse = getEnvironment("http://connectivity.cumulosslab.local/api/getEnvironment");
