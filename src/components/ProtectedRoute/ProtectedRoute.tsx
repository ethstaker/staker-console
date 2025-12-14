import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "wagmi";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isConnected } = useConnection();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate("/", { replace: true });
    }
  }, [isConnected, navigate]);

  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
};
