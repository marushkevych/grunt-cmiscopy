// CmisRequestMock constractor 
module.exports = function(isSuccess, responce){
    this.ok = function(callback){
        // call callback asynchronoulsy
        if(isSuccess) {
            process.nextTick(function(){
                callback(responce);
            });
        }
        return this;
    };
    
    this.notOk = function(callback){
        if(!isSuccess) {
            process.nextTick(function(){
                callback(responce);
            });
        }
        return this;
    };

    this.error = function(callback){
        return this;
    };
    
};



