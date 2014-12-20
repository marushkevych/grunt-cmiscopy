/* 
 * Factory to create Canonical representation of CMIS file (independent of CMIS dialect)
 */
module.exports = CmisFilePropertiesFactory;

// factory
function CmisFilePropertiesFactory(cmisObject){
    var isModernCmis = cmisObject.succinctProperties != null;
    
    // CmisFileProperties
    return {
        getName: function(){
            return isModernCmis ? cmisObject.succinctProperties["cmis:name"] : cmisObject.object.properties["cmis:name"].value;
        },
        getObjectId: function(){
            return isModernCmis ? cmisObject.succinctProperties["cmis:objectId"] : cmisObject.object.properties["cmis:objectId"].value;
        },
        getMimeType: function(){
            return isModernCmis ? cmisObject.succinctProperties["cmis:contentStreamMimeType"] : cmisObject.object.properties["cmis:contentStreamMimeType"].value;
        },
        getVersion: function(){
            return isModernCmis ? cmisObject.succinctProperties["cmis:versionLabel"] : cmisObject.object.properties["cmis:versionLabel"].value;
        },
        getNodeId: function(){
            return isModernCmis ? cmisObject.succinctProperties["alfcmis:nodeRef"] : cmisObject.object.properties["alfcmis:nodeRef"].value;
        },
        
        /**
         * Retrieves latest version of this file using appropeiate cmis protocol depending on CMIS dialect
         * 
         * @argument {CmisSession} cmisSession http://agea.github.io/CmisJS/docs/#!/api/CmisSession
         * @return {CmisFileProperties} new object
         */
        getLatestVersion: function(cmisSession){
            return isModernCmis ? getLatestVersionModern(cmisSession) : getLatestVersionLegacy(cmisSession);
        }
    };
    
    function getLatestVersionModern(cmisSession){
        
    }
    
    function getLatestVersionLegacy(cmisSession){
        
    }
    
}

