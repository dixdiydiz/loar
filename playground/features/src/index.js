import React from 'react'
import ReactDOM from 'react-dom'
import Env from './importMetaEnv'

ReactDOM.render(
  <React.StrictMode>
    <div>
      <p id="app">1</p>
      <Env />
    </div>
  </React.StrictMode>,
  document.getElementById('root')
)
