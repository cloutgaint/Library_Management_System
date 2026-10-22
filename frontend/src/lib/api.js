export const API_BASE_URL=(import.meta.env.VITE_API_BASE_URL||"").replace(/\/$/,"");
export const apiUrl=path=>`${API_BASE_URL}${path.startsWith("/")?path:"/"+path}`;
export const authHeaders=()=>({Authorization:`Bearer ${localStorage.getItem("token")||""}`});

// Sends a JSON request with the session token and returns { ok, status, data }.
// Never throws for HTTP errors; network failures surface as status 0.
export const apiRequest=async(path,{method="GET",body,headers={}}={})=>{
  const token=localStorage.getItem("token");
  try{
    const response=await fetch(apiUrl(path),{
      method,
      headers:{
        ...(body!==undefined&&{"Content-Type":"application/json"}),
        ...(token&&{Authorization:`Bearer ${token}`}),
        ...headers,
      },
      body:body!==undefined?JSON.stringify(body):undefined,
    });
    const data=await response.json().catch(()=>({}));
    return {ok:response.ok,status:response.status,data};
  }catch{
    return {ok:false,status:0,data:{message:"Unable to connect to server. Please make sure the backend is running."}};
  }
};
