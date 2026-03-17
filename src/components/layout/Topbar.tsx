// "use client";

// import { usePathname } from "next/navigation";

// export function Topbar() {
//   const pathname = usePathname();
//   const title =
//     pathname === "/dashboard"
//       ? "Overview"
//       : pathname.startsWith("/invoices")
//       ? "Sales Invoices"
//       : "Inventory System";

//   return (
//     <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur dark:bg-neutral-900/80">
//       <div className="mx-auto flex h-14 items-center justify-between px-4">
//         <div className="text-base font-semibold">{title}</div>
//         <div className="flex items-center gap-3">
//           <input
//             aria-label="Search"
//             placeholder="Search…"
//             className="h-9 w-56 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:bg-neutral-900"
//           />
//           <button className="h-9 rounded-md bg-neutral-900 px-3 text-sm text-white dark:bg-white dark:text-neutral-900">
//             Actions
//           </button>
//         </div>
//       </div>
//     </header>
//   );
// }

// export default Topbar;
