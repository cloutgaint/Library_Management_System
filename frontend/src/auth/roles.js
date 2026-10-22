// Landing page for each verified role.
export const DASHBOARD_BY_ROLE = {
  admin: "/admin",
  librarian: "/librarian",
  member: "/student",
};

export const dashboardPathForRole = (role) => DASHBOARD_BY_ROLE[role] || "/";

// After login, return to the page the user was sent away from, if any.
// ProtectedRoute still redirects to the user's own dashboard when the role may not open it.
export const postLoginPath = (role, from) =>
  from && from !== "/" ? from : dashboardPathForRole(role);
