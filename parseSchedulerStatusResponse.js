/*
* Name: parseSchedulerStatusResponse.js
* Author: Chandra Reddy (vgolugur@cisco.com)
* Date: 13th June 2017
* Version: 0.1
* UCSD Version: 6.0
*
* Description:
*	This custom task parse getSchedulerStaus API and creates entry in SiScheduler PSC table.
*
*	//INPUTS:
*    PSCCredentials: [Credential Policy] Mandatory
*    PSCIP: [Generic Text input] Mandatory
*    SITableName: [Generic Text input] Mandatory
*    xmlResponse: [Generic Text input] Mandatory
*
*	//OUTPUTS:
*    None
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
importPackage(javax.xml.xpath);
importPackage(org.w3c.dom);
importPackage(javax.xml.parsers);
loadLibrary("Generic/getAccount");
loadLibrary("Generic/generateUUID");
loadLibrary("PSC/SITasks");

var PSCAccount		= 	getAccount(input.PSCCredentials);
var PSCUser		= 	PSCAccount.getUserName();
var PSCPassword 	= 	PSCAccount.getPassword();
var PSCPort       	= 	parseInt(String(PSCAccount.getPort()));
var PSCProtocol   	= 	String(PSCAccount.getProtocal());
var PSCIP           	= 	input.PSCIP;
var SITableName   	= 	input.SITableName;
var factory         = DocumentBuilderFactory.newInstance();
var builder         = factory.newDocumentBuilder();
var xmlStringBuilder = new StringBuilder();
var id              = input.id;
xmlStringBuilder.append("<?xml version='1.0'?>"+input.xmlResponse);
var respxml         =  new ByteArrayInputStream( xmlStringBuilder.toString().getBytes('UTF-8') );
var doc             =  builder.parse(respxml);
//logger.addInfo("Root element :" + doc.getDocumentElement().getNodeName());
var xPath           =  XPathFactory.newInstance().newXPath();
var expression      =  "/lmc/status";
var list            =  xPath.compile(expression).evaluate(doc, XPathConstants.NODESET);
var UUIDStr,status,action,SIData;
for(var i=0;i<list.length;i++){
	SIData    = [];
	UUIDStr = generateUUID();
    filter = "id="+id;
    try{
        status = list.item(i).getTextContent();
    }catch(err){
        logger.addError("failed:"+err.message);
        continue;
    }
    var data 		    = 	getSITable(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,filter);
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
   	   var iterator = fields.keys();
	   SIData.push("Name="+String(fields.get("Name")));
	   SIData.push("id="+id);
	   SIData.push("status="+status);
       //SIData    = SIData.replace("/(.*?)=.*?;(.*)/","$1="+generateUUID()+";$2");
    }else{
        action = "Create";
        SIData = ["Name="+UUIDStr,"id="+id,"status="+status];
    }
    addSI(PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action);
}
