var jf = require('jsonfile');
var grunt = require('grunt');

var FILE_NAME = 'cmisregistry.json';
var registry;

exports.getRegistry = function() {
    if(registry == null){
        return init();
    }
    
    return registry;
};

exports.save = function() {
    try{
        jf.writeFileSync(FILE_NAME, registry);
        console.log("registry saved");
    }catch(err){
        console.log(err.stack);
        throw err;
    }
};

function init(){
    if(grunt.file.exists(FILE_NAME)){
        try{
            registry = jf.readFileSync(FILE_NAME);
        }catch(err){
            console.log(err.stack);
            throw err;
        }
    }else{
        registry = {};
    }
    return registry;
}
