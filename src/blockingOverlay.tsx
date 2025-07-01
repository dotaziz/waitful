// import React, { useEffect, useState } from "react";
// import ReactDOM from "react-dom";
// import "./styles/global.css";

// const BlockingOverlay = () => {
//   const [remainingTime, setRemainingTime] = useState<string | null>(null);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       chrome.runtime.sendMessage({ type: "GET_REMAINING_TIME" }, (response) => {
//         const time = response.remainingTime || 0;

//         if (time <= 0) {
//           clearInterval(interval);
//           setRemainingTime(null);
//         } else if (time >= 3600) {
//           const hours = Math.floor(time / 3600);
//           setRemainingTime(`${hours}h`);
//         } else if (time >= 60) {
//           const minutes = Math.floor(time / 60);
//           setRemainingTime(`${minutes}m`);
//         } else {
//           setRemainingTime(`${time}s`);
//         }
//       });
//     }, 1000);

//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 shadow-lg text-center">
//         <h1 className="text-xl font-bold text-red-600 mb-4">Focus Mode Active</h1>
//         <p className="text-sm text-gray-700 mb-4">
//           This site is blocked during focus mode.
//         </p>
//         {remainingTime && (
//           <p className="text-lg font-semibold text-blue-600">
//             Time remaining: {remainingTime}
//           </p>
//         )}
//       </div>
//     </div>
//   );
// };

// const overlayRoot = document.createElement("div");
// overlayRoot.id = "blocking-overlay-root";
// document.body.appendChild(overlayRoot);

// ReactDOM.render(<BlockingOverlay />, overlayRoot);
