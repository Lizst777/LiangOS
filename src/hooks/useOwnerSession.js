import { useContext } from "react";
import { OwnerSessionContext } from "../context/ownerSessionContext";

export function useOwnerSession() {
  const value = useContext(OwnerSessionContext);

  if (!value) {
    throw new Error("useOwnerSession must be used inside OwnerSessionProvider.");
  }

  return value;
}
