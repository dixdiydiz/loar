import './sass.scss'
import './less.less'
import './stylus.styl'
import moduleStyle from './m.module.scss'

const StyleText = () => {
  return (
    <div>
      <p className="fontFromSass">this text is red</p>
      <p className="fontFromLess">this text is blue</p>
      <p className="fontFromStyl">this text is green</p>
      <p className={moduleStyle.styleFromModule}>this text from module</p>
    </div>
  )
}
export default StyleText
