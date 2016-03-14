Rancher UI
--------

Perhaps you like managing cattle.

[![Build Status](http://ci.rancher.io/api/badge/github.com/rancher/ui/status.svg?branch=master)](http://ci.rancher.io/github.com/rancher/ui)

## Usage

Prerequisites:
* [Bower](from http://bower.io/)
* [Git](http://git-scm.com/)
* [Node.js](http://nodejs.org/) 0.12.x (with NPM)

If you're on a Mac and use Homebrew, you can follow these steps:
```bash
  brew install node watchman
  npm install -g bower
```
Or via a Ubuntu docker container:
```bash
git clone .... /tmp/repo_git/
docker run --rm -ti -v /tmp/repo_git/ ubuntu bash

apt-get install -y nodejs npm git sudo
ln -s /usr/bin/nodejs /usr/bin/node
npm install -g bower 
sed -ie 's/bower install/bower install --allow-root/' /tmp/repo_git/scripts/update-dependencies
/tmp/repo_git/scripts/update-dependencies
cd /tmp/repo_git/
npm start
````

Setup:
```bash
  git clone 'https://github.com/rancher/ui'
  cd 'ui'
  ./scripts/update-dependencies
```

Run development server:
```bash
  npm start
```

Connect to UI at http://localhost:8000/ .  The server automatically picks up file changes, restarts itself, and reloads the web browser.

Run development server pointed at another instance of the Rancher API
```bash
  RANCHER="http://rancher:8080/" npm start
```

and/or pointed at another instance of the Catalog API
```bash
  CATALOG="http://catalog:8088/" npm start
```

RANCHER and CATALOG can also be `hostname[:port]` or `ip[:port]`.

### Compiling for distribution

The built-in cattle server expects to be run from `/static/` and hosted on a CDN.  To generate the CDN files, run:
```bash
  ./scripts/build-static
```

### Running Tests

```bash
  npm install -g ember-cli
```

* `ember test`
* `ember test`
* `ember test --server`

### Bugs & Issues
Please submit bugs and issues to [rancher/rancher](//github.com/rancher/rancher/issues) with a title starting with `[UI] `.

Or just [click here](//github.com/rancher/rancher/issues/new?title=%5BUI%5D%20) to create a new issue.


#### Useful links

* ember: http://emberjs.com/
* ember-cli: http://www.ember-cli.com/
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

License
=======
Copyright (c) 2014-2015 [Rancher Labs, Inc.](http://rancher.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
