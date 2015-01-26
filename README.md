# grunt-cmiscopy

> Copy files and folders to and from CMS.
This plugin wraps [CmisJS](https://npmjs.org/package/cmis) library to provide an easy way to access content in CMIS repositories like Alfresco.
It can be used to author content (download - edit - upload), to list documents or to use in automated tests to dynamically download content.

> __New in version 0.2.6 - will not overwrite repository files if local version is stale (doesn't match the repository version)__

> __Note: *Starting from version 0.2.0 it will not overwrite files with the same content. Simply download (or upload) the whole directory and only changed files will be updated.*__

## Install

Install this plugin with this command:

```shell
npm install grunt-cmiscopy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cmiscopy');
```

## Usage
`grunt cmiscopy` takes two optional command line parametes - path and action: 
```
grunt cmiscopy:path:action
```
where 
- `path` is path to file or folder in CMS relative to `options.cmisRoot`
- `action` is an action flag. Supported actions:
    - `download` or `d` (default)
    - `upload` or `u`
    - `list` or `l` - list all objects in folder recursively




### Usage Examples

* ```grunt cmiscopy```  will download all content of `$cmisRoot` to `$localRoot`

* ```grunt cmiscopy:pages``` will download `$cmisRoot/pages` folder with it's sub-folders to `$localRoot/pages`

* ```grunt cmiscopy:pages:l``` will list all documents in `$cmisRoot/pages` folder

* ```grunt cmiscopy::l``` will list all documents in `$cmisRoot` folder

* ```grunt cmiscopy:pages:u``` will upload local `$localRoot/pages` to CMS `$cmisRoot/pages`

* ```grunt cmiscopy:pages/faq.html``` will download `$cmisRoot/pages/faq.html` file to local `$localRoot/pages/faq.html`

* ```grunt cmiscopy:pages/faq.html:u``` will upload local `$localRoot/pages/faq.html` to `$cmisRoot/pages/faq.html`



## Configuration

In your project's Gruntfile, add a section named `cmiscopy` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  cmiscopy: {
    options: {
        url: 'http://cmis.alfresco.com/cmisbrowser',
        cmisRoot: '/Sites/mysite',
        localRoot: 'mysite',
        username: 'admin',
        password: 'admin'
    }
  },
});
```

### Options

##### options.url
A url to connect to your CMS

##### options.cmisRoot
The root folder in CMS that will be mapped to the local folder

##### options.localRoot
The local folder `cmisRoot` is mapped to

##### options.username
username to be used when authenticating with CMS

##### options.password
password to be used when authenticating with CMS


## Limitations:
- it will not create new content in CMS
- it will not delete anything

## TODO:
- support for 'checkout' and 'checkin' actions
- creating new content in CMS


## Release History
https://github.com/marushkevych/grunt-cmiscopy/releases
