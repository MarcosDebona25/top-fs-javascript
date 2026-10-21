// Route chunks are downloaded on demand. These helpers let a hover or a focus start the download a
// little earlier, without pulling the page into the initial bundle.
export const prefetchGame = () => import('../pages/Game.jsx');
export const prefetchRanking = () => import('../pages/Ranking.jsx');
export const prefetchResult = () => import('../pages/Result.jsx');
export const prefetchLogin = () => import('../pages/Login.jsx');
export const prefetchRegister = () => import('../pages/Register.jsx');
export const prefetchNotFound = () => import('../pages/NotFound.jsx');
