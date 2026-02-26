import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
    level: isProduction ? 'info' : 'debug',
    // Removed transport because pino worker threads crash in Next.js (Turbopack/API routes).
    // To get pretty logs in development, run `npm run dev | pino-pretty` instead.
    // Redact sensitive information
    redact: {
        paths: [
            'user.password',
            'user.email',
            'order.customer_email',
            'order.billing_address',
            'order.shipping_address',
            'card.number',
            'card.cvv',
        ],
        remove: true,
    },
});

// Helper for development-only logs that shouldn't even call the logger in production
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const devLog = (msg: string, ...args: any[]) => {
    if (!isProduction) {
        logger.debug(msg, ...args);
    }
};

export default logger;
