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
		logger.addInfo(responseBody)
	}
}
