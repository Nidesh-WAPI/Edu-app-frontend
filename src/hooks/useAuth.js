import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

export default function useAuth() {
  const dispatch = useDispatch();
  const { token, customer, isAuthenticated } = useSelector((s) => s.auth);
  return { token, customer, isAuthenticated, logout: () => dispatch(logout()) };
}
