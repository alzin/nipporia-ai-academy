import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Divider, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import { checkPayment, loginWithGoogle } from "../../store/slices/authSlice";
import { fetchDashboardData } from "../../store/slices/dashboardSlice";
import { authService } from "../../services/authService";
import { getStoredPlan } from "../../utils/planStorage";

declare global {
  interface Window {
    google?: any;
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";
let gsiScript: Promise<void> | null = null;
let clientIdRequest: Promise<string | null> | null = null;

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScript) {
    gsiScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiScript = null;
        reject(new Error("Google sign-in script failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return gsiScript;
}

function getClientId(): Promise<string | null> {
  if (!clientIdRequest) {
    clientIdRequest = authService
      .getConfig()
      .then((c) => c.googleClientId)
      .catch(() => {
        clientIdRequest = null;
        return null;
      });
  }
  return clientIdRequest;
}

interface Props {
  /** Button wording: "signin" on the login page, "signup" on the registration page. */
  mode: "signin" | "signup";
}

/**
 * "Google で続ける" button (Google Identity Services). Renders nothing when the
 * server has no Google client ID configured. Signs in existing accounts and
 * creates new ones; afterwards it continues like a normal login.
 */
export const GoogleSignInButton: React.FC<Props> = ({ mode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(false);
  // The login page already shows store errors; the registration page does not.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const onCredential = async (response: { credential?: string }) => {
      if (!response.credential) return;
      setError(null);
      const result = await dispatch(loginWithGoogle(response.credential));
      if (!loginWithGoogle.fulfilled.match(result)) {
        if (mode === "signup") {
          setError((result.payload as { error?: string })?.error || "Google で登録できませんでした。もう一度お試しください。");
        }
        return;
      }
      await dispatch(checkPayment());
      dispatch(fetchDashboardData());
      const plan = getStoredPlan();
      if (plan) {
        // Came from a plan button on the landing page: continue to payment.
        window.location.href = `/subscription?plan=${plan}`;
      } else {
        navigate("/dashboard");
      }
    };

    (async () => {
      const clientId = await getClientId();
      if (!clientId || cancelled) return;
      try {
        await loadGsi();
      } catch {
        return;
      }
      if (cancelled || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
        ux_mode: "popup",
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // The wrapper is hidden until the button exists, so measure the card around it.
      const outer = buttonRef.current.parentElement?.parentElement;
      const width = Math.min(400, Math.max(200, outer?.clientWidth || 320));
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: mode === "signup" ? "signup_with" : "continue_with",
        logo_alignment: "center",
        locale: "ja",
        width,
      });
      setAvailable(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, navigate, mode]);

  return (
    <Box sx={{ display: available ? "block" : "none" }} mb={3}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} role="alert">
          {error}
        </Alert>
      )}
      <Box ref={buttonRef} sx={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
      {mode === "signup" && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
          Google で登録すると、プライバシーポリシーに同意したものとします。
        </Typography>
      )}
      <Divider sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          またはメールアドレスで
        </Typography>
      </Divider>
    </Box>
  );
};
