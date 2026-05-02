import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { selectCurrentToken, selectCurrentUser } from "../store/authSlice";

export default function WorkPrivateRoute({ children, allowedRoles }) {
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);
  if (!token || !user) return <Navigate to="/work/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/work/login" replace />;
  return children;
}
