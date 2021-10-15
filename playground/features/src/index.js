import React from 'react'
import ReactDOM from 'react-dom'
import Env from './importMetaEnv'
import StyleText from './style/styleText'

// const ReqCtx = require.context('./pages', false, /.*.js/)
const ReqCtx = require.context(
  '@pages',
  true,
  /\.\/((?<!__tests__).)*\.route\.js/
)
console.log(ReqCtx.keys())
// console.log(ReqCtx.keys().filter((p) => /\.\//.test(p)))
// const Home = ReqCtx('./pages/index.js').default

ReactDOM.render(
  <React.StrictMode>
    <div>
      <p id="app">1</p>
      <Env />
      <StyleText />
      {/*<Home />*/}
    </div>
  </React.StrictMode>,
  document.getElementById('root')
)
