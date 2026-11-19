import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { isMemberState } from "../store/slices/authSlice";

/**
 * Who may write in the community (post, comment, like, upload).
 * Guests and logged-in non-members can only read.
 */
export const useCommunityAccess = () => {
  const auth = useSelector((state: RootState) => state.auth);
  const isGuest = !auth.isAuthenticated;
  const canWrite = isMemberState(auth);
  const disabledReason = canWrite
    ? ""
    : isGuest
    ? "いいねやコメントは、ログインしてメンバーになると使えます"
    : "いいねやコメントは、メンバーになると使えます";

  return { isGuest, canWrite, disabledReason };
};
