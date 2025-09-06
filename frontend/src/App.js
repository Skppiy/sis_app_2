import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Outlet, Link } from "@tanstack/react-router";
import { CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Button, Box } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/auth/AuthContext";
// import { SelectedYearProvider } from "@/contexts/SelectedYearContext";
// import { YearSelector } from "@/components/YearSelector";
const theme = createTheme();
const qc = new QueryClient();
function Nav() {
    const items = [
        { to: "/app/dashboard", label: "DASHBOARD" },
        { to: "/app/years", label: "YEARS" },
        { to: "/app/subjects", label: "SUBJECTS" },
        { to: "/app/classrooms", label: "CLASSROOMS" },
        { to: "/app/rooms", label: "ROOMS" },
        { to: "/app/students", label: "STUDENTS" },
    ];
    return (_jsx(AppBar, { position: "static", children: _jsxs(Toolbar, { sx: { gap: 2 }, children: [_jsx(Box, { sx: { fontWeight: 600 }, children: "SIS" }), _jsx(Box, { sx: { flex: 1 } }), items.map((i) => (_jsx(Button, { color: "inherit", component: Link, to: i.to, children: i.label }, i.to)))] }) }));
}
function AppInner() {
    return (_jsxs(_Fragment, { children: [_jsx(Nav, {}), _jsx(Box, { p: 3, children: _jsx(Outlet, {}) })] }));
}
export default function App() {
    return (_jsx(QueryClientProvider, { client: qc, children: _jsx(AuthProvider, { children: _jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsx(AppInner, {})] }) }) }));
}
