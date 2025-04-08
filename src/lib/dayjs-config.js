import dayjs from "dayjs"
import weekOfYear from "dayjs/plugin/weekOfYear"
import customParseFormat from "dayjs/plugin/customParseFormat"
import localizedFormat from "dayjs/plugin/localizedFormat"
import isBetween from "dayjs/plugin/isBetween"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"
import localeData from "dayjs/plugin/localeData"
import advancedFormat from "dayjs/plugin/advancedFormat"
import "dayjs/locale/es" // Importar el locale español

// Extender dayjs con los plugins
dayjs.extend(weekOfYear)
dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localeData)
dayjs.extend(advancedFormat)

// Configurar el locale por defecto
dayjs.locale("es")

export default dayjs

