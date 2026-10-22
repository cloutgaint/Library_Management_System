import {useState} from "react";
import {Link} from "react-router-dom";
import {apiUrl} from "../../lib/api";
export default function ResetPassword(){
 const token=new URLSearchParams(window.location.hash.slice(1)).get("token")||"";
 const [password,setPassword]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage("");try{
 const r=await fetch(apiUrl("/api/auth/reset-password"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,newPassword:password})});
 const d=await r.json();setMessage(d.message||"Request completed");
 }catch{setMessage("Unable to reset password");}finally{setBusy(false);}};
 return <main className="flex min-h-screen items-center justify-center p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl border p-6"><h1 className="text-xl font-bold">Choose a new password</h1><label className="block">New password<input type="password" minLength={10} maxLength={128} required className="block w-full rounded border p-2" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy||!token} className="rounded bg-blue-700 px-4 py-2 text-white">Update password</button>{!token&&<p role="alert">Reset token missing</p>}{message&&<p role="status">{message}</p>}<Link to="/" className="block underline">Back to login</Link></form></main>;
}
