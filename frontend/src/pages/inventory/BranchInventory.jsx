import { useEffect, useState } from "react";
const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
export default function BranchInventory() {
 const [branches,setBranches]=useState([]),[copies,setCopies]=useState([]),[branch,setBranch]=useState(""),[error,setError]=useState("");
 const [form,setForm]=useState({bookId:"",branchId:"",barcode:"",shelfLocation:""});
 const load=async()=>{const [b,c]=await Promise.all([
 fetch(`${API}/api/inventory/branches`,{headers:auth()}),
 fetch(`${API}/api/inventory/copies`,{headers:auth()})
 ]);if(!b.ok||!c.ok)throw new Error("Inventory unavailable");setBranches(await b.json());setCopies(await c.json());};
 useEffect(()=>{load().catch(e=>setError(e.message));},[]);
 const submit=async e=>{e.preventDefault();setError("");
 try{const r=await fetch(`${API}/api/inventory/copies`,{method:"POST",headers:{...auth(),"Content-Type":"application/json"},body:JSON.stringify(form)});
 if(!r.ok)throw new Error((await r.json()).message||"Unable to register copy");
 setForm({bookId:"",branchId:"",barcode:"",shelfLocation:""});await load();
 }catch(e){setError(e.message);}};
 return <main className="mx-auto max-w-6xl space-y-5 p-6">
 <h1 className="text-2xl font-bold">Branch Inventory</h1>
 {error&&<p role="alert" className="text-red-700">{error}</p>}
 <label>Branch <select className="ml-2 rounded border p-2" value={branch} onChange={e=>setBranch(e.target.value)}>
 <option value="">All branches</option>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
 <form onSubmit={submit} className="flex flex-wrap gap-2 rounded border p-4">
 {["bookId","branchId","barcode","shelfLocation"].map(k=><input key={k} aria-label={k} placeholder={k}
 required={k!=="shelfLocation"} className="rounded border p-2" value={form[k]}
 onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>)}
 <button className="rounded bg-slate-900 px-4 py-2 text-white">Register copy</button></form>
 <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Barcode</th><th>Title</th><th>Branch</th><th>Condition</th><th>Circulation</th></tr></thead>
 <tbody>{copies.filter(c=>!branch||String(c.branch_id)===branch).map(c=><tr key={c.id} className="border-t">
 <td>{c.barcode}</td><td>{c.title}</td><td>{c.branch_name}</td><td>{c.condition}</td><td>{c.circulation_status}</td></tr>)}</tbody></table></div>
 </main>;
}
