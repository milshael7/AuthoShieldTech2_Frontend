import { createContext, useContext, useEffect, useState } from "react";
import { getToken } from "../lib/api";

const TradingContext = createContext(null);

export function TradingProvider({ children }) {

  const [price,setPrice] = useState(null);
  const [snapshot,setSnapshot] = useState(null);
  const [metrics,setMetrics] = useState(null);

  useEffect(()=>{

    const token = getToken();

    if(!token) return;

    const base =
      import.meta.env.VITE_API_BASE
        .replace("https","wss");

    const ws = new WebSocket(
      `${base}/ws?token=${token}&channel=market`
    );

    const wsPaper = new WebSocket(
      `${base}/ws?token=${token}&channel=paper`
    );

    ws.onmessage = (event)=>{

      try{

        const msg = JSON.parse(event.data);

        if(msg.channel === "market"){

          const btc = msg?.data?.BTCUSDT;

          if(btc?.price){
            setPrice(btc.price);
          }

        }

      }catch{}

    };

    wsPaper.onmessage = (event)=>{

      try{

        const msg = JSON.parse(event.data);

        if(msg.channel === "paper"){

          setSnapshot(msg.snapshot);
          setMetrics(msg.metrics);

        }

      }catch{}

    };

    return ()=>{
      ws.close();
      wsPaper.close();
    };

  },[]);

  return(

    <TradingContext.Provider value={{

      price,

      snapshot,

      metrics

    }}>

      {children}

    </TradingContext.Provider>

  );

}

export function useTrading(){
  return useContext(TradingContext);
}
