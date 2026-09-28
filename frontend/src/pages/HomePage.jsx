import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import PassengerDashboard from "../components/PassengerDashboard.jsx";
import DriverDashboard from "../components/DriverDashboard.jsx";
import DashboardShell from "../components/DashboardShell.jsx";
import ProfilePage from "../components/ProfilePage.jsx";
import LandingPage from "./LandingPage.jsx";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export default function HomePage() {
  const { user, signOut, updateUser, ready } = useAuth();
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    if (user && activeSection === null) {
      setActiveSection(user.role === "driver" ? "overview" : "ride");
    }
  }, [user, activeSection]);

  if (!ready) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} color="primary" />
          <Typography variant="body2" color="text.secondary">
            Loading Dhaka Tesla Pool…
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!user) return <LandingPage />;

  return (
    <DashboardShell
      user={user}
      signOut={signOut}
      activeSection={activeSection || (user.role === "driver" ? "overview" : "ride")}
      onSelectSection={setActiveSection}
    >
      {activeSection === "profile" ? (
        <ProfilePage user={user} updateUser={updateUser} />
      ) : (
        activeSection &&
        (user.role === "driver" ? (
          <DriverDashboard user={user} section={activeSection} />
        ) : (
          <PassengerDashboard user={user} section={activeSection} />
        ))
      )}
    </DashboardShell>
  );
}
