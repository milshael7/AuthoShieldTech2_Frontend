<nav className="layout-nav">
  <NavLink to="/admin" end onClick={() => setMenuOpen(false)}>
    Security Posture
  </NavLink>

  <NavLink to="/admin/assets" onClick={() => setMenuOpen(false)}>
    Assets & Inventory
  </NavLink>

  <NavLink to="/admin/threats" onClick={() => setMenuOpen(false)}>
    Threats
  </NavLink>

  <NavLink to="/admin/incidents" onClick={() => setMenuOpen(false)}>
    Incidents
  </NavLink>

  <NavLink to="/admin/vulnerabilities" onClick={() => setMenuOpen(false)}>
    Vulnerabilities
  </NavLink>

  <NavLink to="/admin/compliance" onClick={() => setMenuOpen(false)}>
    Compliance
  </NavLink>

  <NavLink to="/admin/policies" onClick={() => setMenuOpen(false)}>
    Policies
  </NavLink>

  <NavLink to="/admin/reports" onClick={() => setMenuOpen(false)}>
    Reports
  </NavLink>

  <NavLink to="/admin/trading" onClick={() => setMenuOpen(false)}>
    Trading Oversight
  </NavLink>

  <NavLink to="/admin/notifications" onClick={() => setMenuOpen(false)}>
    Notifications
  </NavLink>

  <hr style={{ opacity: 0.2 }} />

  <NavLink to="/manager" onClick={() => setMenuOpen(false)}>
    Manager View
  </NavLink>

  <NavLink to="/company" onClick={() => setMenuOpen(false)}>
    Company View
  </NavLink>
</nav>
