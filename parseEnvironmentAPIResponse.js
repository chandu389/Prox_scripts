/**
 * @file
 * This Custom task parse the response from getEnvironment API and pushes them to SiEnvironment
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
 * @namespace parseEvironmentAPIResponse
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
var UUIDStr,exists,action,filter,SIData,letter,code,description;
for(var i=0;i<list.length;i++){
	SIData    = [];
  try{
    letter = list.item(i).getElementsByTagName("letter").item(0).getTextContent();
  	code = list.item(i).getElementsByTagName("code").item(0).getTextContent();
  	description = list.item(i).getElementsByTagName("description").item(0).getTextContent();
  }catch(err){
    logger.addError("failed:"+err.message);
    continue;
  }
  filter = "letter="+letter;
  if (letter == null || letter == ""){
	  continue;
  }
  var data 		    = 	getSITable(PSCIP,PSCPort,PSCProtocol,PSCUser,PSCPassword,SITableName,encodeURI(filter));
  var jsonData		= 	String(data);  //Get the JSON String.
  var results 		= 	new JSONObject(jsonData);
  var serviceitem 		= 	results.getJSONObject("serviceitem");
  var serviceItemData 	=	serviceitem.getJSONArray("serviceItemData");
  logger.addInfo("Total Rows: " + String(serviceItemData.length()));
  if (serviceItemData.length() > 0){
	 action	 = "Update";
	 var row = serviceItemData.getJSONObject(0);
	 var items = row.getJSONArray("items");
	 var fields = items.getJSONObject(0);
	 SIData.push("Name="+String(fields.get("Name")));
	 SIData.push("letter="+letter);
	 SIData.push("code="+code);
	 SIData.push("description="+description);
	 //SIData    = SIData.replace("/(.*?)=.*?;(.*)/","$1="+generateUUID()+";$2");
  }else{
	  UUIDStr = generateUUID();
	  action = "Create";
	  SIData = ["Name="+UUIDStr,"letter="+letter,"code="+code,"description="+description];
  }
  addSI(PSCIP,PSCPort,PSCUser,PSCProtocol,PSCPassword,SITableName,SIData,action);
}
