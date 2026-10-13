let accessToken = null;

export const tokenStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (token) => { accessToken = token || null; },
  clear: () => { accessToken = null; },
};
