// src/pages/MarketRoom.jsx
import React, { useState, useEffect } from 'react';
import SecurityControl from './SecurityControl'; // For managing security features
import MarketDataPanel from './MarketDataPanel'; // Displays market data
import OrderManagement from './OrderManagement'; // Manages orders 

const MarketRoom = () => {
  const [marketData, setMarketData] = useState([]);
  const [error, setError] = useState(null);

  // Function to fetch market data from your API or data source
  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data'); // Adjust API endpoint as needed
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data = await response.json();
      setMarketData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchMarketData(); // Fetch data when component mounts
  }, []);

  return (
    <div>
      <h1>Market Room</h1>
      <SecurityControl />
      {error && <div className="error">{error}</div>}
      <MarketDataPanel data={marketData} /> {/* Passes data to your market data component */}
      <OrderManagement /> {/* Component to handle orders */}
    </div>
  );
};

export default MarketRoom;
