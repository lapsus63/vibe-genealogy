import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/genealogy/auth-context";
import AuthenticatedLayout from "./components/layout/AuthenticatedLayout";
import LoginPage from "./pages/LoginPage";
import TreePage from "./pages/TreePage";
import PersonPage from "./pages/PersonPage";
import SearchPage from "./pages/SearchPage";
import KinshipPage from "./pages/KinshipPage";
import ImportExportPage from "./pages/ImportExportPage";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<Navigate to="/tree" replace />} />
          <Route path="/tree" element={<TreePage />} />
          <Route path="/persons/:id" element={<PersonPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/kinship" element={<KinshipPage />} />
          <Route path="/import-export" element={<ImportExportPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
