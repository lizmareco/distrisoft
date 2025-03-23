'use client'

import { createContext, useContext, useState, useEffect } from "react";
import { HTTP_STATUS_CODES } from "@/src/lib/http/http-status-code";
import jwt from "jsonwebtoken";

const RootContext = createContext({});

export const RootContextProvider = ({ children }) => {
  useEffect(() => {
    console.log('asdfasdf')
  }, []);

  const [session, setSession] = useState(null);
  const globalState = {
    session,
  }
  const setState = {
    setSession,
  }

  return (
    <RootContext.Provider value={{ globalState, setState }}>
      {children}
    </RootContext.Provider>
  )
}



export const useRootContext = () => useContext(RootContext);