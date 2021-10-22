import React from 'react'
import ReactDOM from 'react-dom'
import Env from './importMetaEnv'
import StyleText from './style/styleText'

ReactDOM.render(
  <React.StrictMode>
    <div>
      <p id="app">1</p>
      <Env />
      <StyleText />
    </div>
  </React.StrictMode>,
  document.getElementById('root')
)
