---
title: webpack-playground-template
date: 
author: Mizok
version: 0.1.0
tags: 
---

## Introduction

A webpack boilerplate for playground exmaple showcase that uses `ejs` as the template engine.

## Installation And Uasge

- Run `npm install` or `npm i` first to install all dependencies.
- Run `npm run dev` to start the dev-server.

### Where to put my playground examples entry `ejs` files?

You have to put your examples entry `ejs` files in `./src/examples`.

### I would like to make some `ejs` files sharable as templates(ex:header.ejs)，how can I make this?

- You have to put your template `ejs` files in `./src/template`.
- In your `ejs` file which you want to insert your template:

```html
<%- include('./src/template/header.ejs') %>
```

for more detail, please check links below:

- https://github.com/dc7290/template-ejs-loader  
- https://ejs.bootcss.com/  

### How to connect exmaple `ejs` file with exmaple entry `ts` file/ example entry `scss` file?

Here we are actually talking about `webpack` entry chunks.

When designing this boilerplate, we tried to make chunk setting easy.

By Default, if you want your output page name to be `ex1.html`, and you are not going to use a specfic entry chunk, you will need:

- an `ex1.ejs` file in `./src/examples`  
- an `ex1.ts` file in `./src/ts/examples`
- an `ex1.scss` file in `./src/scss/examples`

On the other hand, if you want your output page name to be `ex1.html`,and using a shared chunk named `main`, then you will need:

- an `ex1.main.ejs` file in `./src/examples`  
- an `main.ts` file in `./src/ts/examples`
- an `main.scss` file in `./src/scss/examples`

### I want to get webpack `mode` environment argument in `ejs` file, how can I make this?

Like this (in your `ejs` file) :

```ejs
<div><%= mode%></div> 
```

### My `img` tag is not showing because `webpack` seems to get my `src` wrong.

Check if you are using `alias` path , but not relative path, like below:

```html
<img src="~@img/logo.png">
```




