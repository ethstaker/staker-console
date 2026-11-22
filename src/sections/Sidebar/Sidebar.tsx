import {
  GridView as DashboardIcon,
  Add as AddIcon,
  TrendingUp as TopUpIcon,
  Upgrade as UpgradeIcon,
  SwapHoriz as ConsolidateIcon,
  TrendingDown as WithdrawIcon,
  ExitToApp as ExitIcon,
  Construction as BuildersIcon,
} from "@mui/icons-material";
import { Box, Divider, List, ListItem, ListItemButton } from "@mui/material";
import clsx from "clsx";
import React, { Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";

import { useBuilderSupport } from "@/hooks/useBuilderSupport";

const sidebarItems = [
  { name: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
  { name: "Deposit", icon: AddIcon, path: "/deposit" },
  { name: "Top-Up", icon: TopUpIcon, path: "/topup" },
  { name: "Upgrade", icon: UpgradeIcon, path: "/upgrade" },
  { name: "Consolidate", icon: ConsolidateIcon, path: "/consolidate" },
  { name: "Withdraw", icon: WithdrawIcon, path: "/withdraw" },
  { name: "Exit", icon: ExitIcon, path: "/exit" },
  {
    name: "Builders",
    icon: BuildersIcon,
    path: "/builders",
    requiresBuilderSupport: true,
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { isSupported: isBuilderSupported } = useBuilderSupport();

  return (
    <Box className="flex h-full w-20 flex-col border-r border-divider bg-background">
      <Box className="flex min-h-16 items-center justify-center border-b border-divider">
        <Box
          className="relative group size-10 cursor-pointer items-center justify-center"
          onClick={() => navigate("/dashboard")}
        >
          <img
            src="/eth-staker-logo-light.svg"
            alt="Eth Staker Logo Light"
            className="absolute size-full transition-opacity duration-500 group-hover:opacity-0"
          />

          <img
            src="/eth-staker-logo-dark.svg"
            alt="Eth Staker Logo Dark"
            className="absolute size-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </Box>
      </Box>

      <List className="flex flex-col overflow-y-auto p-1">
        {sidebarItems
          .filter((item) => !item.requiresBuilderSupport || isBuilderSupported)
          .map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isDashboard = item.path === "/dashboard";
            const isEnabled = isDashboard || isConnected;

            return (
              <Fragment key={item.name}>
                {item.requiresBuilderSupport && (
                  <Divider className="mx-2 mb-3 mt-1 border-b-2 border-secondaryText/40" />
                )}
                <ListItem className="mb-2 p-0">
                  <ListItemButton
                    className={clsx(
                      "flex min-h-14 flex-col items-center justify-center gap-2 px-2 py-4",
                      isActive ? "text-primary" : "text-secondaryText",
                    )}
                    onClick={() => navigate(item.path)}
                    disabled={!isEnabled}
                  >
                    <Icon className="text-lg" />
                    <Box className="text-center text-2xs" component="span">
                      {item.name}
                    </Box>
                  </ListItemButton>
                </ListItem>
              </Fragment>
            );
          })}
      </List>
    </Box>
  );
};

export default Sidebar;
