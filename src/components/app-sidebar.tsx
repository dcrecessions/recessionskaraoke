"use client";

import {
  LogOut,
  LayoutDashboard,
  QrCode,
  LayoutPanelLeft,
  Search,
  Scan,
  UserPlus,
  Headset,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { NavUser } from "@/components/nav-user";
import { toast } from "sonner";

export function AppSidebar() {
  const router = useRouter();
  const { data: session } = useSession(); // Use session data to determine the user's role.

  // Menu items.
  const items = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Generate QR",
      url: "/generateQR",
      icon: QrCode,
    },
    {
      title: "Scanner",
      url: "/qr-scanner",
      icon: Scan,
    },
  ];

  // Admin-specific items.
  const adminItems = [
    {
      title: "Control Panel",
      url: "/admin/control-panel",
      icon: LayoutPanelLeft,
    },
    {
      title: "View All Songs",
      url: "/admin/view-all-songs",
      icon: Headset,
    },
    {
      title: "User Management",
      url: "/admin/user-management",
      icon: UserPlus,
    },
  ];

  const data = {
    user: {
      name: session?.user?.name || "DC Recessions",
      email: session?.user?.email || "dummyemail@gmail.com",
      avatar: session?.user?.image || "../../recessionsDCLogo.png",
    },
  };

  const logout = async () => {
    try {
      await signOut({ callbackUrl: "/login" }); // NextAuth's signOut method
      toast.success("Successfully logged out", {
        description: "Logout",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error during logout", {
        description: "Failed to logout. Please try again.",
      });
    }
  };

  const DocorADMINisAllowed =
    session?.user?.role === "ADMIN" || session?.user?.role === "DOC";
  const USERorADMINisAllowed =
    session?.user?.role === "ADMIN" || session?.user?.role === "USER";

  return (
    <>
      <Sidebar>
        <SidebarHeader
          onClick={() => router.push("/dashboard")}
          className="transition-colors text-white bg-[var(--leftsidebar-primary)]"
        >
          <NavUser user={data.user} />
        </SidebarHeader>
        <SidebarContent className="text-white bg-[var(--leftsidebar-primary)]">
          {USERorADMINisAllowed && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-white">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="hover:bg-[var(--sidebar-accent)] hover:text-shadow-gray-700 transition-colors"
                      >
                        <a href={item.url}>
                          <item.icon />

                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Admin Section */}
          {session?.user?.role === "ADMIN" && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-white">
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className="hover:bg-[var(--sidebar-accent)] hover:text-shadow-gray-700 transition-colors"
                      >
                        <a href={item.url}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
        <SidebarFooter className="text-white bg-[var(--leftsidebar-primary)]">
          <SidebarMenu>
            <SidebarMenuItem key="logout">
              <SidebarMenuButton
                onClick={logout}
                className="hover:bg-[var(--sidebar-accent)] hover:text-[var(--sidebar-primary)] transition-colors"
              >
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
