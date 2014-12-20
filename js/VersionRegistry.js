var jf = require('jsonfile');
var grunt = require('grunt');

var FILE_NAME = 'cmisregistry.json';
var registry;

init();


exports.setVersion = function(documentId, version){
    registry[documentId] = version;
    
    // TODO - save to file (non blocking)
};

exports.hasVersion = function(documentId, version){
    return registry[documentId] === version;
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
}
