import {
  TrendingUp as TopUpIcon,
  GetApp as PullIcon,
  TrendingDown as WithdrawIcon,
  ExitToApp as ExitIcon,
} from "@mui/icons-material";
import { Menu, MenuItem, styled } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useSelectedValidator } from "@/context/SelectedValidatorContext";
import { Credentials, Validator } from "@/types";

const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
  color: theme.palette.common.white,
  display: "flex",
  alignItems: "center",
  gap: "1rem",
}));

interface ValidatorMenuParams {
  anchorEl: HTMLElement | null;
  hasValidators: boolean;
  isExternal: boolean;
  onClose: () => void;
  validator: Validator | null;
}

export const ValidatorMenu = ({
  anchorEl,
  hasValidators,
  isExternal,
  onClose,
  validator,
}: ValidatorMenuParams) => {
  const navigate = useNavigate();
  const { setSelectedValidator } = useSelectedValidator();

  const onMenuSelect = (path: string) => {
    setSelectedValidator(validator);
    navigate(path);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl && !!validator}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: "#333333",
          color: "#ffffff",
          border: "1px solid #404040",
        },
      }}
    >
      {!isExternal && validator?.credentials === Credentials.execution && (
        <CustomMenuItem onClick={() => onMenuSelect("/upgrade")}>
          <TopUpIcon sx={{ fontSize: 18 }} />
          Upgrade
        </CustomMenuItem>
      )}
      <CustomMenuItem onClick={() => onMenuSelect("/topup")}>
        <TopUpIcon sx={{ fontSize: 18 }} />
        Top-Up
      </CustomMenuItem>
      {hasValidators && validator?.credentials === Credentials.compounding && (
        <CustomMenuItem onClick={() => onMenuSelect("/consolidate")}>
          <PullIcon sx={{ fontSize: 18 }} />
          Consolidate
        </CustomMenuItem>
      )}
      {!isExternal && validator?.credentials === Credentials.compounding && (
        <CustomMenuItem onClick={() => onMenuSelect("/withdraw")}>
          <WithdrawIcon sx={{ fontSize: 18 }} />
          Withdraw
        </CustomMenuItem>
      )}
      {!isExternal && (
        <CustomMenuItem onClick={() => onMenuSelect("/exit")}>
          <ExitIcon sx={{ fontSize: 18 }} />
          Exit
        </CustomMenuItem>
      )}
    </Menu>
  );
};
