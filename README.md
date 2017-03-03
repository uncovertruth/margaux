# margaux

[![Build Status][travis-image]][travis-url] [![Build Status][circleci-image]][circleci-url] [![codecov][codecov-image]][codecov-url] [![dependencies Status](https://david-dm.org/uncovertruth/margaux/status.svg)](https://david-dm.org/uncovertruth/margaux) [![devDependencies Status](https://david-dm.org/uncovertruth/margaux/dev-status.svg)](https://david-dm.org/uncovertruth/margaux?type=dev) [![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
> create webpage snapshot

TODO: Fill out this long description.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Install

```sh
npm install
```

## Usage

### Start

```sh
# localhost
npm run serve &
npm start
```

```sh
# with Docker
docker-machine create --driver virtualbox dev
docker-machine start dev
eval $(docker-machine env dev)
docker build -t uncovertruth/margaux-app .
docker run -d -e NODE_NEO_PAGE_CACHE_URL=http://$(docker-machine ip dev)/s3 -p 80:8080 uncovertruth/margaux-app
```

### API

```sh
$ curl http://$(docker-machine ip dev) -d url='http://www.google.com/' -d saveDir='project:xx'
{"url":"project:xx/df20e0e1899143aa8e34bcac298665af.html","viewport":""}
```

## Contribute

PRs accepted.

Small note: If editing the README, please conform to the [standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT © UNCOVER TRUTH Inc.

[travis-image]: https://travis-ci.org/uncovertruth/margaux.svg?branch=master
[travis-url]: https://travis-ci.org/uncovertruth/margaux
[circleci-image]: https://circleci.com/gh/uncovertruth/margaux/tree/master.svg?style=svg&circle-token=c9c9ff761c704d908a035eea8a0d7d5487b868f9
[circleci-url]: https://circleci.com/gh/uncovertruth/margaux/tree/master
[codecov-image]: https://codecov.io/gh/uncovertruth/margaux/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/uncovertruth/margaux
