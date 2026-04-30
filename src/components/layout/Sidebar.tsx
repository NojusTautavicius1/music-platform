import { SidebarContent } from "./SidebarContent";

export async function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-[#18181F] border-r border-white/5 hidden lg:flex flex-col overflow-hidden">
      <SidebarContent />
    </aside>
  );
}
