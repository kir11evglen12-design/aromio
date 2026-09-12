import spring from "../../assets/seasons/spring.webp";
import summer from "../../assets/seasons/summer.webp";
import autumn from "../../assets/seasons/autumn.webp";
import winter from "../../assets/seasons/winter.webp";
import type { Season } from "./products";

/**
 * Фон карточки: время года, в которое аромат носят. Картинка идёт
 * запылённой — она настроение, а не иллюстрация товара, поэтому подписи
 * под ней нет.
 */
export const SEASON_IMAGES: Record<Season, string> = { spring, summer, autumn, winter };
