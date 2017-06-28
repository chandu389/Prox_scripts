/*
* Name: requestLinuxServer.js
* Author: G V R Chandra Reddy (vgolugur@cisco.com)
* Date: 30th June 2017
* Version: 0.1
* UCSD Version: 6.0
*
* Description:
*	This custom task gets OS Version
*
*	//INPUTS:
*    {GenericTextInput} technicalOwner
*    {GenericTextInput} functionality
*    {GenericTextInput} applicationOwner
*    {GenericTextInput} applicationHotline
*    {GenericTextInput} applicationSchema
*    {GenericTextInput} location
*    {GenericTextInput} hardwareArch
*    {GenericTextInput} projectName
*    {GenericTextInput} projectCode
*    {GenericTextInput} memory
*    {GenericTextInput} applicationCode
*    {GenericTextInput} cpu
*    {GenericTextInput} OSDisk
*    {GenericTextInput} dataStorage
*    {GenericTextInput} newName
*    {GenericTextInput} os
*    {GenericTextInput} network
*    {GenericTextInput} appFileSystems
*    {GenericTextInput} replicated
*    {GenericTextInput} domain
*    {GenericTextInput} environment
*    {GenericTextInput} requester
*    {GenericTextInput} oldserver
*    {GenericTextInput} supportlevel
*    {GenericTextInput} users
*    {GenericTextInput} groups
*    {GenericTextInput} wave
*    {GenericTextInput} vlan
*    {GenericTextInput} cluster
*    {GenericTextInput} vm
*    {GenericTextInput} servertype
*    {GenericTextInput} ansible_template
*    {GenericTextInput} orderid
*    {GenericTextInput} recovery_plan
*    {GenericTextInput} external_ref
*
*	//OUTPUTS:
    xmlResponse : Returns a String which is used to create SI in PSC

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
	var httpMethod = new PutMethod(URL);
	httpMethod.addRequestHeader("Content-type", "text/xml");
	var dataPayload = 'technicalowner='+input.technicalOwner+
						'&functionality='+input.functionality+
						'&applicationowner='+input.applicationOwner+
						'&applicationhotline='+input.applicationHotline+
						'&applicationschema='+input.applicationSchema+
						'&location='+input.location+
						'&hardwarearch='+input.hardwareArch+
						'&projectname='+input.projectName+
						'&projectcode='+input.projectCode+
						'&memory='+input.memory+
						'&applicationcode='+input.applicationCode+
						'&cpu='+input.cpu
						+'&osdisk='+input.OSDisk+
						'&datastorage='+input.dataStorage+
						'&newname='+input.newName+
						'&os='+input.OS+
						'&network='+input.network+
						'&applfilesystems='+input.appFileSystems+
						'&replicated='+input.replicated+
						'&domain='+input.domain+
						'&environment='+input.environment+
						'&requester='+input.requester+
						'&oldserver='+input.oldServer+
						'&supportlevel='+input.supportLevel+
						'&users='+input.users+
						'&groups='+input.groups+
						'&wave='+input.wave+
						'&vlan='+input.vlan+
						'&cluster='+input.cluster+
						'&vm='+input.vm+
						'&servertype='+input.serverType+
						'&ansible_template='+input.ansibleTemplate+
						'&orderid='+input.orderId+
						'&recovery_plan='+input.recoveryPlan+
						'&external_ref=';
	var requestEntity = new StringRequestEntity(dataPayload,"text/xml","UTF-8");
	httpMethod.setRequestEntity(requestEntity);
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
output.xmlResponse = getOSVersion("http://connectivity.cumulosslab.local/api/RequestLinuxServer");
