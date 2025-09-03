import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";

const MainLayout = () => {
  // The logic for currentPage was in Index.tsx, we can move it here or handle it differently.
  // For now, let's just pass a default value to Header, as it will be refactored to use NavLink.
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
