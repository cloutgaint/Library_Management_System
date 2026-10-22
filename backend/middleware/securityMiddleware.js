const buckets=new Map();
const loginLimiter=(req,res,next)=>{
 const now=Date.now(),key=req.ip||req.socket.remoteAddress||"unknown";
 const prior=buckets.get(key);
 const state=!prior||now-prior.start>15*60*1000?{start:now,count:0}:prior;
 state.count++;buckets.set(key,state);
 if(buckets.size>10000){for(const [k,v] of buckets){if(now-v.start>15*60*1000)buckets.delete(k);}}
 if(state.count>30){res.setHeader("Retry-After",String(Math.ceil((15*60*1000-(now-state.start))/1000)));return res.status(429).json({message:"Too many authentication attempts. Try again later."});}
 next();
};
const securityHeaders=(_req,res,next)=>{
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("Referrer-Policy","strict-origin-when-cross-origin");
 res.setHeader("X-Frame-Options","DENY");
 res.setHeader("Permissions-Policy","camera=(self), microphone=(), geolocation=()");
 next();
};
module.exports={loginLimiter,securityHeaders};
