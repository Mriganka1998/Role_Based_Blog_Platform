
const Limiter=require('express-rate-limit')

const limiter=Limiter({
    windowMs: 15 * 60 * 1000, // 1 minutes
	limit: 600, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
    // skip: ... , // Skip certain IP addresses, e.g. '127.0.0.1' or '2b5b:1e49:8d01:c2ac:fffd:833e:dfee:13a4',
     message: 'Too many requests. Please try again after 1 minute .'
})



module.exports=limiter