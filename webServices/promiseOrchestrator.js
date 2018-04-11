"use strict";
class PromiseOrchestrator {
  constructor() {
  }

  execute(workFunction,paramArray,option){
    let executor= new PromiseExecutor();
    return executor.execute(workFunction,paramArray,option)
  }

}

//maxSametimeExecution,intervalBewtwenExecution,workFunction
class PromiseExecutor {
  constructor() {
    this.increment=0;
    this.globalOut=[];
  }

  execute(context,workFunction,paramArray,option){
    return new Promise((resolve,reject)=>{
      this.initialPromiseResolve=resolve;
      this.initialPromiseReject=reject;
      this.incrementExecute(context,workFunction,paramArray,option);
    });
  }
  incrementExecute(context,workFunction,paramArray,option){
    //console.log('ALLO');
    if(this.globalOut.length==paramArray.length){
      this.initialPromiseResolve(this.globalOut);
    }else{
      let currentParams=paramArray[this.increment];
      //console.log('apply',currentParams);
      let currentOut= workFunction.apply(context,currentParams).then((currentOut)=>{
        this.globalOut.push(currentOut);
      }).catch((e)=>{
        this.globalOut.push({'$error':e});
        //console.log('Orchestrator Error',e);
      }).then(()=>{
        this.increment++;
        this.incrementExecute(context,workFunction,paramArray,option);
      })
    }
  }
}

module.exports = PromiseOrchestrator;