export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
};

export const setTokens = (accessToken: string, refreshToken: string, persist: boolean) => {
  if (typeof window === 'undefined') return;
  if (persist) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
  } else {
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

export const updateTokens = (accessToken: string, refreshToken?: string) => {
  if (typeof window === 'undefined') return;
  // 기존 리프레시 토큰이 로컬 스토리지에 있으면 로컬에 저장, 없으면 세션에 저장
  const hasPersistent = !!localStorage.getItem('refreshToken');
  if (hasPersistent) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  } else {
    sessionStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('refreshToken', refreshToken);
    }
  }
};

export const clearTokens = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
};
