import { doubleCsrf, DoubleCsrfConfigOptions } from 'csrf-csrf';
import { Request } from 'express'
import 'dotenv/config'
import { CSRF_SECRET } from '../config'

const getSecret = () => CSRF_SECRET || 'csrf-secret';

const getSessionIdentifier = (req: Request) => `${req.ip}|${req.get('User-Agent')}`;

const getCsrfTokenFromRequest = (req: Request) => req.body?.csrfToken || req.headers['x-csrf-token'];

const csrfConfig: DoubleCsrfConfigOptions = {
    getSecret,
    getSessionIdentifier,
    getCsrfTokenFromRequest,
    cookieName: '_csrf',
    cookieOptions: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
    }
};

const { doubleCsrfProtection: csrfProtection, generateCsrfToken } = doubleCsrf(csrfConfig);
export { csrfProtection, generateCsrfToken }