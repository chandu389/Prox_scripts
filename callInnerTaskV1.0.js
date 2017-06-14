importPackage(com.cloupia.lib.connector.account);
importPackage(com.cloupia.lib.connector.account.credential);

function callInnerTask(){
   var task = ctxt.createInnerTaskContext("custom_PSC_Check_SITable");
   logger.addInfo("PSC Credentials:"+input.PSCCredentials);
   task.setInput("PSCCredentials",input.PSCCredentials);
   task.setInput("PSCIP",input.PSCIP);
   task.setInput("SITableName",input.SITableName);
   task.setInput("filter",input.filter);
   task.execute();
}

var exists = callInnerTask();
if (exists){
   output.action = "Update";
}else{
    output.action = "Create";
}
