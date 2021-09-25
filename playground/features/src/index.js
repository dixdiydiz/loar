import React from 'react'
import ReactDOM from 'react-dom'
import Env from './importMetaEnv'
import ScssText from './style/sass'

ReactDOM.render(
  <React.StrictMode>
    <div>
      <p id="app">1</p>
      <Env />
      <ScssText />
    </div>
  </React.StrictMode>,
  document.getElementById('root')
)
