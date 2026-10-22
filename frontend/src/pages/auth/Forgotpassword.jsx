import {useState} from "react";
import {Link} from "react-router-dom";
import {apiUrl} from "../../lib/api";
export default function ForgotPassword(){
 const [email,setEmail]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage("");try{
 const r=await fetch(apiUrl("/api/auth/forgot-password"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
 const d=await r.json();setMessage(d.message||"Request completed");
 }catch{setMessage("Password recovery is unavailable");}finally{setBusy(false);}};
 return <main className="flex min-h-screen items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border p-6"><h1 className="text-xl font-bold">Reset password</h1><p>Enter your account email to receive a time-limited reset link.</p><label className="block">Email<input type="email" required className="block w-full rounded border p-2" value={email} onChange={e=>setEmail(e.target.value)}/></label><button disabled={busy} className="rounded bg-blue-700 px-4 py-2 text-white">{busy?"Sending...":"Send reset link"}</button>{message&&<p role="status">{message}</p>}<Link to="/" className="block underline">Back to login</Link></form></main>;
}
