import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UniversalLoader } from "@/components/layout/universal-loader";

export function AuthGuard({ children }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("smartreview-token");
    if (!token) {
      navigate({ to: "/login", replace: true });
      return;
    }

    try {
      // Simple decode to check expiration without verifying signature on client
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expired = payload.exp && Date.now() >= payload.exp * 1000;
      
      if (expired) {
        window.localStorage.removeItem("smartreview-token");
        window.localStorage.removeItem("smartreview-user");
        navigate({ to: "/login", replace: true });
        return;
      }
    } catch (err) {
      window.localStorage.removeItem("smartreview-token");
      window.localStorage.removeItem("smartreview-user");
      navigate({ to: "/login", replace: true });
      return;
    }

    setReady(true);
  }, [navigate]);

  if (!ready) {
    return <UniversalLoader label="Checking your session..." />;
  }

  return children;
}
