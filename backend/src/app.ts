import { errors } from 'celebrate'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// import { doubleCsrf } from 'csrf-csrf'
import 'dotenv/config'
import express, { json, urlencoded } from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import { rateLimit } from 'express-rate-limit'
import mongoose from 'mongoose'
import path from 'path'
import { DB_ADDRESS, ORIGIN_ALLOW } from './config'
import errorHandler from './middlewares/error-handler'
import serveStatic from './middlewares/serverStatic'
import { csrfProtection, generateCsrfToken } from './middlewares/csrf';
import routes from './routes'

const { PORT = 3000 } = process.env
const app = express()

app.use(cookieParser())

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
})
app.use(limiter)

app.use(mongoSanitize())

// app.use(cors())
app.use(cors({ origin: ORIGIN_ALLOW, credentials: true }))
app.use(express.static(path.join(__dirname, 'public')))

app.use(serveStatic(path.join(__dirname, 'public')))

app.get('/auth/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken:  generateCsrfToken (req, res ) });
});
app.use((req, res, next) => {
    const publicEndpoints = [
        '/auth/login',
        '/auth/register',
        '/auth/csrf-token',
        '/upload',
    ]
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const isPublicEndpoint = publicEndpoints.some(
            (endpoint) =>
                req.path === endpoint || req.path.startsWith(`${endpoint}/`)
        )
        if (isPublicEndpoint) {
            return next()
        }
        return csrfProtection(req, res, next)
    }
    next()
})

app.use(urlencoded({ extended: true }))
app.use(json({ limit: '10kb' }))

app.options('*', cors())
app.use(routes)
app.use(errors())
app.use(errorHandler)

const bootstrap = async () => {
    try {
        await mongoose.connect(DB_ADDRESS)
        await app.listen(PORT, () => console.log('ok'))
    } catch (error) {
        console.error(error)
    }
}

bootstrap()
