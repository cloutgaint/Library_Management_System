const CACHE="lms-static-v1";
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(["/","/favicon.svg","/manifest.webmanifest"])));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 const url=new URL(request.url);
 if(url.pathname.startsWith("/api/")||url.pathname.startsWith("/uploads/")||request.headers.has("authorization"))return;
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).catch(()=>caches.match("/")));return;
 }
 if(url.pathname.startsWith("/assets/")||url.pathname==="/favicon.svg"){
  event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
 }
});
