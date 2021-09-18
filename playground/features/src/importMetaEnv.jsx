// import { useEffect } from 'react'
const Env = () => {
  return (
    <div>
      <p id="machine_env">{import.meta.env.APP_MACHINE}</p>
      <p id="machine_local">{import.meta.env.APP_MACHINELOCAL}</p>
      <p id="machine_extra">{import.meta.env.APP_STAGING_EXPAND}</p>
    </div>
  )
}
export default Env
