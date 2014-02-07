// CmisRequestMock constractor 
module.exports = function(isSuccess, responce){
    this.ok = function(callback){
        // call callback immidiately
        if(isSuccess) callback(responce);
        return this;
    };
    
    this.notOk = function(callback){
        if(!isSuccess) callback(responce);
        return this;
    };

    this.error = function(callback){
        return this;
    };
    
};



