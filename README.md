# margaux

[![Build Status][travis-image]][travis-url]
[![codecov][codecov-image]][codecov-url]
[![dependencies Status](https://david-dm.org/uncovertruth/margaux/status.svg)](https://david-dm.org/uncovertruth/margaux)
[![devDependencies Status](https://david-dm.org/uncovertruth/margaux/dev-status.svg)](https://david-dm.org/uncovertruth/margaux?type=dev)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![CodeFactor](https://www.codefactor.io/repository/github/uncovertruth/margaux/badge)](https://www.codefactor.io/repository/github/uncovertruth/margaux)
[![codebeat badge](https://codebeat.co/badges/eb6850c8-8b85-420e-a76c-e4299849d33b)](https://codebeat.co/projects/github-com-uncovertruth-margaux-master)
[![BCH compliance](https://bettercodehub.com/edge/badge/uncovertruth/margaux?branch=master)](https://bettercodehub.com/results/uncovertruth/margaux)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4ef74a3120a14d6f86559ce95ee4d3ed)](https://www.codacy.com/app/USERDIVE/margaux?utm_source=github.com&utm_medium=referral&utm_content=uncovertruth/margaux&utm_campaign=Badge_Grade)

> create webpage snapshot

TODO: Fill out this long description.

## Table of Contents

* [Install](#install)
* [Usage](#usage)
* [Contribute](#contribute)
* [License](#license)

## Install

```sh
npm install
```

## Usage

### Start

```sh
# localhost
npm start
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
[codecov-image]: https://codecov.io/gh/uncovertruth/margaux/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/uncovertruth/margaux
