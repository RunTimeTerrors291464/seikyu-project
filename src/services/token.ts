// Token handling utilities, such as checking expiration.
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number;
}

export const isTokenExpired = (token: string) => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const getTokenExpiryTime = (token: string) => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.exp * 1000;
  } catch {
    return 0;
  }
};