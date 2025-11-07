import { Navigate, Route, Routes } from "react-router-dom";
import { useAccount } from "wagmi";

import Consolidate from "@/pages/Consolidate";
import Dashboard from "@/pages/Dashboard";
import Deposit from "@/pages/Deposit";
import Exit from "@/pages/Exit";
import PartialWithdraw from "@/pages/PartialWithdraw";
import TopUp from "@/pages/TopUp";
import Upgrade from "@/pages/Upgrade";

function Pages() {
  const { isConnected } = useAccount();

  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      {isConnected && (
        <>
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/topup" element={<TopUp />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/consolidate" element={<Consolidate />} />
          <Route path="/withdraw" element={<PartialWithdraw />} />
          <Route path="/exit" element={<Exit />} />
        </>
      )}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default Pages;
