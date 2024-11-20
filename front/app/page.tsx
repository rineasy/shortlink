"use client";
import React, { useState } from "react";

function CounterApp() {
  // State to hold the counter value
  const [count, setCount] = useState(0);

  // Function to handle increment
  const handleIncrement = () => {
    setCount(count + 1);
  };

  // Function to handle decrement
  const handleDecrement = () => {
    setCount(count - 1);
  };

  return (
    <div className="flex flex-col items-center min-h-screen justify-center">
      <h1 className="text-3xl font-bold">Counter App</h1>
      <h2 className="text-2xl bg-base-300 h-16 flex items-center text-center px-10 rounded my-4">Current Count: {count}</h2>
      <div className="flex mx-auto w-max gap-2">
        <button
          onClick={handleDecrement}
          className="btn btn-danger"
        >
          Decrement
        </button>
        <button
          onClick={handleIncrement}
          className="btn btn-primary"
        >
          Increment
        </button>
      </div>
    </div>
  );
}

export default CounterApp;
