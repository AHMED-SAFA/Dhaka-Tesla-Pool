import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import ElectricCarIcon from "@mui/icons-material/ElectricCar";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import HistoryIcon from "@mui/icons-material/History";
import PersonIcon from "@mui/icons-material/Person";
import SpeedIcon from "@mui/icons-material/Speed";
import BoltIcon from "@mui/icons-material/Bolt";
import LogoutIcon from "@mui/icons-material/Logout";
import Button from "@mui/material/Button";
import { appTheme } from "../theme.js";

export default function DashboardShell({
  user,
  signOut,
  activeSection,
  onSelectSection,
  children,
}) {
  const role = user?.role || "passenger";

  const navigation = useMemo(() => {
    if (role === "driver") {
      return [
        {
          kind: "header",
          title: "Fleet Operations",
        },
        {
          segment: "overview",
          title: "Overview & Dispatch",
          icon: <SpeedIcon />,
        },
        {
          segment: "history",
          title: "Trip History & Earnings",
          icon: <HistoryIcon />,
        },
        {
          kind: "divider",
        },
        {
          kind: "header",
          title: "Account",
        },
        {
          segment: "profile",
          title: "Driver Profile",
          icon: <PersonIcon />,
        },
      ];
    }

    return [
      {
        kind: "header",
        title: "Ride Services",
      },
      {
        segment: "ride",
        title: "Book a Ride",
        icon: <DirectionsCarIcon />,
      },
      {
        segment: "history",
        title: "Trip History",
        icon: <HistoryIcon />,
      },
      {
        kind: "divider",
      },
      {
        kind: "header",
        title: "Account",
      },
      {
        segment: "profile",
        title: "Passenger Profile",
        icon: <PersonIcon />,
      },
    ];
  }, [role]);

  const router = useMemo(() => {
    return {
      pathname: `/${activeSection}`,
      searchParams: new URLSearchParams(),
      navigate: (path) => {
        const seg =
          path.replace(/^\//, "") || (role === "driver" ? "overview" : "ride");
        onSelectSection(seg);
      },
    };
  }, [activeSection, onSelectSection, role]);

  const session = useMemo(() => {
    return {
      user: {
        name: user?.fullName || "User",
        email: user?.email || "",
        image: "",
      },
    };
  }, [user]);

  const authentication = useMemo(() => {
    return {
      signIn: () => {},
      signOut: () => signOut && signOut(),
    };
  }, [signOut]);

  const SidebarFooter = ({ mini }) => (
    <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
      <Button
        fullWidth
        color="error"
        onClick={signOut}
        startIcon={<LogoutIcon />}
        sx={{
          justifyContent: mini ? "center" : "flex-start",
          minWidth: 0,
          px: mini ? 1 : 2,
        }}
      >
        {!mini && "Sign out"}
      </Button>
    </Box>
  );

  return (
    <AppProvider
      navigation={navigation}
      router={router}
      theme={appTheme}
      session={session}
      authentication={authentication}
      branding={{
        title: "Dhaka Tesla Pool",
        logo: (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <BoltIcon fontSize="small" />
          </Box>
        ),
        homeUrl: "/",
      }}
    >
      <DashboardLayout
        sidebarExpandedWidth={260}
        slots={{
          sidebarFooter: SidebarFooter,
          toolbarActions: () => (
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: 1 }}
            >
              <Chip
                label={role.toUpperCase()}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                  bgcolor:
                    role === "driver" ? "secondary.main" : "primary.main",
                  color:
                    role === "driver"
                      ? "secondary.contrastText"
                      : "primary.contrastText",
                }}
              />
            </Box>
          ),
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            minHeight: "100%",
            maxWidth: 1280,
            mx: "auto",
            width: "100%",
          }}
        >
          {children}
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}

DashboardShell.propTypes = {
  user: PropTypes.object.isRequired,
  signOut: PropTypes.func.isRequired,
  activeSection: PropTypes.string.isRequired,
  onSelectSection: PropTypes.func.isRequired,
  children: PropTypes.node,
};
