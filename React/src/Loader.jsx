import { useState, useEffect } from "react";

const TextLoader = () => {
  const messages = [
    "Fetching URL...",
    "Analyzing Page Structure...",
    "Extracting Meta Description...",
    "Almost done..."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* Aapka favorite simple spinner */}
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      {/* Badalta hua status text */}
      <p className="text-gray-600 font-medium animate-bounce">{messages[index]}</p>
    </div>
  );
};

export default TextLoader;