var jf = require('jsonfile');
var grunt = require('grunt');

var registry;
var fileName;

exports.getRegistry = function(file) {
    if(registry == null){
        return init(file);
    }
    
    return registry;
};

exports.save = function() {
    
    if(fileName == null){
        // nothing to save
        return;
    }
    try{
        jf.writeFileSync(fileName, registry);
        console.log("registry saved");
    }catch(err){
        console.log(err.stack);
        throw err;
    }
};

function init(file){
    fileName = file;
    if(grunt.file.exists(file)){
        try{
            registry = jf.readFileSync(file);
        }catch(err){
            console.log(err.stack);
            throw err;
        }
    }else{
        registry = {};
    }
    return registry;
}
