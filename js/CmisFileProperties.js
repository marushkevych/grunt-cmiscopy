/* 
 * Factory to create Canonical representation of CMIS file (independent of CMIS dialect)
 */
module.exports = CmisFilePropertiesFactory;

// factory
function CmisFilePropertiesFactory(cmisObject){
    var properties = cmisObject.succinctProperties ? cmisObject.succinctProperties : cmisObject.object.properties;
    
    // CmisFileProperties
    return {
        getName: function(){
            return properties["cmis:name"];
        },
        getObjectId: function(){
            return properties["cmis:objectId"];
        },
        getMimeType: function(){
            return properties["cmis:contentStreamMimeType"];
        },
        getNodeId: function(){
            return properties["alfcmis:nodeRef"];
        },
        getVersion: function(){
            return properties["cmis:versionLabel"];
        },
        
        /**
         * Retrieves latest version of this file using appropeiate cmis protocol depending on CMIS dialect
         * 
         * @argument {CmisSession} cmisSession http://agea.github.io/CmisJS/docs/#!/api/CmisSession
         * @return {CmisFileProperties} new object
         */
        getLatestVersion: function(cmisSession){
            return cmisObject.succinctProperties ? getLatestVersionModern(cmisSession) : getLatestVersionLegacy(cmisSession);
        }
    };
    
    function getLatestVersionModern(cmisSession){
        
    }
    
    function getLatestVersionLegacy(cmisSession){
        
    }
    
}

