/**
 * @file
 * This Custom task parse the response from viewAnsibleScripts API and pushes them to SiAnsible
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
 * @namespace parseAnsibleResponse
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
var UUIDStr,exists,action,filter,SIData,id,friendly_name,os,template;
for(var i=0;i<list.length;i++){
	SIData    = [];
	UUIDStr = generateUUID();
  	try{
	    id = list.item(i).getElementsByTagName("id").item(0).getTextContent();
	  	friendly_name = list.item(i).getElementsByTagName("friendly_name").item(0).getTextContent();
	  	os = list.item(i).getElementsByTagName("os").item(0).getTextContent();
	  	template = list.item(i).getElementsByTagName("template").item(0).getTextContent();
	}catch(err){
	    logger.addError("failed:"+err.message);
	    continue;
	}
	logger.addInfo("############## Name:"+UUIDStr);
	logger.addInfo("############## ID:"+id);
  	logger.addInfo("############## friendly_name:"+friendly_name);
  	logger.addInfo("############## os:"+os);
  	logger.addInfo("############## template:"+template);
	filter = "id="+id+"|AND|os="+os+"|AND|template="+template;
	var data 		    = 	getSITable(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,encodeURI(filter));
    var jsonData		= 	String(data);  //Get the JSON String.
    var results 		= 	new JSONObject(jsonData);
    var serviceitem 		= 	results.getJSONObject("serviceitem");
    var serviceItemData 	=	serviceitem.getJSONArray("serviceItemData")
    logger.addInfo("Total Rows: " + String(serviceItemData.length()));
	if (serviceItemData.length() > 0){
       action	 = "Update";
       var row = serviceItemData.getJSONObject(0);
   	   var items = row.getJSONArray("items");
   	   var fields = items.getJSONObject(0);
	   SIData.push("Name="+String(fields.get("Name")));
	   SIData.push("id="+id);
	   SIData.push("friendlyName="+friendly_name);
	   SIData.push("os="+os);
	   SIData.push("template="+template);
       //SIData    = SIData.replace("/(.*?)=.*?;(.*)/","$1="+generateUUID()+";$2");
    }else{
        action = "Create";
        SIData = ["Name="+UUIDStr,"id="+id,"friendlyName="+friendly_name,"os="+os,"template="+template];
    }
    addSI(PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action);
}
