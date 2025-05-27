# Running setup on Windows

## Getting npm to install @tensorflow/tfjs-node --ignore-scripts
The problem is that NAPI v10 is not supported (which is used by the latest versions of node).  This is a simple fix (at least to get it to install).  Before doing npm install follow these steps:

1. RUN:  `npm install @tensorflow/tfjs-node --ignore-scripts`
2. MODIFY `node_modules\@tensorflow\tfjs-node\package.json` so that the "binary" section looks like this (with 9 and 10 added at the end):
```
  "binary": {
    "module_name": "tfjs_binding",
    "module_path": "./lib/napi-v{napi_build_version}",
    "host": "https://storage.googleapis.com/tf-builds/pre-built-binary",
    "remote_path": "./napi-v{napi_build_version}/{version}/",
    "napi_versions": [
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10
    ]
  }
```
3. RUN `npm rebuild @tensorflow/tfjs-node --build-from-source`

After this is complete:

4. RUN `npm install` to install the rest of the dependencies. Note: You will get errors in the `npm --prefix e2e install` (see below)
5. RUN `npm run build` to build home-gallery
6. RUN `./gallery.js run server` to actually start the server

See (Documentation)[https://docs.home-gallery.org/]


## npm --prefix e2e install

After the install there is a post-install step which installs the dependencies needed for the e2e tests.  
It appears that the error is within exiftool-vendored.

## other errors
- Some of the errors at install are because this is within OneDrive and OneDrive is preventing removing folders
- Some of the errors may be due to the .npmrc file becaues both of the configuration values workspace-concurrency and enable-pre-post-scripts aren't supported.  Can try to remove/comment out those files. 

## other learnings
- run the server by `./gallery.js run server` 
- if run with `./gallery.js run server &` then you will need to kill with the process with `kill %1` where `%1` is the job number (obtained by `jobs`)
- to just modify the frontend after running the server create a new shell
``` 
cd packages/webapp
npm run dev
```
- if getting error that index.html doesn't exist then it is possible the postbuild step didn't run properly for the server, try running `cd packages/server && npm run postbuild`