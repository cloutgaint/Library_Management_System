import {Navigate,useLocation} from "react-router-dom";
export default function ProtectedRoute({roles,children}){
 const location=useLocation(),token=localStorage.getItem("token");
 let user=null;try{user=JSON.parse(localStorage.getItem("user")||"null");}catch{user=null;}
 if(!token||!user?.role)return <Navigate to="/" replace state={{from:location.pathname}}/>;
 if(roles&&!roles.includes(user.role))return <Navigate to={user.role==="admin"?"/admin":user.role==="librarian"?"/librarian":"/member-dashboard"} replace/>;
 return children;
}
