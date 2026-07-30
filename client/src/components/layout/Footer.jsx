// import React from 'react';

// export default function Footer() {
//   // Dynamically calculate the current year
//   const currentYear = new Date().getFullYear();

//   return (
//     <footer className="w-full py-5 text-center text-sm text-slate-500 border-t border-slate-200 bg-slate-50/50 mt-auto">
//       <p>
//         &copy; {currentYear} Swastha Hospital (a Unit of Helse Medical Sciences). All Rights Reserved.
//       </p>
//     </footer>
//   );
// }

import React from 'react';
import logo from '../../assets/logo1.png';

export default function Footer() {
  // Dynamically calculate the current year
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-5 text-center text-sm text-slate-500 border-t border-slate-200 bg-slate-50/50 mt-auto">
      <p className="flex items-center justify-center gap-2">
        <img
          src={logo}
          alt="Swastha Hospital Logo"
          className="h-5 w-5 object-contain"
        />
        <span>
          &copy; {currentYear} Swastha Hospital (a Unit of Helse Medical Sciences). All Rights Reserved.
        </span>
      </p>
    </footer>
  );
}