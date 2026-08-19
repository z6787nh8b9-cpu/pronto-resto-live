export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** PRONTO business accounts always authenticate through local product routes. */
export const getProntoLoginUrl = () => "/login-restaurant";
