import {
  TrendingUp as TopUpIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import { Menu, MenuItem, styled } from "@mui/material";

import { Builder } from "@/types";

const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.common.white,
  display: "flex",
  alignItems: "center",
  gap: "1rem",
}));

interface BuilderMenuParams {
  anchorEl: HTMLElement | null;
  builder: Builder | null;
  onClose: () => void;
  onExit?: (builder: Builder) => void;
  onTopUp?: (builder: Builder) => void;
}

export const BuilderMenu = ({
  anchorEl,
  builder,
  onClose,
  onExit,
  onTopUp,
}: BuilderMenuParams) => {
  const onMenuSelect = (action?: (builder: Builder) => void) => {
    if (builder) {
      action?.(builder);
    }
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl && !!builder}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#333333",
            color: "#ffffff",
            border: "1px solid #404040",
          },
        },
      }}
    >
      <CustomMenuItem disabled={!onTopUp} onClick={() => onMenuSelect(onTopUp)}>
        <TopUpIcon sx={{ fontSize: 18 }} />
        Top-Up
      </CustomMenuItem>
      <CustomMenuItem disabled={!onExit} onClick={() => onMenuSelect(onExit)}>
        <ExitIcon sx={{ fontSize: 18 }} />
        Exit
      </CustomMenuItem>
    </Menu>
  );
};
