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
    logger.addInfo("Payload:"+dataPayload);
	requestEntity = new StringRequestEntity(dataPayload,"application/json","UTF-8");
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
