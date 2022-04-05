# Graphminer Client

## Shortcuts

Globally:

- Ctrl+O: go to the chart overview
- CTRL+F: search for entities.

Inside the chart:

- Ctrl+S: saves the chart in edit mode
- Ctrl+E: turns the chart into edit mode
- CTRL+F: search for entities.

## Deployment

Azure and pm2 is tricky. This one works with VueRouter mode set to history:

    pm2 serve /home/site/wwwroot --no-daemon --spa

The corresponding local command after build:

     pm2 serve ./dist --no-daemon --spa --port 7000

## Vue

The application is based on [Vue v2](https://vuejs.org) and [TypeScript](https://www.typescriptlang.org).

## Component and Libraries

All of the libraries used are OSS or can be used in non-commercial or trial mode (Go.js). It's also very easy to replace some parts like e.g. the charts if it doesn't fit your brand or you require more advanced functionality.

Go.js diagramming can be replaced by the sophisticated [yFiles framework](https://yworks.com) but would require a license and a lot more code.

Feel free to [contact us](https://graphsandnetworks.com/contact) if you need guidance.

- [Sliding panels](https://codepen.io/dagalti/pen/ywRNYx)
- [Vueitfy](https://vuetifyjs.com/)
- [Go.js](https://gojs.net/)
- [Faker](https://github.com/faker-js/faker)
- [Lodash](https://github.com/lodash/lodash)
- [Mousetrap](https://github.com/ccampbell/mousetrap)
- [ApexCharts](https://apexcharts.com/)
