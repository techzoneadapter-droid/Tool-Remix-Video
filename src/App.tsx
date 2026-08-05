import { WorkflowPage } from "@/components/WorkflowPage";
import { workflows } from "@/constants/workflowData";
import { MainLayout } from "@/layouts/MainLayout";
import { AboutPage } from "@/pages/AboutPage";
import { HelpPage } from "@/pages/HelpPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { HomePage } from "@/pages/HomePage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { useAppStore } from "@/stores/AppStore";

export function App() {
  const route = useAppStore((state) => state.route);
  const activeTool = useAppStore((state) => state.activeTool);

  const page = (() => {
    if (route === "tools") return <WorkflowPage workflow={workflows[activeTool]} />;
    if (route === "projects") return <ProjectsPage />;
    if (route === "history") return <HistoryPage />;
    if (route === "templates") return <TemplatesPage />;
    if (route === "settings") return <SettingsPage />;
    if (route === "help") return <HelpPage />;
    if (route === "about") return <AboutPage />;
    return <HomePage />;
  })();

  return <MainLayout>{page}</MainLayout>;
}
