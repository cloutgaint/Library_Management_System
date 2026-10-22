import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AuthProvider from "../auth/AuthProvider";
import { AuthContext, useAuth } from "../auth/authContext";
import { dashboardPathForRole, postLoginPath } from "../auth/roles";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/auth/Login";

const USERS = {
  admin: { id: "1", full_name: "Ada Admin", email: "admin@library.test", role: "admin" },
  librarian: { id: "2", full_name: "Lee Librarian", email: "lib@library.test", role: "librarian" },
  member: { id: "3", full_name: "Mo Member", email: "member@library.test", role: "member" },
};

const json = (status, body) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

const Where = () => <p data-testid="location">{useLocation().pathname}</p>;

const LogoutButton = () => <button onClick={useAuth().logout}>Log out</button>;

const AppRoutes = () => (
  <>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><h1>Admin area</h1><LogoutButton /></ProtectedRoute>} />
      <Route path="/librarian" element={<ProtectedRoute roles={["librarian"]}><h1>Librarian area</h1></ProtectedRoute>} />
      <Route path="/student" element={<ProtectedRoute roles={["member"]}><h1>Member area</h1></ProtectedRoute>} />
      <Route path="/issue-book" element={<ProtectedRoute roles={["admin", "librarian"]}><h1>Issue books</h1></ProtectedRoute>} />
    </Routes>
    <Where />
  </>
);

const renderWithSession = (path, session) =>
  render(
    <AuthContext.Provider value={{ notice: "", clearNotice: () => {}, login: vi.fn(), logout: vi.fn(), retry: vi.fn(), ...session }}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>
  );

const renderApp = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );

describe("role routing helpers", () => {
  it("maps every role to its own dashboard", () => {
    expect(dashboardPathForRole("admin")).toBe("/admin");
    expect(dashboardPathForRole("librarian")).toBe("/librarian");
    expect(dashboardPathForRole("member")).toBe("/student");
    expect(dashboardPathForRole("unknown")).toBe("/");
  });

  it("returns to the requested page after login, otherwise the dashboard", () => {
    expect(postLoginPath("librarian", "/issue-book")).toBe("/issue-book");
    expect(postLoginPath("librarian", undefined)).toBe("/librarian");
    expect(postLoginPath("member", "/")).toBe("/student");
  });
});

describe("ProtectedRoute", () => {
  it("sends anonymous visitors to the login page", () => {
    renderWithSession("/admin", { status: "anonymous", user: null });
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(screen.queryByText("Admin area")).not.toBeInTheDocument();
  });

  it("waits for session verification instead of redirecting", () => {
    renderWithSession("/admin", { status: "loading", user: null });
    expect(screen.getByText(/Checking your session/)).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/admin");
  });

  it.each([
    ["member", "/admin", "/student"],
    ["librarian", "/admin", "/librarian"],
    ["member", "/issue-book", "/student"],
    ["admin", "/librarian", "/admin"],
  ])("redirects a %s away from %s to %s", (role, path, destination) => {
    renderWithSession(path, { status: "authenticated", user: USERS[role] });
    expect(screen.getByTestId("location")).toHaveTextContent(destination);
  });

  it.each([
    ["admin", "/admin", "Admin area"],
    ["librarian", "/librarian", "Librarian area"],
    ["member", "/student", "Member area"],
    ["librarian", "/issue-book", "Issue books"],
    ["admin", "/issue-book", "Issue books"],
  ])("lets a %s open %s", (role, path, heading) => {
    renderWithSession(path, { status: "authenticated", user: USERS[role] });
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("sends a signed-in user from the login page to their dashboard", () => {
    renderWithSession("/", { status: "authenticated", user: USERS.librarian });
    expect(screen.getByTestId("location")).toHaveTextContent("/librarian");
  });
});

describe("AuthProvider with the API", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trusts the server's role, not a role edited in localStorage, after a refresh", async () => {
    localStorage.setItem("token", "member-token");
    localStorage.setItem("user", JSON.stringify({ ...USERS.member, role: "admin" }));
    fetchMock.mockImplementation(() => json(200, { user: USERS.member }));

    renderApp("/admin");

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/student"));
    expect(screen.queryByText("Admin area")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("user")).role).toBe("member");
  });

  it("keeps the user on the requested page across a refresh", async () => {
    localStorage.setItem("token", "admin-token");
    fetchMock.mockImplementation(() => json(200, { user: USERS.admin }));

    renderApp("/admin");

    expect(await screen.findByRole("heading", { name: "Admin area" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
    }));
  });

  it("clears an expired session on load and explains why", async () => {
    localStorage.setItem("token", "expired-token");
    fetchMock.mockImplementation(() => json(401, { message: "Invalid or expired token" }));

    renderApp("/admin");

    expect(await screen.findByText(/session has expired/i)).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("logs out everywhere when any API call is rejected with 401", async () => {
    localStorage.setItem("token", "admin-token");
    fetchMock.mockImplementation(() => json(200, { user: USERS.admin }));

    renderApp("/admin");
    await screen.findByRole("heading", { name: "Admin area" });

    fetchMock.mockImplementation(() => json(401, { message: "Session is no longer valid." }));
    await act(() => window.fetch("/api/books", { headers: { Authorization: "Bearer admin-token" } }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/));
    expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it.each([
    ["admin", "/admin"],
    ["librarian", "/librarian"],
    ["member", "/student"],
  ])("routes a %s to %s after logging in on the common login page", async (role, destination) => {
    fetchMock.mockImplementation(() => json(200, { token: `${role}-token`, user: USERS[role] }));

    renderApp("/");

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/login as/i)).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Email"), USERS[role].email);
    await userEvent.type(screen.getByLabelText("Password"), "Correct12345");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent(destination));

    const [, request] = fetchMock.mock.calls[0];
    expect(JSON.parse(request.body)).toEqual({ email: USERS[role].email, password: "Correct12345" });
    expect(localStorage.getItem("token")).toBe(`${role}-token`);
  });

  it("shows the server's generic error for bad credentials", async () => {
    fetchMock.mockImplementation(() => json(401, { message: "Invalid email or password" }));

    renderApp("/");

    await userEvent.type(screen.getByLabelText("Email"), "someone@library.test");
    await userEvent.type(screen.getByLabelText("Password"), "Wrong12345");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });

  it("logout clears the session and returns to login", async () => {
    localStorage.setItem("token", "admin-token");
    fetchMock.mockImplementation(() => json(200, { user: USERS.admin }));

    renderApp("/admin");
    await userEvent.click(await screen.findByRole("button", { name: "Log out" }));

    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
