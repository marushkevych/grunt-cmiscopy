# grunt-cmiscopy

> Copy files and folders to and from CMS.
This plugin wraps [CmisJS](https://npmjs.org/package/cmis) library to provide an easy way to access content in CMIS repositories like Alfresco.
It can be used to author content (download - edit - upload), to list documents or to use in automated tests to dynamically download content.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-cmiscopy --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-cmiscopy');
```

## The "cmiscopy" task

### Overview
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

#### options.url
Type: `String`
Default value: n/a

A url to connect to your CMS

#### options.cmisRoot
Type: `String`
Default value: n/a

The root folder in CMS that will be mapped to the local folder

#### options.localRoot
Type: `String`
Default value: n/a

The local folder `cmisRoot` is mapped to

#### options.username
Type: `String`
Default value: n/a

username to be used when authenticating with CMS

#### options.password
Type: `String`
Default value: n/a

password to be used when authenticating with CMS

### Command Line Arguments
`grunt cmiscopy` takes two optional command line parametes - path and action: `grunt cmiscopy:path:action`
where 
- `path` is path to file or folder in CMS relative to `options.cmisRoot`
- `action` is an action flag. Supported actions:Currently only 'upload' action flag is supported. (default is 'download'). 
    - download or d (default)
    - upload or u
    - list or l - list all objects in folder recursively

If no parameters provided it will download all content of root folder to local project:
```
grunt cmiscopy
```  

This will download file or entire folder from CMS to local project:
```
grunt cmiscopy:path
```

This will upload file or entire folder to CMS
```
grunt cmiscopy:path:upload
```

This will list all documents in folder and subfolders
```
grunt cmiscopy:path:list
```

### Usage Examples
```
grunt cmiscopy:pages
```
will download `$cmisRoot/pages` folder with it's sub-folders to `$localRoot/pages`

```
grunt cmiscopy:pages:l
```
will list all objects recurcively in `$cmisRoot/pages` folder

```
grunt cmiscopy::l
```
will list all objects recurcively in `$cmisRoot` folder

```
grunt cmiscopy:pages:upload
```
will upload local `$localRoot/pages` to CMS `$cmisRoot/pages`

```
grunt cmiscopy:pages/faq.html
```
will download `$cmisRoot/pages/faq.html` file to local `$localRoot/pages/faq.html`

```
grunt cmiscopy:pages/faq.html:upload
```
will upload local `$localRoot/pages/faq.html` to `$cmisRoot/pages/faq.html`

### Limitations:
- it will not create new content in CMS
- it will not delete anything

### TODO:
- support for 'checkout' and 'checkin' actions
- creating new content in CMS


## Release History
https://github.com/marushkevych/grunt-cmiscopy/releases
