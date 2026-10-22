import {useEffect,useState} from "react";
import DashboardCard from "../../components/member/DashboardCard";
const API=import.meta.env.VITE_API_BASE_URL||"http://localhost:5000";
export default function MemberDashboard(){
 const [data,setData]=useState(null),[error,setError]=useState("");
 useEffect(()=>{fetch(`${API}/api/dashboard-overview`,{headers:{Authorization:`Bearer ${localStorage.getItem("token")}`}})
 .then(async r=>{if(!r.ok)throw Error("Unable to load member dashboard");setData((await r.json()).overview);})
 .catch(e=>setError(e.message));},[]);
 const cards=[["Active Loans","active_loans","bg-blue-600"],["Returned Books","returned_loans","bg-green-600"],
 ["Overdue Loans","overdue_loans","bg-red-600"],["Due Soon","due_soon","bg-amber-600"],
 ["Reservations","active_reservations","bg-indigo-600"],["Unpaid Fines (₹)","unpaid_fines","bg-orange-600"],
 ["Unread Notifications","unread_notifications","bg-purple-600"]];
 return <main className="min-h-screen bg-gray-100 p-8"><h1 className="mb-6 text-3xl font-bold">Member Dashboard</h1>
 {error&&<p role="alert">{error}</p>}{!data&&!error&&<p>Loading dashboard...</p>}
 {data&&<div className="grid gap-4 md:grid-cols-3">{cards.map(([title,key,color])=>
 <DashboardCard key={key} title={title} value={data[key]??"—"} color={color}/>)}</div>}</main>;
}
