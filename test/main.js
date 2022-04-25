import Vue from 'vue';
import VueApp from './Vue/index.vue';

import ReactApp from './React/index.tsx';
import * as React from 'react';
import ReactDOM  from 'react-dom';

window.React = React;

new Vue({
  render: h => h(VueApp)
}).$mount('#vue-app');

ReactDOM.render(
  React.createElement(ReactApp), 
document.querySelector('#react-app'));
