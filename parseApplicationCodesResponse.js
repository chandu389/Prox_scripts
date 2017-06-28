/**
 * @file
 * This Custom task parse the response from getApplicationCodes API and pushes them to SiApplicationCodes
 *
 *	 INPUTS:
 *		{GenericTextInput} PSCCredentials Credentials of PSC account
 *		{GenericTextInput} PSCIP The IP Address of PSC
 *		{GenericTextInput} SITableName The name of Service Item Table where data needs to be added
 *
 *	 OUTPUTS:
 *
 * @author G V R Chandra Reddy <vgolugur@cisco.com>
 * @version  0.1
 * @Date 12 June 2017
 * @namespace parseApplicationCodesResponse
 */


importPackage(java.util);
importPackage(java.lang);
importPackage(java.io);
importPackage(java.net);
importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);
importPackage(org.json);
importPackage(org.w3c.dom);
importPackage(javax.xml.xpath);
importPackage(javax.xml.parsers);
importPackage(java.util.concurrent);
loadLibrary("Generic/getAccount");
loadLibrary("Generic/generateUUID");
loadLibrary("PSC/SITasks");

//
//	MAIN PROGRAM
//

var PSCAccount		= 	getAccount(input.PSCCredentials);
var PSCUser			= 	PSCAccount.getUserName();
var PSCPassword 	= 	PSCAccount.getPassword();
var PSCPort       	= 	parseInt(String(PSCAccount.getPort()));
var PSCProtocol   	= 	String(PSCAccount.getProtocal());
var PSCIP           = 	input.PSCIP;
var SITableName   	= 	input.SITableName;
var factory = DocumentBuilderFactory.newInstance();
var builder = factory.newDocumentBuilder();
var xmlStringBuilder = new StringBuilder();
xmlStringBuilder.append("<?xml version='1.0'?>"+input.xmlResponse);
var respxml =  new ByteArrayInputStream( xmlStringBuilder.toString().getBytes('UTF-8') );
var doc = builder.parse(respxml);
logger.addInfo("Root element :" + doc.getDocumentElement().getNodeName());
var xPath =  XPathFactory.newInstance().newXPath();
var expression = "/lmc/result";
var list = xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);
var UUIDStr,exists,action,filter,SIData,code,description;
if (PSCProtocol == "http"){
    var httpClient = new HttpClient();
    httpClient.getHostConfiguration().setHost(PSCIP, 80, "http");
}else{
    var httpClient = CustomEasySSLSocketFactory.getIgnoreSSLClient(PSCIP,PSCPort);
}
httpClient.getParams().setCookiePolicy("default");
for(var i=0;i<list.length;i++){
  SIData = [];
  try{
  	code = list.item(i).getElementsByTagName("code").item(0).getTextContent().replace(/\s*$/,"");
  	description = list.item(i).getElementsByTagName("description").item(0).getTextContent().replace(/;/g, ',');
  }catch(err){
    logger.addError("failed:"+err.message);
    continue;
  }

  if (code == null || code == "" || code == "FortÃ© C/C++"){
	  continue;
  }else if(code.indexOf("(") != -1 || code.indexOf(")") != -1 ||  code.indexOf("\n") != -1){
	  code = code.replace(/[\(,\),\n]/g,'');
  }

  filter = "code="+code;
  var data 		    = 	getSITablePostwithClient(httpClient,PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,filter);
  var jsonData		= 	String(data);  //Get the JSON String.
  var results 		= 	new JSONObject(jsonData);
  var serviceitem 		= 	results.getJSONObject("serviceitem");
  var serviceItemData 	=	serviceitem.getJSONArray("serviceItemData");
  if (serviceItemData.length() > 0){
	 var row = serviceItemData.getJSONObject(0);
	 var items = row.getJSONArray("items");
	 var fields = items.getJSONObject(0);
     if(code == null || code == "" || (code == String(fields.get("code")) && description == String(fields.get("description")))){
        continue;
     }else{
         action	 = "Update";
         SIData.push("Name="+String(fields.get("Name")));
    	 SIData.push("code="+code);
    	 SIData.push("description="+description);
     }
	 //SIData    = SIData.replace("/(.*?)=.*?;(.*)/","$1="+generateUUID()+";$2");
  }else{
	  UUIDStr = generateUUID();
	  action = "Create";
	  SIData = ["Name="+UUIDStr,"code="+code,"description="+description];
  }
  addSIwithClient(httpClient,PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action);
  //if(i%1000 == 0 && i != 0){
    //  logger.addInfo("Entering into sleep mode...");
      //TimeUnit.SECONDS.sleep(240);
  //}
}
