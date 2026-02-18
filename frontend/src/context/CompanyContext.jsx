import React, { createContext, useContext, useState, useMemo } from "react";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [activeCompanyName, setActiveCompanyName] = useState("All Companies");

  const mode = activeCompanyId ? "company" : "global";

  const value = useMemo(() => ({
    activeCompanyId,
    activeCompanyName,
    mode,
    setCompany: (company) => {
      if (!company) {
        setActiveCompanyId(null);
        setActiveCompanyName("All Companies");

        localStorage.removeItem("as_active_company");
      } else {
        setActiveCompanyId(company.id);
        setActiveCompanyName(company.name);

        localStorage.setItem(
          "as_active_company",
          JSON.stringify({
            id: company.id,
            name: company.name,
          })
        );
      }
    }
  }), [activeCompanyId, activeCompanyName]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }

  return context;
}
